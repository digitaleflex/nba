import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { requireActiveUser, handleAuthError } from "@nba/lib/auth-utils"
import { msg } from "@nba/lib/messages"

// GET /api/dashboard/redpills — pilules publiées, avec flag `read`
export async function GET(req: NextRequest) {
  try {
    const session = await requireActiveUser()
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")))
    const unreadOnly = searchParams.get("filter") === "unread"

    const where = unreadOnly
      ? { isPublished: true, reads: { none: { userId: session.user.id } } }
      : { isPublished: true }

    const [total, redpills] = await Promise.all([
      prisma.redpill.count({ where }),
      prisma.redpill.findMany({
        where,
        orderBy: { publishedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          title: true,
          content: true,
          audioUrl: true,
          imageUrl: true,
          videoUrl: true,
          format: true,
          series: true,
          episode: true,
          publishedAt: true,
          reads: {
            where: { userId: session.user.id },
            select: { id: true },
          },
        },
      }),
    ])

    const unreadCount = await prisma.redpill.count({
      where: { isPublished: true, reads: { none: { userId: session.user.id } } },
    })

    return NextResponse.json({
      redpills: redpills.map((r) => ({
        id: r.id,
        title: r.title,
        content: r.content,
        audioUrl: r.audioUrl,
        imageUrl: r.imageUrl,
        videoUrl: r.videoUrl,
        format: (r as { format?: string }).format ?? "MIXED",
        series: (r as { series?: string | null }).series ?? null,
        episode: (r as { episode?: number | null }).episode ?? null,
        publishedAt: r.publishedAt,
        read: r.reads.length > 0,
      })),
      unreadCount,
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    })
  } catch (error) {
    if (error instanceof Error && "httpStatus" in error) return handleAuthError(error)
    console.error("Redpills API error:", error)
    return NextResponse.json({ error: msg.signal.INTERNAL_ERROR }, { status: 500 })
  }
}
