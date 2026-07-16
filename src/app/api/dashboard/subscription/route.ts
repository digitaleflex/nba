import { NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { requireActiveUser, handleAuthError } from "@nba/lib/auth-utils"

export async function GET() {
  try {
    const session = await requireActiveUser()

    const requests = await prisma.accessRequest.findMany({
      where: { userId: session.user.id },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ requests })
  } catch (error) {
    return handleAuthError(error)
  }
}
