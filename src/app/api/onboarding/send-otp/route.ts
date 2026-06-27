import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@nba/lib/auth"
import { prisma } from "@nba/lib/db"
import { sendEmail, emailOtp } from "@nba/lib/email"

export async function POST() {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
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
    await sendEmail(email, emailOtp(session.user.name, code))

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("OTP Send error:", error)
    return NextResponse.json({ error: "Erreur lors de l'envoi du code" }, { status: 500 })
  }
}
