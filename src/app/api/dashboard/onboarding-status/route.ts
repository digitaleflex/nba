import { NextResponse } from "next/server"
import { getServerSession } from "@nba/lib/get-session"
import { prisma } from "@nba/lib/db"

export async function GET() {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const userId = session.user.id

  const [user, kycDoc, brokerVerif] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        country: true,
        phone: true,
        whatsapp: true,
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

  const hasAccess = isAdmin || (isProfileComplete && isKycApproved && isBrokerApproved)

  // Vérifier s'il ne reste que la validation par l'équipe
  const isOnlyValidationPending = 
    isProfileComplete && 
    isKycSubmitted && kycStatus === "PENDING" &&
    isBrokerSubmitted && brokerStatus === "PENDING" &&
    !hasAccess

  let targetActivationTime = null
  if (isOnlyValidationPending) {
    // Prendre la date de soumission la plus récente
    const kycDate = kycDoc ? new Date(kycDoc.submittedAt).getTime() : 0
    const brokerDate = brokerVerif ? new Date(brokerVerif.submittedAt).getTime() : 0
    const lastSubmission = Math.max(kycDate, brokerDate)
    
    // Le compte à rebours se termine 24 heures après la dernière soumission
    targetActivationTime = lastSubmission + 24 * 60 * 60 * 1000
  }

  return NextResponse.json({
    hasAccess,
    profileCompletion,
    isProfileComplete,
    kycStatus,
    isKycSubmitted,
    isKycApproved,
    brokerStatus,
    isBrokerSubmitted,
    isBrokerApproved,
    steps,
    isOnlyValidationPending,
    targetActivationTime,
  })
}
