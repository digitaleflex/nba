import { NextRequest, NextResponse } from "next/server"
import { requireActiveUser, handleAuthError } from "@nba/lib/auth-utils"
import { ErrorCode, errorResponse } from "@nba/lib/errors"
import { prisma } from "@nba/lib/db"
import { rateLimitMiddleware } from "@nba/lib/rate-limit"

const verifyRateLimit = rateLimitMiddleware({ window: 60, max: 5 })

export async function POST(req: NextRequest) {
  try {
    const blocked = await verifyRateLimit(req, "verify-otp")
    if (blocked) return blocked

    const session = await requireActiveUser()
    const { email, id } = session.user

    const body = await req.json()
    const { code } = body

    if (!code || code.length !== 6) {
      return errorResponse(400, ErrorCode.VALIDATION_ERROR, "Code invalide")
    }

    // Trouver le code
    const verification = await prisma.verification.findFirst({
      where: {
        identifier: `otp-${email}`,
        value: code,
        expiresAt: {
          gt: new Date() // Non expiré
        }
      }
    })

    if (!verification) {
      return errorResponse(400, ErrorCode.VALIDATION_ERROR, "Code incorrect ou expiré")
    }

    // Vérifier si l'utilisateur est suspendu avant de marquer comme actif
    const user = await prisma.user.findUnique({ where: { id }, select: { onboardingStatus: true, isActive: true } })

    // Supprimer le code utilisé
    await prisma.verification.delete({
      where: { id: verification.id }
    })

    // Ne pas écraser un statut SUSPENDED
    if (user?.isActive && user.onboardingStatus !== "SUSPENDED") {
      await prisma.user.update({
        where: { id },
        data: {
          emailVerified: true,
          onboardingStatus: "ACTIVE"
        }
      })
    } else {
      await prisma.user.update({
        where: { id },
        data: { emailVerified: true }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleAuthError(error)
  }
}
