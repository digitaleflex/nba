import { NextRequest, NextResponse } from "next/server"
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

    const { email } = session.user

    // Generer code a 6 chiffres
    const code = Math.floor(100000 + Math.random() * 900000).toString()
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
