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

    const kycDocs = await prisma.kycDocument.findMany({
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

    // Transformer le format des fichiers si stockés en JSON/chemin
    const formattedDocs = kycDocs.map((doc) => {
      // Reconstruire les URLs de fichiers de façon sécurisée
      const files = [
        { label: "Recto Identité", url: `/api/files/kyc/${doc.id}/document_recto` },
        { label: "Verso Identité", url: `/api/files/kyc/${doc.id}/document_verso` },
        { label: "Selfie", url: `/api/files/kyc/${doc.id}/selfie` },
      ]
      return {
        ...doc,
        files,
      }
    })

    return NextResponse.json(formattedDocs)
  } catch (error) {
    return handleAuthError(error)
  }
}
