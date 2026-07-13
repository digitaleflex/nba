import { NextResponse } from "next/server"
import { requireRole, handleAuthError } from "@nba/lib/auth-utils"
import { prisma } from "@nba/lib/db"

export async function GET() {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"])
    const sessions = await prisma.session.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    })
    return NextResponse.json(sessions)
  } catch (error) {
    return handleAuthError(error)
  }
}
