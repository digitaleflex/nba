import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { requireRole, handleAuthError } from "@nba/lib/auth-utils"

export async function GET(req: NextRequest) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"])

    const status = req.nextUrl.searchParams.get("status")

    const bugs = await prisma.notification.findMany({
      where: {
        type: "bug_report",
        ...(status
          ? { data: { path: ["status"], equals: status } }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 200,
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

    return NextResponse.json({ bugs })
  } catch (error) {
    return handleAuthError(error)
  }
}
