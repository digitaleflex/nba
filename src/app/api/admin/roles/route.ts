import { NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { requireRole, handleAuthError } from "@nba/lib/auth-utils"
import { getCached } from "@nba/lib/cache"

export async function GET() {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"])

    const roles = await getCached(
      "roles",
      async () =>
        prisma.role.findMany({
          select: { id: true, name: true, description: true },
          orderBy: { name: "asc" },
        }),
      300,
    )

    return NextResponse.json(roles)
  } catch (error) {
    return handleAuthError(error)
  }
}
