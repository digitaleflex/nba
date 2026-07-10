import { NextResponse } from "next/server"
import { getServerSession } from "@nba/lib/get-session"
import { prisma } from "@nba/lib/db"
import { notify } from "@nba/lib/services/notifications"
import { getQueue } from "@nba/lib/queue"
import { publishNotification } from "@nba/lib/redis-pubsub"
import { sendPushToUser } from "@nba/lib/services/push"

export async function POST(request: Request) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const userDb = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: { select: { name: true } } },
    })

    if (!userDb || (userDb.role.name !== "ADMIN" && userDb.role.name !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const body = await request.json()
    const { title, content, userId } = body

    if (!title || !content) {
      return NextResponse.json({ error: "Titre et contenu requis" }, { status: 400 })
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

      return NextResponse.json({ success: true, count: 1 })
    }

    // Get all active, non-deleted users
    const users = await prisma.user.findMany({
      where: { isActive: true, deletedAt: null },
      select: { id: true, email: true, name: true },
    })

    // Create notification + push + email for each user
    const queue = getQueue("notification-delivery")

    for (const user of users) {
      const notification = await prisma.notification.create({
        data: {
          userId: user.id,
          type: "SYSTEM" as const,
          title,
          body: content,
        },
      })

      // Redis pub/sub for real-time
      publishNotification(user.id, {
        id: notification.id,
        type: "SYSTEM",
        title,
        body: content,
        createdAt: notification.createdAt,
      }).catch(() => {})

      // Push notification
      sendPushToUser(user.id, { title, body: content, url: "/dashboard", tag: notification.id })
        .catch(() => {})

      // Email delivery
      const delivery = await prisma.notificationDelivery.create({
        data: {
          notificationId: notification.id,
          channel: "EMAIL" as const,
          status: "PENDING" as const,
        },
      })

      await queue.add(
        `broadcast-${delivery.id}`,
        {
          deliveryId: delivery.id,
          to: user.email,
          subject: title,
          html: `<p>Bonjour ${user.name},</p><p>${content}</p>`,
        },
        { attempts: 3, backoff: { type: "exponential", delay: 5000 } }
      )
    }

    return NextResponse.json({ success: true, count: users.length })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
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

    if (!userDb || (userDb.role.name !== "ADMIN" && userDb.role.name !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const notifications = await prisma.notification.findMany({
      where: { type: "SYSTEM" },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    })

    return NextResponse.json({ notifications })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
