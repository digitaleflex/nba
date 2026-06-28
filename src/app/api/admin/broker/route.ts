import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { requireRole, handleAuthError } from "@nba/lib/auth-utils"

export async function GET(request: NextRequest) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"])

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || ""

    const where: any = {}
    if (status && status !== "ALL") {
      where.status = status
    }

    const verifications = await prisma.brokerVerification.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { submittedAt: "desc" },
    })

    const formattedVerifications = verifications.map((doc) => {
      return {
        ...doc,
        videoUrl: `/api/files/broker/${doc.id}/video_proof`,
      }
    })

    return NextResponse.json(formattedVerifications)
  } catch (error) {
    return handleAuthError(error)
  }
}
