import { NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { requireRole, handleAuthError } from "@nba/lib/auth-utils"

export async function GET() {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"])

    const messages = await prisma.notification.findMany({
      where: { type: "support" },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        title: true,
        body: true,
        data: true,
        createdAt: true,
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    return NextResponse.json({ messages })
  } catch (error) {
    return handleAuthError(error)
  }
}
