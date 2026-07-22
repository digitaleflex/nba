import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { requireRole, handleAuthError } from "@nba/lib/auth-utils"
import { rateLimitMiddleware } from "@nba/lib/rate-limit"

const rl = rateLimitMiddleware({ window: 10, max: 30 })

export async function GET(req: NextRequest) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"])
    const rlRes = await rl(req, "fraud:search")
    if (rlRes) return rlRes
    const { searchParams } = new URL(req.url)
    const email = searchParams.get("email")
    if (!email) return NextResponse.json({ error: "email requis" }, { status: 400 })
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, name: true, email: true, isActive: true },
    })
    if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 })
    return NextResponse.json(user)
  } catch (error) {
    return handleAuthError(error)
  }
}
