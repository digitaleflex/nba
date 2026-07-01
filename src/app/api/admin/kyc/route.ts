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
      // Utiliser les chemins stockés dans la base
      const files = [
        doc.frontFilePath ? { label: "Recto Identité", url: `/api/files/${doc.frontFilePath}` } : null,
        doc.backFilePath ? { label: "Verso Identité", url: `/api/files/${doc.backFilePath}` } : null,
      ].filter(Boolean)
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
