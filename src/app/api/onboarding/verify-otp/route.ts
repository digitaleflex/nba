import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@nba/lib/get-session"
import { prisma } from "@nba/lib/db"
import { rateLimitMiddleware } from "@nba/lib/rate-limit"

const verifyRateLimit = rateLimitMiddleware({ window: 60, max: 5 })

export async function POST(req: NextRequest) {
  try {
    const blocked = await verifyRateLimit(req, "verify-otp")
    if (blocked) return blocked

    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const body = await req.json()
    const { code } = body

    if (!code || code.length !== 6) {
      return NextResponse.json({ error: "Code invalide" }, { status: 400 })
    }

    const { email, id } = session.user

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
      return NextResponse.json({ error: "Code incorrect ou expiré" }, { status: 400 })
    }

    // Marquer l'email comme vérifié
    await prisma.user.update({
      where: { id },
      data: {
        emailVerified: true,
        // On passe directement à KYC_PENDING vu que le profil est supprimé
        onboardingStatus: "KYC_PENDING"
      }
    })

    // Supprimer le code utilisé
    await prisma.verification.delete({
      where: { id: verification.id }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("OTP Verify error:", error)
    return NextResponse.json({ error: "Erreur lors de la vérification du code" }, { status: 500 })
  }
}
