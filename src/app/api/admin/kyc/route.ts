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
      `kyc:${status}:${page}:${limit}`,
      async () => {
        const where: any = {}
        if (status && status !== "ALL") {
          where.status = status
        }

        const [kycDocs, total] = await Promise.all([
          prisma.kycDocument.findMany({
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
          prisma.kycDocument.count({ where }),
        ])

        const formattedDocs = kycDocs.map((doc) => {
          const files = [
            doc.frontFilePath ? { label: "Recto Identité", url: `/api/files/${doc.frontFilePath}` } : null,
            doc.backFilePath ? { label: "Verso Identité", url: `/api/files/${doc.backFilePath}` } : null,
          ].filter(Boolean)
          return {
            ...doc,
            files,
          }
        })

        return {
          docs: formattedDocs,
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
