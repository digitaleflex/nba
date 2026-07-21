import { msg } from "../../../lib/messages"
import { prisma } from "@nba/lib/db"
import { getServerSession } from "@nba/lib/get-session"
import { AuthError } from "@nba/lib/auth-utils"

interface SignalPagination {
  page?: number
  limit?: number
  status?: string
  search?: string
}

export async function getSignals(options: SignalPagination = {}) {
  const session = await getServerSession()
  if (!session) throw new AuthError(msg.auth.UNAUTHORIZED, 401)

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      role: {
        select: { name: true },
      },
    },
  })

  if (!user) throw new AuthError(msg.member.NOT_FOUND_ALT, 404)

  const isAdmin = user.role.name === "ADMIN" || user.role.name === "SUPER_ADMIN"

  if (isAdmin) {
    const { page = 1, limit = 50, status, search } = options
    const skip = (page - 1) * limit

    const where: any = { deletedAt: null }
    if (status) where.status = status
    if (search) where.content = { contains: search, mode: "insensitive" }

    const [signals, total] = await Promise.all([
      prisma.signal.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          content: true,
          imageUrl: true,
          imageUrls: true,
          status: true,
          createdBy: true,
          publishedAt: true,
          scheduledAt: true,
          currentVersion: true,
          createdAt: true,
          updatedAt: true,
          creator: {
            select: { name: true, email: true },
          },
          audience: {
            select: {
              id: true,
              planId: true,
              plan: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.signal.count({ where }),
    ])

    return {
      signals,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }
  }

  const approvedRequests = await prisma.accessRequest.findMany({
    where: {
      userId: session.user.id,
      status: "APPROVED",
    },
    select: {
      planId: true,
    },
  })

  const activePlanIds = approvedRequests.map((r: any) => r.planId)
  if (activePlanIds.length === 0) {
    return []
  }

  const { page = 1, limit = 50 } = options
  const skip = (page - 1) * limit

  return prisma.signal.findMany({
    where: {
      status: "PUBLISHED",
      deletedAt: null,
      audience: {
        some: {
          planId: { in: activePlanIds },
        },
      },
    },
    include: {
      creator: {
        select: { name: true },
      },
    },
    orderBy: { publishedAt: "desc" },
    skip,
    take: limit,
  })
}

export async function deleteSignal(id: string) {
  const session = await getServerSession()
  if (!session) throw new AuthError(msg.auth.UNAUTHORIZED, 401)

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      role: {
        select: { name: true },
      },
    },
  })

  if (!user || (user.role.name !== "ADMIN" && user.role.name !== "SUPER_ADMIN")) {
    throw new AuthError(msg.auth.ACCESS_DENIED, 403)
  }

  return prisma.signal.update({
    where: { id },
    data: {
      deletedAt: new Date(),
    },
  })
}

import { canViewSignal, canUpdateSignal } from "../policies/signal-policy"

export async function getSignalById(id: string) {
  const session = await getServerSession()
  if (!session) throw new AuthError(msg.auth.UNAUTHORIZED, 401)

  const hasAccess = await canViewSignal(session.user.id, id)
  if (!hasAccess) {
    throw new AuthError(msg.auth.ACCESS_DENIED, 403)
  }

  const signal = await prisma.signal.findUnique({
    where: { id, deletedAt: null },
    include: {
      creator: { select: { name: true } },
    },
  })

  return signal
}

export async function getSignalVersions(id: string, userId: string) {
  const signal = await prisma.signal.findUnique({ where: { id } })
  if (!signal) throw new Error(msg.signal.NOT_FOUND)

  const allowed = await canUpdateSignal(userId, signal)
  if (!allowed) throw new AuthError(msg.auth.ACCESS_DENIED, 403)

  return prisma.signalVersion.findMany({
    where: { signalId: id },
    orderBy: { version: "desc" },
    include: {
      updater: { select: { name: true } },
    },
  })
}

export async function getSignalStats(id: string, userId: string) {
  const signal = await prisma.signal.findUnique({ where: { id } })
  if (!signal) throw new Error(msg.signal.NOT_FOUND)

  const allowed = await canUpdateSignal(userId, signal)
  if (!allowed) throw new AuthError(msg.auth.ACCESS_DENIED, 403)

  const [uniqueMembers, aggregate, firstReadRow, reads] = await Promise.all([
    prisma.signalRead.count({ where: { signalId: id } }),
    prisma.signalRead.aggregate({
      where: { signalId: id },
      _sum: { viewCount: true },
    }),
    prisma.signalRead.findFirst({
      where: { signalId: id },
      orderBy: { readAt: "asc" },
      select: { readAt: true },
    }),
    prisma.signalRead.findMany({
      where: { signalId: id },
      orderBy: { readAt: "desc" },
      take: 50,
      include: { user: { select: { name: true, email: true } } },
    }),
  ])

  return {
    uniqueMembers,
    totalViews: aggregate._sum.viewCount ?? 0,
    firstRead: firstReadRow?.readAt ?? null,
    reads: reads.map((r) => ({
      userName: r.user.name,
      userEmail: r.user.email,
      readAt: r.readAt,
      views: r.viewCount,
    })),
  }
}

export type DeliveryChannel = "EMAIL" | "PUSH" | "TELEGRAM" | "WHATSAPP"

export interface ChannelDeliveryStat {
  channel: DeliveryChannel
  sent: number
  failed: number
  pending: number
  bounced: number
}

export interface FailedDelivery {
  channel: DeliveryChannel
  userEmail: string | null
  userName: string | null
  errorMessage: string | null
  sentAt: string | null
}

export interface SignalDeliveryReport {
  signalId: string
  recipientCount: number
  totalDeliveries: number
  sent: number
  failed: number
  pending: number
  bounced: number
  byChannel: ChannelDeliveryStat[]
  failures: FailedDelivery[]
}

const DELIVERY_CHANNELS: DeliveryChannel[] = [
  "EMAIL",
  "PUSH",
  "TELEGRAM",
  "WHATSAPP",
]

export async function getSignalDelivery(
  id: string,
  userId: string,
  includeFailures = true
): Promise<SignalDeliveryReport> {
  const signal = await prisma.signal.findUnique({ where: { id } })
  if (!signal) throw new Error(msg.signal.NOT_FOUND)

  const allowed = await canUpdateSignal(userId, signal)
  if (!allowed) throw new AuthError(msg.auth.ACCESS_DENIED, 403)

  const notificationIds = (
    await prisma.notification.findMany({
      where: { data: { path: ["signalId"], equals: id } },
      select: { id: true },
    })
  ).map((n) => n.id)

  const recipientCount = notificationIds.length

  if (recipientCount === 0) {
    return {
      signalId: id,
      recipientCount: 0,
      totalDeliveries: 0,
      sent: 0,
      failed: 0,
      pending: 0,
      bounced: 0,
      byChannel: DELIVERY_CHANNELS.map((channel) => ({
        channel,
        sent: 0,
        failed: 0,
        pending: 0,
        bounced: 0,
      })),
      failures: [],
    }
  }

  const grouped = await prisma.notificationDelivery.groupBy({
    by: ["channel", "status"],
    where: { notificationId: { in: notificationIds } },
    _count: { _all: true },
  })

  const byChannel: Record<DeliveryChannel, ChannelDeliveryStat> = {
    EMAIL: { channel: "EMAIL", sent: 0, failed: 0, pending: 0, bounced: 0 },
    PUSH: { channel: "PUSH", sent: 0, failed: 0, pending: 0, bounced: 0 },
    TELEGRAM: { channel: "TELEGRAM", sent: 0, failed: 0, pending: 0, bounced: 0 },
    WHATSAPP: { channel: "WHATSAPP", sent: 0, failed: 0, pending: 0, bounced: 0 },
  }

  let sent = 0
  let failed = 0
  let pending = 0
  let bounced = 0

  for (const row of grouped) {
    const count = row._count._all
    const stat = byChannel[row.channel as DeliveryChannel]
    if (!stat) continue
    switch (row.status) {
      case "SENT":
        stat.sent += count
        sent += count
        break
      case "FAILED":
        stat.failed += count
        failed += count
        break
      case "PENDING":
        stat.pending += count
        pending += count
        break
      case "BOUNCED":
        stat.bounced += count
        bounced += count
        break
    }
  }

  let failures: FailedDelivery[] = []
  if (includeFailures) {
    const failedRows = await prisma.notificationDelivery.findMany({
      where: {
        notificationId: { in: notificationIds },
        status: { in: ["FAILED", "BOUNCED"] },
      },
      orderBy: { updatedAt: "desc" },
      take: 50,
      include: {
        notification: { include: { user: { select: { name: true, email: true } } } },
      },
    })
    failures = failedRows.map((d) => ({
      channel: d.channel as DeliveryChannel,
      userEmail: d.notification.user.email,
      userName: d.notification.user.name,
      errorMessage: d.errorMessage,
      sentAt: d.sentAt ? d.sentAt.toISOString() : null,
    }))
  }

  return {
    signalId: id,
    recipientCount,
    totalDeliveries: sent + failed + pending + bounced,
    sent,
    failed,
    pending,
    bounced,
    byChannel: DELIVERY_CHANNELS.map((c) => byChannel[c]),
    failures,
  }
}

