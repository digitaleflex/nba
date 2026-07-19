import { NextRequest, NextResponse } from "next/server"
import { randomInt } from "crypto"
import { getServerSession } from "@nba/lib/get-session"
import { prisma } from "@nba/lib/db"
import { sendOtpEmail } from "@nba/lib/services/notifications"
import { rateLimitMiddleware } from "@nba/lib/rate-limit"

const otpRateLimit = rateLimitMiddleware({ window: 60, max: 3 })

export async function POST(req: NextRequest) {
  try {
    const blocked = await otpRateLimit(req, "send-otp")
    if (blocked) return blocked

    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Vérifier que le compte n'est pas suspendu
    const me = await prisma.user.findUnique({ where: { id: session.user.id }, select: { isActive: true } })
    if (!me?.isActive) {
      return NextResponse.json({ error: "Votre compte a été suspendu" }, { status: 403 })
    }

    const { email } = session.user

    // Generer code a 6 chiffres (cryptographiquement securise)
    const code = String(randomInt(100000, 1000000))
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    // Sauvegarder l'OTP dans Verification
    await prisma.verification.deleteMany({
      where: { identifier: `otp-${email}` }
    })

    await prisma.verification.create({
      data: {
        identifier: `otp-${email}`,
        value: code,
        expiresAt,
      }
    })

    // Envoyer l'email
    await sendOtpEmail(session.user.name, email, code)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("OTP Send error:", error)
    return NextResponse.json({ error: "Erreur lors de l'envoi du code" }, { status: 500 })
  }
}
