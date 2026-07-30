import { prisma } from "../db"
import { tradingSignalEmail } from "../email"
import { logAuditEvent } from "./audit"
import { readFile } from "fs/promises"
import { join } from "path"
import { logger } from "../logger"

const log = logger.child({ module: "signal-distribution" })

const STORAGE_BASE_PATH = process.cwd() + "/storage"
const imageCache = new Map<string, { promise: Promise<string | null>; expiresAt: number }>()
const IMAGE_CACHE_TTL = 60 * 60 * 1000

function getCachedImage(imageUrl: string): Promise<string | null> | undefined {
  const entry = imageCache.get(imageUrl)
  if (!entry) return undefined
  if (Date.now() > entry.expiresAt) {
    imageCache.delete(imageUrl)
    return undefined
  }
  return entry.promise
}

function setCachedImage(imageUrl: string, promise: Promise<string | null>) {
  if (imageCache.size > 100) {
    const oldest = imageCache.entries().next().value
    if (oldest) imageCache.delete(oldest[0])
  }
  imageCache.set(imageUrl, { promise, expiresAt: Date.now() + IMAGE_CACHE_TTL })
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function runWithThrottle<T>(items: T[], fn: (item: T) => Promise<void>, delayMs: number) {
  for (let i = 0; i < items.length; i++) {
    await fn(items[i])
    if (delayMs > 0 && i < items.length - 1) await sleep(delayMs)
  }
}

async function readImageAsDataUri(path: string): Promise<string | null> {
  try {
    const fullPath = join(STORAGE_BASE_PATH, path)
    const buffer = await readFile(fullPath)
    const ext = path.split(".").pop()?.toLowerCase()
    const mime = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg"
    return `data:${mime};base64,${buffer.toString("base64")}`
  } catch (err) {
    log.error({ err, path }, "Échec lecture image")
    return null
  }
}

function getImageDataUri(imageUrl: string | null): Promise<string | null> {
  if (!imageUrl) return Promise.resolve(null)
  const existing = getCachedImage(imageUrl)
  if (existing) return existing
  const promise = readImageAsDataUri(imageUrl)
  setCachedImage(imageUrl, promise)
  return promise
}

export interface DistributeDeps {
  publish?: (channel: string, payload: unknown) => Promise<void> | void
  enqueueEmail?: (name: string, data: any, opts?: any) => Promise<unknown>
  enqueuePush?: (name: string, data: any, opts?: any) => Promise<unknown>
}

/**
 * Distribue un signal publié à tous les membres actifs ayant accès.
 * Idempotent : vérifie qu'aucune notification n'a déjà été créée pour ce signal/membre.
 */
export async function distributeSignal(signalId: string, deps: DistributeDeps = {}) {
  const publish = deps.publish ?? (async () => {})
  const enqueueEmail = deps.enqueueEmail ?? (async () => {})

  const signal = await prisma.signal.findUnique({
    where: { id: signalId },
    include: { audience: { include: { plan: true } } },
  })

  if (!signal) return { skipped: "not_found" as const }

  if (
    signal.status === "DRAFT" &&
    signal.scheduledAt &&
    new Date(signal.scheduledAt).getTime() <= Date.now() + 5000
  ) {
    await prisma.signal.update({
      where: { id: signalId },
      data: { status: "PUBLISHED", publishedAt: new Date(), jobId: null },
    })
    signal.status = "PUBLISHED"
    signal.publishedAt = new Date()
  }

  if (signal.status !== "PUBLISHED") return { skipped: "not_published" as const }

  const planIds = signal.audience.map((a: any) => a.planId)
  if (planIds.length === 0) return { skipped: "no_audience" as const }

  const existingNotificationIds = new Set<string>(
    (await prisma.notification.findMany({
      where: { type: "SIGNAL", data: { path: ["signalId"], equals: signalId } },
      select: { userId: true },
    })).map((n) => n.userId)
  )

  const imageDataUri = await getImageDataUri(signal.imageUrl)

  const BATCH_SIZE = 200
  const PAGE_SIZE = 500
  let cursor: string | null = null
  let totalRecipients = 0

  const userQueryBase = {
    take: PAGE_SIZE,
    where: {
      isActive: true,
      deletedAt: null,
      id: { not: signal.createdBy, notIn: Array.from(existingNotificationIds) },
      OR: [
        { accessRequests: { some: { planId: { in: planIds }, status: "APPROVED" } } },
        { signalsAccessOverride: true },
      ],
    },
    orderBy: { id: "asc" as const },
  }

  let nextPagePromise: Promise<{ id: string; name: string | null; email: string }[]> | null = prisma.user.findMany(userQueryBase as any)

  while (true) {
    const page = await nextPagePromise
    if (!page || page.length === 0) break

    cursor = page[page.length - 1].id

    nextPagePromise = prisma.user.findMany({
      ...userQueryBase,
      skip: 1,
      cursor: { id: cursor },
    } as any)

    totalRecipients += page.length

    const prefUsers = await prisma.user.findMany({
      where: { id: { in: page.map((m) => m.id) } },
      select: { id: true, metadata: true },
    })
    const pagePrefs = new Map(prefUsers.map((u) => {
      const meta = (u.metadata || {}) as Record<string, any>
      return [u.id, (meta.notificationPrefs || {}).signal !== false] as [string, boolean]
    }))

    const notifyBatch = page.filter((m) => pagePrefs.get(m.id) !== false)

    for (let i = 0; i < page.length; i += BATCH_SIZE) {
      const batch = page.slice(i, i + BATCH_SIZE)
      const notifyIds = new Set(batch.filter((m) => pagePrefs.get(m.id) !== false).map((m) => m.id))

      const created = await prisma.notification.createManyAndReturn({
        data: batch
          .filter((m) => !existingNotificationIds.has(m.id))
          .map((m) => ({
            userId: m.id,
            type: "SIGNAL" as const,
            title: "Nouveau signal de trading",
            body: "Un nouveau signal a été publié pour vos groupes.",
            data: { signalId: signal.id, imageUrl: signal.imageUrl, imageUrls: signal.imageUrls },
          })),
        select: { id: true, userId: true, createdAt: true },
      })

      for (const n of created) existingNotificationIds.add(n.userId)

      const pubSubOps = created.flatMap((n) => {
        const audienceNames = signal.audience.map((a: any) => a.plan.name)
        return [
          publish(`nba:notif:user:${n.userId}`, {
            id: n.id, type: "SIGNAL", title: "Nouveau signal de trading",
            body: "Un nouveau signal a été publié pour vos groupes.",
            data: { signalId: signal.id, imageUrl: signal.imageUrl, imageUrls: signal.imageUrls },
            createdAt: n.createdAt,
          }),
          publish(`nba:signal:user:${n.userId}`, {
            type: "signal.created", signalId: signal.id, publishedAt: signal.publishedAt,
            imageUrl: signal.imageUrl, imageUrls: signal.imageUrls, audience: audienceNames,
          }),
        ]
      })
      await Promise.all(pubSubOps)

      const notifyUsers = created.filter((n) => notifyIds.has(n.userId))

      const [emailDeliveries, pushDeliveries] = await Promise.all([
        prisma.notificationDelivery.createManyAndReturn({
          data: notifyUsers.map((n) => ({
            notificationId: n.id, channel: "EMAIL" as const, status: "PENDING" as const,
          })),
          select: { id: true, notificationId: true },
        }),
        prisma.notificationDelivery.createManyAndReturn({
          data: notifyUsers.map((n) => ({
            notificationId: n.id, channel: "PUSH" as const, status: "PENDING" as const,
          })),
          select: { id: true, notificationId: true },
        }),
      ])

      const emailDeliveriesMap = new Map(emailDeliveries.map((d) => [d.notificationId, d.id]))
      const pushDeliveriesMap = new Map(pushDeliveries.map((d) => [d.notificationId, d.id]))

      const queueOps = notifyUsers.map(async (n) => {
        const user = batch.find((m) => m.id === n.userId)
        if (!user) return

        const emailDeliveryId = emailDeliveriesMap.get(n.id)
        if (emailDeliveryId) {
          const template = tradingSignalEmail({ ...user, name: user.name ?? "" }, signal.content, imageDataUri)
          await enqueueEmail(
            `delivery-${emailDeliveryId}`,
            { deliveryId: emailDeliveryId, to: user.email, subject: template.subject, html: template.html },
            { attempts: 3, backoff: { type: "exponential", delay: 5000 } },
          ).catch((err: any) => {
            log.error({ err, userId: user.id, errorCode: "INTEGRATION_ERROR" }, "Échec mise en file email")
          })
        }

        const pushDeliveryId = pushDeliveriesMap.get(n.id)
        if (pushDeliveryId) {
          deps.enqueuePush?.(
            `push-${n.id}`,
            { deliveryId: pushDeliveryId, userId: user.id, title: "Nouveau signal de trading",
              body: "Un nouveau signal a été publié pour vos groupes.", url: "/dashboard", tag: n.id },
            { attempts: 3, backoff: { type: "exponential", delay: 2000 } },
          ).catch((err: any) => {
            log.error({ err, userId: user.id, errorCode: "INTEGRATION_ERROR" }, "Échec mise en file push")
          })
        }
      })
      await Promise.all(queueOps)
    }

    log.info({ signalId, processed: totalRecipients }, "Progression distribution")
  }

  log.info({ signalId, recipientCount: totalRecipients, skippedCount: existingNotificationIds.size }, "Signal distribution complete")

  try {
    await publish(`nba:signal:admin`, {
      type: "signal.created",
      signalId: signal.id,
      publishedAt: signal.publishedAt,
      imageUrl: signal.imageUrl,
      imageUrls: signal.imageUrls,
      audience: signal.audience.map((a: any) => a.plan.name),
      creatorId: signal.createdBy,
    })
  } catch (err) {
    log.error({ err, errorCode: "DATABASE_CONNECTION" }, "Échec pubsub admin")
  }

  await logAuditEvent({
    userId: signal.createdBy,
    action: "signal.publish",
    resourceType: "signal",
    resourceId: signal.id,
    details: {
      recipientCount: totalRecipients,
      skippedCount: existingNotificationIds.size,
      plans: signal.audience.map((a: any) => a.plan.name),
    },
  })

  return { skipped: null, recipientCount: totalRecipients, skippedCount: existingNotificationIds.size }
}
