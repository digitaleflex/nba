import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getServerSession } from "@nba/lib/get-session"
import { prisma } from "@nba/lib/db"
import { logger } from "@nba/lib/logger"
import { notify } from "@nba/lib/services/notifications"
import { getQueue } from "@nba/lib/queue"
import { publishNotification } from "@nba/lib/redis-pubsub"
import { sendPushToUser } from "@nba/lib/services/push"
import { getCached, invalidatePrefix } from "@nba/lib/cache"
import { rateLimitMiddleware } from "@nba/lib/rate-limit"

const log = logger.child({ module: "admin-notifications" })
import { serverError } from "@nba/lib/api-error"

const broadcastRateLimit = rateLimitMiddleware({ window: 60, max: 5 })

import { csrfCheck } from "@nba/lib/csrf"

export async function POST(request: NextRequest) {
  const csrf = csrfCheck(request)
  if (csrf) return csrf
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const userDb = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: { select: { name: true } } },
    })

    if (!userDb?.role || (userDb.role.name !== "ADMIN" && userDb.role.name !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const body = await request.json()
    const { title, content, userId } = body

    if (!title || !content) {
      return NextResponse.json({ error: "Titre et contenu requis" }, { status: 400 })
    }

    const rateLimitId = userId ? `notif:${userId}` : "notif:broadcast"
    const requestClone = new Request(request.url, { headers: request.headers })
    const rateLimitRes = await broadcastRateLimit(requestClone, rateLimitId)
    if (rateLimitRes) {
      return rateLimitRes
    }

    if (userId) {
      const targetUser = await prisma.user.findUnique({
        where: { id: userId, deletedAt: null },
        select: { email: true, name: true },
      })

      if (!targetUser) {
        return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
      }

      await notify({
        userId,
        type: "SYSTEM",
        title,
        body: content,
        email: {
          to: targetUser.email,
          subject: title,
          html: `<p>Bonjour ${targetUser.name},</p><p>${content}</p>`,
        },
      })

      await invalidatePrefix("ops")
      await invalidatePrefix("notif:")
      return NextResponse.json({ success: true, count: 1 })
    }

    // Get all active, non-deleted users
    const users = await prisma.user.findMany({
      where: { isActive: true, deletedAt: null },
      select: { id: true, email: true, name: true },
    })

    if (users.length === 0) {
      return NextResponse.json({ success: true, count: 0 })
    }

    const queue = getQueue("notification-delivery")

    // 1. Bulk insert notifications (une seule requête)
    const notifications = await prisma.notification.createManyAndReturn({
      data: users.map((user) => ({
        userId: user.id,
        type: "SYSTEM" as const,
        title,
        body: content,
      })),
      select: { id: true, userId: true, createdAt: true },
    })

    // 2. Bulk insert deliveries email (une seule requête)
    const deliveries = await prisma.notificationDelivery.createManyAndReturn({
      data: notifications.map((n) => ({
        notificationId: n.id,
        channel: "EMAIL" as const,
        status: "PENDING" as const,
      })),
      select: { id: true, notificationId: true },
    })

    // 3. Temps réel (pub/sub + push) en parallèle
    const userById = new Map(users.map((u) => [u.id, u]))
    for (const n of notifications) {
      publishNotification(n.userId, {
        id: n.id,
        type: "SYSTEM",
        title,
        body: content,
        createdAt: n.createdAt,
      }).catch((err) => {
        log.warn({ err, userId: n.userId }, "Failed to publish notification")
      })
      sendPushToUser(n.userId, { title, body: content, url: "/dashboard", tag: n.id })
        .catch((err) => {
          log.warn({ err, userId: n.userId }, "Failed to send push notification")
        })
    }

    // 4. Jobs email en lot (une seule opération de queue)
    const notifUserId = new Map(notifications.map((n) => [n.id, n.userId]))
    await queue.addBulk(
      deliveries.map((delivery) => {
        const user = userById.get(notifUserId.get(delivery.notificationId)!)!
        return {
          name: `broadcast-${delivery.id}`,
          data: {
            deliveryId: delivery.id,
            to: user.email,
            subject: title,
            html: `<p>Bonjour ${user.name},</p><p>${content}</p>`,
          },
          opts: { attempts: 3, backoff: { type: "exponential" as const, delay: 5000 } },
        }
      })
    )

    await invalidatePrefix("ops")
    return NextResponse.json({ success: true, count: users.length })
  } catch (error: unknown) {
    return serverError(error, "POST /api/admin/notifications")
  }
}

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const userDb = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: { select: { name: true } } },
    })

    if (!userDb?.role || (userDb.role.name !== "ADMIN" && userDb.role.name !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const notifications = await getCached(
      "notif:history",
      async () =>
        prisma.notification.findMany({
          where: { type: "SYSTEM" },
          orderBy: { createdAt: "desc" },
          take: 50,
          include: {
            user: {
              select: { name: true, email: true },
            },
          },
        }),
      30,
    )

    return NextResponse.json({ notifications })
  } catch (error: unknown) {
    return serverError(error, "GET /api/admin/notifications")
  }
}
