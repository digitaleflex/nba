import { NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { requireRole, handleAuthError } from "@nba/lib/auth-utils"

export async function GET() {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"])

    const roles = await prisma.role.findMany({
      select: { id: true, name: true, description: true },
      orderBy: { name: "asc" },
    })

    return NextResponse.json(roles)
  } catch (error) {
    return handleAuthError(error)
  }
}
