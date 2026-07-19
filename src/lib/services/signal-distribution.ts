import { prisma } from "../db"
import { tradingSignalEmail } from "../email"
import { logAuditEvent } from "./audit"
import { sendPushToUser } from "./push"
import { sendTelegramMessage } from "./telegram"
import { sendWhatsAppSignal } from "./whatsapp"
import { readFile } from "fs/promises"
import { join } from "path"

const STORAGE_BASE_PATH = process.cwd() + "/storage"
const imageCache = new Map<string, Promise<string | null>>()

async function sendTelegramToMember(notificationId: string, userId: string, title: string, body: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { metadata: true },
  })
  const meta = (user?.metadata || {}) as Record<string, any>
  if (!meta.telegram_chat_id || meta.telegram_active === false) return

  const delivery = await prisma.notificationDelivery.create({
    data: { notificationId, channel: "TELEGRAM", status: "PENDING" },
  }).catch((err) => {
    console.error(`[signal-distribution] Failed to create TELEGRAM delivery (notificationId=${notificationId}):`, err)
    return null
  })

  const result = await sendTelegramMessage(
    meta.telegram_chat_id,
    `<b>${title}</b>\n\n${body}`,
    { parseMode: "HTML" },
  )

  if (delivery) {
    await prisma.notificationDelivery.update({
      where: { id: delivery.id },
      data: { status: result.ok ? "SENT" : "FAILED", errorMessage: result.error || null },
    }).catch((err) => {
      console.error(`[signal-distribution] Failed to update TELEGRAM delivery (id=${delivery.id}):`, err)
    })
  }
}

async function sendWhatsAppToMember(notificationId: string, userId: string, title: string, body: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { whatsapp: true, metadata: true },
  })
  const meta = (user?.metadata || {}) as Record<string, any>
  const phone = user?.whatsapp
  if (!phone || meta.whatsapp_active === false) return

  const delivery = await prisma.notificationDelivery.create({
    data: { notificationId, channel: "WHATSAPP", status: "PENDING" },
  }).catch((err) => {
    console.error(`[signal-distribution] Failed to create WHATSAPP delivery (notificationId=${notificationId}):`, err)
    return null
  })

  const result = await sendWhatsAppSignal(phone, title, body)

  if (delivery) {
    await prisma.notificationDelivery.update({
      where: { id: delivery.id },
      data: { status: result.ok ? "SENT" : "FAILED", errorMessage: result.error || null },
    }).catch((err) => {
      console.error(`[signal-distribution] Failed to update WHATSAPP delivery (id=${delivery.id}):`, err)
    })
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
    console.error(`[signal-distribution] Failed to read image ${path}:`, err)
    return null
  }
}

function getImageDataUri(imageUrl: string | null): Promise<string | null> {
  if (!imageUrl) return Promise.resolve(null)
  const existing = imageCache.get(imageUrl)
  if (existing) return existing
  const promise = readImageAsDataUri(imageUrl)
  imageCache.set(imageUrl, promise)
  return promise
}

export interface DistributeDeps {
  publish?: (channel: string, payload: unknown) => Promise<void> | void
  enqueueEmail?: (name: string, data: any, opts?: any) => Promise<unknown>
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

  const members = await prisma.user.findMany({
    where: {
      isActive: true,
      deletedAt: null,
      id: { not: signal.createdBy, notIn: Array.from(existingNotificationIds) },
      OR: [
        { accessRequests: { some: { planId: { in: planIds }, status: "APPROVED" } } },
        { signalsAccessOverride: true },
      ],
    },
  })

  console.log(`[signal-distribution] Distributing signal ${signalId} to ${members.length} new member(s)`)

  const memberIds = members.map((m) => m.id)
  const memberPrefs = new Map<string, boolean>()
  const prefUsers = await prisma.user.findMany({
    where: { id: { in: memberIds } },
    select: { id: true, metadata: true },
  })
  prefUsers.forEach((u) => {
    const meta = (u.metadata || {}) as Record<string, any>
    const prefs = meta.notificationPrefs || {}
    memberPrefs.set(u.id, prefs.signal !== false)
  })

  const imageDataUri = await getImageDataUri(signal.imageUrl)

  const BATCH_SIZE = 50
  for (let i = 0; i < members.length; i += BATCH_SIZE) {
    const batch = members.slice(i, i + BATCH_SIZE)
    await Promise.all(
      batch.map(async (member) => {
        let notification: { id: string; createdAt: Date } | null = null
        try {
          notification = await prisma.notification.create({
            data: {
              userId: member.id,
              type: "SIGNAL",
              title: "Nouveau signal de trading",
              body: `Un nouveau signal a été publié pour vos groupes.`,
              data: { signalId: signal.id, imageUrl: signal.imageUrl, imageUrls: signal.imageUrls },
            },
          })
        } catch (err) {
          console.error(`[signal-distribution] Failed to create notification for user ${member.id}:`, err)
          return
        }

        try {
          await publish(`nba:notif:user:${member.id}`, {
            id: notification.id,
            type: "SIGNAL",
            title: "Nouveau signal de trading",
            body: `Un nouveau signal a été publié pour vos groupes.`,
            data: { signalId: signal.id, imageUrl: signal.imageUrl, imageUrls: signal.imageUrls },
            createdAt: notification.createdAt,
          })
          await publish(`nba:signal:user:${member.id}`, {
            type: "signal.created",
            signalId: signal.id,
            publishedAt: signal.publishedAt,
            imageUrl: signal.imageUrl,
            imageUrls: signal.imageUrls,
            audience: signal.audience.map((a: any) => a.plan.name),
          })
        } catch (err) {
          console.error(`[signal-distribution] pubsub failed for user ${member.id}:`, err)
        }

        const wantsNotifications = memberPrefs.get(member.id) !== false
        if (!wantsNotifications) return

        const delivery = await prisma.notificationDelivery.create({
          data: { notificationId: notification.id, channel: "EMAIL", status: "PENDING" },
        }).catch((err) => {
          console.error(`[signal-distribution] Failed to create EMAIL delivery for user ${member.id}:`, err)
          return null
        })
        if (!delivery) return

        const template = tradingSignalEmail(member, signal.content, imageDataUri)

        await enqueueEmail(
          `delivery-${delivery.id}`,
          { deliveryId: delivery.id, to: member.email, subject: template.subject, html: template.html },
          { attempts: 3, backoff: { type: "exponential", delay: 5000 } },
        ).catch((err) => {
          console.error(`[signal-distribution] Failed to enqueue email for user ${member.id}:`, err)
        })

        const pushResult = await sendPushToUser(member.id, {
          title: "Nouveau signal de trading",
          body: "Un nouveau signal a été publié pour vos groupes.",
          url: "/dashboard",
          tag: notification.id,
        }).catch((err) => {
          console.error(`[signal-distribution] Push failed for user ${member.id}:`, err)
          return { sent: 0, failed: 0 }
        })

        await prisma.notificationDelivery.create({
          data: { notificationId: notification.id, channel: "PUSH", status: pushResult.sent > 0 ? "SENT" : "FAILED" },
        }).catch((err) => {
          console.error(`[signal-distribution] Failed to create PUSH delivery for user ${member.id}:`, err)
        })

        sendTelegramToMember(notification.id, member.id, "Nouveau signal de trading", "Un nouveau signal a été publié pour vos groupes.").catch((err) => {
          console.error(`[signal-distribution] Telegram failed for user ${member.id}:`, err)
        })
        sendWhatsAppToMember(notification.id, member.id, "Nouveau signal de trading", "Un nouveau signal a été publié pour vos groupes.").catch((err) => {
          console.error(`[signal-distribution] WhatsApp failed for user ${member.id}:`, err)
        })
      }),
    )
  }

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
    console.error("[signal-distribution] admin pubsub failed:", err)
  }

  await logAuditEvent({
    userId: signal.createdBy,
    action: "signal.publish",
    resourceType: "signal",
    resourceId: signal.id,
    details: {
      recipientCount: members.length,
      skippedCount: existingNotificationIds.size,
      plans: signal.audience.map((a: any) => a.plan.name),
    },
  })

  return { skipped: null, recipientCount: members.length, skippedCount: existingNotificationIds.size }
}
