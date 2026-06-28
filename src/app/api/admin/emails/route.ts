import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { requireRole, handleAuthError } from "@nba/lib/auth-utils"

export async function GET(request: NextRequest) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"])

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || ""

    const where: any = { channel: "EMAIL" }
    if (status && status !== "ALL") {
      where.status = status
    }

    const deliveries = await prisma.notificationDelivery.findMany({
      where,
      include: {
        notification: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50, // Limite raisonnable pour l'administration
    })

    return NextResponse.json(deliveries)
  } catch (error) {
    return handleAuthError(error)
  }
}
