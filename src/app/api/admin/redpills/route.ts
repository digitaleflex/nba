import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { requireAdmin, adminError } from "./_auth"
import { csrfCheck } from "@nba/lib/csrf"

// GET /api/admin/redpills — liste toutes les pilules (publiées + brouillons)
export async function GET(req: NextRequest) {
  try {
    await requireAdmin()
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, Number(searchParams.get("page") ?? 1))
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 20)))

    const [total, redpills] = await Promise.all([
      prisma.redpill.count(),
      prisma.redpill.findMany({
        orderBy: { publishedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          creator: { select: { name: true, email: true } },
          _count: { select: { reads: true } },
        },
      }),
    ])

    return NextResponse.json({
      redpills,
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    })
  } catch (error) {
    return adminError(error)
  }
}

// POST /api/admin/redpills — publier une pilule (texte + audioUrl + imageUrl, videoUrl nullable)
export async function POST(req: NextRequest) {
  const csrf = csrfCheck(req)
  if (csrf) return csrf
  try {
    const session = await requireAdmin()
    const body = await req.json()
    const { title, content, audioUrl, imageUrl, videoUrl, isPublished } = body ?? {}

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Le titre est requis" }, { status: 400 })
    }

    const redpill = await prisma.redpill.create({
      data: {
        title: title.trim(),
        content: typeof content === "string" && content.trim() ? content.trim() : null,
        audioUrl: typeof audioUrl === "string" && audioUrl.trim() ? audioUrl.trim() : null,
        imageUrl: typeof imageUrl === "string" && imageUrl.trim() ? imageUrl.trim() : null,
        videoUrl: typeof videoUrl === "string" && videoUrl.trim() ? videoUrl.trim() : null,
        isPublished: isPublished !== false,
        createdBy: session.user.id,
      },
    })

    return NextResponse.json(redpill, { status: 201 })
  } catch (error) {
    return adminError(error)
  }
}
