import { SignalsView } from "./components/signals-view"
import { LockedSignalsView } from "./components/locked-signals-view"
import { getServerSession } from "@nba/lib/get-session"
import { prisma } from "@nba/lib/db"
import { redirect } from "next/navigation"

export default async function SignalsPage() {
  const session = await getServerSession()
  if (!session) {
    redirect("/login")
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
    redirect("/login")
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

  const hasAccess = isAdmin || (isProfileComplete && isKycApproved && isBrokerApproved)

  if (hasAccess) {
    return <SignalsView />
  }

  // Si pas d'accès, on prépare les informations pour LockedSignalsView
  const isOnlyValidationPending = 
    isProfileComplete && 
    isKycSubmitted && kycStatus === "PENDING" &&
    isBrokerSubmitted && brokerStatus === "PENDING"

  let targetActivationTime = null
  if (isOnlyValidationPending) {
    const kycDate = kycDoc ? new Date(kycDoc.submittedAt).getTime() : 0
    const brokerDate = brokerVerif ? new Date(brokerVerif.submittedAt).getTime() : 0
    const lastSubmission = Math.max(kycDate, brokerDate)
    targetActivationTime = lastSubmission + 24 * 60 * 60 * 1000
  }

  const statusData = {
    profileCompletion,
    isProfileComplete,
    kycStatus,
    isKycSubmitted,
    isKycApproved,
    brokerStatus,
    isBrokerSubmitted,
    isBrokerApproved,
    isOnlyValidationPending,
    targetActivationTime,
    steps: [
      { id: "profile", label: "Compléter votre profil à 100%", status: isProfileComplete ? "APPROVED" : "PENDING" },
      { id: "kyc", label: "Vérification d'identité (KYC)", status: kycStatus ?? "NOT_SUBMITTED" },
      { id: "broker", label: "Vérification de votre compte Broker", status: brokerStatus ?? "NOT_SUBMITTED" },
    ]
  }

  return <LockedSignalsView statusData={statusData} />
}

