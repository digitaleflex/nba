import { prisma } from "../db"
import { tradingSignalEmail } from "../email"
import { logAuditEvent } from "./audit"
import { sendPushToUser } from "./push"
import { sendTelegramMessage } from "./telegram"
import { sendWhatsAppSignal } from "./whatsapp"
import { readFile } from "fs/promises"
import { join } from "path"

const STORAGE_BASE_PATH = process.cwd() + "/storage"

async function sendTelegramToMember(notificationId: string, userId: string, title: string, body: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { metadata: true },
  })
  const meta = (user?.metadata || {}) as Record<string, any>
  if (!meta.telegram_chat_id || meta.telegram_active === false) return

  const delivery = await prisma.notificationDelivery.create({
    data: { notificationId, channel: "TELEGRAM", status: "PENDING" },
  }).catch(() => null)

  const result = await sendTelegramMessage(
    meta.telegram_chat_id,
    `<b>${title}</b>\n\n${body}`,
    { parseMode: "HTML" },
  )

  if (delivery) {
    await prisma.notificationDelivery.update({
      where: { id: delivery.id },
      data: { status: result.ok ? "SENT" : "FAILED", errorMessage: result.error || null },
    }).catch(() => {})
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
  }).catch(() => null)

  const result = await sendWhatsAppSignal(phone, title, body)

  if (delivery) {
    await prisma.notificationDelivery.update({
      where: { id: delivery.id },
      data: { status: result.ok ? "SENT" : "FAILED", errorMessage: result.error || null },
    }).catch(() => {})
  }
}

async function readImageAsDataUri(path: string): Promise<string | null> {
  try {
    const fullPath = join(STORAGE_BASE_PATH, path)
    const buffer = await readFile(fullPath)
    const ext = path.split(".").pop()?.toLowerCase()
    const mime =
      ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg"
    return `data:${mime};base64,${buffer.toString("base64")}`
  } catch (err) {
    console.error(`[signal] Failed to read image ${path}:`, err)
    return null
  }
}

export interface DistributeDeps {
  // Redis pub/sub publish (channel, payload object)
  publish?: (channel: string, payload: unknown) => Promise<void> | void
  // BullMQ email enqueue
  enqueueEmail?: (name: string, data: any, opts?: any) => Promise<unknown>
}

/**
 * Distribue un signal publié à tous les membres actifs (non supprimés) ayant
 * une demande d'accès APPROUVÉE vers l'un des plans ciblés.
 *
 * - Crée une notification in-app par membre
 * - Publie en temps réel via Redis pub/sub (WebSocket)
 * - Enqueue un job d'envoi email (livraison traçable via Resend externalId)
 *
 * L'expéditeur (signal.createdBy) est exclu pour éviter de recevoir son propre signal.
 *
 * Extrait de workers/queue.ts pour être testable.
 */
export async function distributeSignal(signalId: string, deps: DistributeDeps = {}) {
  const publish = deps.publish ?? (async () => {})
  const enqueueEmail = deps.enqueueEmail ?? (async () => {})

  const signal = await prisma.signal.findUnique({
    where: { id: signalId },
    include: {
      audience: {
        include: {
          plan: true,
        },
      },
    },
  })

  if (!signal) return { skipped: "not_found" as const }

  // Publie automatiquement un brouillon planifié dont l'heure est arrivée
  if (
    signal.status === "DRAFT" &&
    signal.scheduledAt &&
    new Date(signal.scheduledAt).getTime() <= Date.now() + 5000
  ) {
    await prisma.signal.update({
      where: { id: signalId },
      data: {
        status: "PUBLISHED",
        publishedAt: new Date(),
        jobId: null,
      },
    })
    signal.status = "PUBLISHED"
    signal.publishedAt = new Date()
  }

  if (signal.status !== "PUBLISHED") return { skipped: "not_published" as const }

  const planIds = signal.audience.map((a: any) => a.planId)
  if (planIds.length === 0) return { skipped: "no_audience" as const }

  const members = await prisma.user.findMany({
    where: {
      isActive: true,
      deletedAt: null,
      id: { not: signal.createdBy }, // Exclure l'expéditeur (echo)
      OR: [
        {
          accessRequests: {
            some: {
              planId: { in: planIds },
              status: "APPROVED",
            },
          },
        },
        // Membres avec override : reçoivent tous les signaux (email + push) même hors groupe
        { signalsAccessOverride: true },
      ],
    },
  })

  console.log(`[signal] Distributing signal ${signalId} to ${members.length} member(s)`)

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

  const BATCH_SIZE = 50
  for (let i = 0; i < members.length; i += BATCH_SIZE) {
    const batch = members.slice(i, i + BATCH_SIZE)
    await Promise.all(
      batch.map(async (member) => {
        const notification = await prisma.notification.create({
          data: {
            userId: member.id,
            type: "SIGNAL",
            title: "Nouveau signal de trading",
            body: `Un nouveau signal a été publié pour vos groupes.`,
            data: {
              signalId: signal.id,
              imageUrl: signal.imageUrl,
              imageUrls: signal.imageUrls,
            },
          },
        })

        try {
          const channel = `nba:notif:user:${member.id}`
          await publish(channel, {
            id: notification.id,
            type: "SIGNAL",
            title: "Nouveau signal de trading",
            body: `Un nouveau signal a été publié pour vos groupes.`,
            data: {
              signalId: signal.id,
              imageUrl: signal.imageUrl,
              imageUrls: signal.imageUrls,
            },
            createdAt: notification.createdAt,
          })
        } catch (err) {
          console.error("[signal] pubsub failed:", err)
        }

        const wantsNotifications = memberPrefs.get(member.id) !== false

        if (wantsNotifications) {
        const delivery = await prisma.notificationDelivery.create({
          data: {
            notificationId: notification.id,
            channel: "EMAIL",
            status: "PENDING",
          },
        })

        let imageDataUri: string | null = null
        if (signal.imageUrl) {
          imageDataUri = await readImageAsDataUri(signal.imageUrl)
        }
        const template = tradingSignalEmail(member, signal.content, imageDataUri)

        await enqueueEmail(
          `delivery-${delivery.id}`,
          {
            deliveryId: delivery.id,
            to: member.email,
            subject: template.subject,
            html: template.html,
          },
          {
            attempts: 3,
            backoff: { type: "exponential", delay: 5000 },
          },
        )

        // Notification push web (fire-and-forget, ne bloque pas la distribution)
        const pushResult = await sendPushToUser(member.id, {
          title: "Nouveau signal de trading",
          body: "Un nouveau signal a été publié pour vos groupes.",
          url: "/dashboard",
          tag: notification.id,
        }).catch(() => ({ sent: 0, failed: 0 }))

        await prisma.notificationDelivery.create({
          data: {
            notificationId: notification.id,
            channel: "PUSH",
            status: pushResult.sent > 0 ? "SENT" : "FAILED",
          },
        })

        // Telegram
        sendTelegramToMember(notification.id, member.id, "Nouveau signal de trading", "Un nouveau signal a été publié pour vos groupes.").catch(() => {})
        // WhatsApp
        sendWhatsAppToMember(notification.id, member.id, "Nouveau signal de trading", "Un nouveau signal a été publié pour vos groupes.").catch(() => {})
        }
      }),
    )
  }

  await logAuditEvent({
    userId: signal.createdBy,
    action: "signal.publish",
    resourceType: "signal",
    resourceId: signal.id,
    details: {
      recipientCount: members.length,
      plans: signal.audience.map((a: any) => a.plan.name),
    },
  })

  return { skipped: null, recipientCount: members.length }
}
