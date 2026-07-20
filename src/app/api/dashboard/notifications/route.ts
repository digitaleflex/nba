import { NextRequest, NextResponse } from "next/server"
import { prisma, withRetryTransactionArray } from "@nba/lib/db"
import { requireActiveUser, handleAuthError } from "@nba/lib/auth-utils"

export async function GET(req: NextRequest) {
  try {
    const session = await requireActiveUser()

    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")))
    const skip = (page - 1) * limit

    const [total, unreadCount, notifications] = await withRetryTransactionArray([
      prisma.notification.count({ where: { userId: session.user.id } }),
      prisma.notification.count({ where: { userId: session.user.id, readAt: null } }),
      prisma.notification.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]) as [number, number, unknown[]]

    return NextResponse.json({
      notifications,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      unreadCount,
    })
  } catch (error) {
    return handleAuthError(error)
  }
}
