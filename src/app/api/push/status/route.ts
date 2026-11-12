import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { requireActiveUser, handleAuthError } from "@nba/lib/auth-utils"
import { rateLimitMiddleware } from "@nba/lib/rate-limit"

const statusRateLimit = rateLimitMiddleware({ window: 60, max: 30 })

// GET /api/push/status?endpoint=<url encodée>
export async function GET(req: NextRequest) {
  try {
    const session = await requireActiveUser()

    const rateLimitRes = await statusRateLimit(req, `push-status:${session.user.id}`)
    if (rateLimitRes) return rateLimitRes

    const { searchParams } = new URL(req.url)
    const endpoint = searchParams.get("endpoint")
    if (!endpoint) {
      return NextResponse.json({ error: "endpoint requis" }, { status: 400 })
    }

    const sub = await prisma.pushSubscription.findFirst({
      where: { userId: session.user.id, endpoint },
      select: { id: true },
    })

    return NextResponse.json({ registered: !!sub })
  } catch (error) {
    return handleAuthError(error)
  }
}
