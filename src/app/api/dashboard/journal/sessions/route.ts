import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@nba/lib/get-session"
import { prisma } from "@nba/lib/db"
import { z } from "zod"
import { handleAuthError } from "@nba/lib/auth-utils"
import { rateLimitMiddleware } from "@nba/lib/rate-limit"

const sessionCreateRateLimit = rateLimitMiddleware({ window: 60, max: 10 })

const sessionCreateSchema = z.object({
  planId: z.string().uuid().optional(),
})

export async function GET() {
  try {
    const sess = await getServerSession()
    if (!sess) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

    const active = await prisma.journalSession.findFirst({
      where: { userId: sess.user.id, isActive: true },
      include: {
        _count: { select: { trades: true } },
      },
    })

    return NextResponse.json({ active })
  } catch (error) {
    return handleAuthError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const sess = await getServerSession()
    if (!sess) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

    const rateLimitRes = await sessionCreateRateLimit(request, `journal:session:${sess.user.id}`)
    if (rateLimitRes) return rateLimitRes

    const body = await request.json()
    const parsed = sessionCreateSchema.parse(body)

    const existing = await prisma.journalSession.findFirst({
      where: { userId: sess.user.id, isActive: true },
    })
    if (existing) {
      return NextResponse.json({ session: existing })
    }

    const session = await prisma.journalSession.create({
      data: { userId: sess.user.id, planId: parsed.planId ?? null },
      include: { plan: { select: { name: true } } },
    })

    return NextResponse.json({ session }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
    }
    return handleAuthError(error)
  }
}
