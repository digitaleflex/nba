import { NextRequest, NextResponse } from "next/server"
import { createSignal } from "@nba/modules/signals/services/create-signal"
import { requirePermission, handleAuthError } from "@nba/lib/auth-utils"
import { prisma } from "@nba/lib/db"

export async function GET(req: NextRequest) {
  try {
    await requirePermission("signals.create")
    const url = new URL(req.url)
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1"))
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") ?? "50")))
    const skip = (page - 1) * limit

    const [signals, total] = await Promise.all([
      prisma.signal.findMany({
        where: { deletedAt: null },
        include: {
          creator: { select: { name: true, email: true } },
          audience: { include: { plan: { select: { name: true } } } },
          reads: { select: { id: true } },
          versions: { orderBy: { version: "desc" }, take: 1 },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
      }),
      prisma.signal.count({ where: { deletedAt: null } }),
    ])

    return NextResponse.json({
      data: signals,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    return handleAuthError(error)
  }
}

export async function POST(req: NextRequest) {
  try {
    await requirePermission("signals.create")
    const body = await req.json()
    const signal = await createSignal(body)
    return NextResponse.json(signal)
  } catch (error) {
    return handleAuthError(error)
  }
}
