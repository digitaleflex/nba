import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { requireAuth, handleAuthError } from "@nba/lib/auth-utils"

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth()
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const q = req.nextUrl.searchParams.get("q")?.trim() ?? ""
    const admins = await prisma.user.findMany({
      where: {
        role: { name: { in: ["ADMIN", "SUPER_ADMIN"] } },
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" as const } },
                { email: { contains: q, mode: "insensitive" as const } },
              ],
            }
          : {}),
      },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
      take: 20,
    })

    return NextResponse.json({ admins })
  } catch (error) {
    return handleAuthError(error)
  }
}
