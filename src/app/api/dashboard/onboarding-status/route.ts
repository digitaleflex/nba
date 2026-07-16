import { NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { requireAuth, handleAuthError } from "@nba/lib/auth-utils"

export async function GET() {
  try {
    const session = await requireAuth()

    const userId = session.user.id

    const [user, kycDoc, brokerVerif] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          emailVerified: true,
          country: true,
          phone: true,
          whatsapp: true,
          signalsAccessOverride: true,
          role: { select: { name: true } },
        },
      }),
      prisma.kycDocument.findFirst({
        where: { userId },
        orderBy: { submittedAt: "desc" },
      }),
      prisma.brokerVerification.findFirst({
        where: { userId },
        orderBy: { submittedAt: "desc" },
      }),
    ])

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
    }

    const isAdmin = user.role.name === "ADMIN" || user.role.name === "SUPER_ADMIN"

    // 1. Calculer la complétion du profil
    const profileFields = [user.country, user.phone, user.whatsapp]
    const completedFields = profileFields.filter(f => f !== null && f !== undefined && f.trim() !== "").length
    const profileCompletion = Math.round((completedFields / profileFields.length) * 100)
    const isProfileComplete = profileCompletion === 100

    // 2. Statut KYC
    const kycStatus = kycDoc?.status ?? null
    const isKycSubmitted = kycDoc !== null
    const isKycApproved = kycStatus === "APPROVED"

    // 3. Statut Broker
    const brokerStatus = brokerVerif?.status ?? null
    const isBrokerSubmitted = brokerVerif !== null
    const isBrokerApproved = brokerStatus === "APPROVED"

    // Étapes d'onboarding
    const steps = [
      { id: "profile", label: "Compléter votre profil à 100%", status: isProfileComplete ? "APPROVED" : "PENDING" },
      { id: "kyc", label: "Vérification d'identité (KYC)", status: kycStatus ?? "NOT_SUBMITTED" },
      { id: "broker", label: "Vérification de votre compte Broker", status: brokerStatus ?? "NOT_SUBMITTED" },
    ]

    const emailVerified = user.emailVerified
    const hasAccess = isAdmin || user.signalsAccessOverride || emailVerified

    return NextResponse.json({
      hasAccess,
      accessOverride: user.signalsAccessOverride,
      emailVerified,
      profileCompletion,
      isProfileComplete,
      kycStatus,
      isKycSubmitted,
      isKycApproved,
      brokerStatus,
      isBrokerSubmitted,
      isBrokerApproved,
      steps,
    })
  } catch (error) {
    return handleAuthError(error)
  }
}
