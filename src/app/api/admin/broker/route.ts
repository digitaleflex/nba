import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { requireRole, handleAuthError } from "@nba/lib/auth-utils"
import { getCached } from "@nba/lib/cache"

export async function GET(request: NextRequest) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"])

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || ""
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)))

    const result = await getCached(
      `broker:${status}:${page}:${limit}`,
      async () => {
        const where: any = {}
        if (status && status !== "ALL") {
          where.status = status
        }

        const [verifications, total] = await Promise.all([
          prisma.brokerVerification.findMany({
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
            skip: (page - 1) * limit,
            take: limit,
          }),
          prisma.brokerVerification.count({ where }),
        ])

        const formattedVerifications = verifications.map((doc) => {
          return {
            ...doc,
            videoUrl: doc.videoFilePath ? `/api/files/${doc.videoFilePath}` : null,
          }
        })

        return {
          docs: formattedVerifications,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        }
      },
      15,
    )

    return NextResponse.json(result)
  } catch (error) {
    return handleAuthError(error)
  }
}
