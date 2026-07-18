import { NextResponse } from "next/server"
import { getServerSession } from "@nba/lib/get-session"
import { prisma } from "@nba/lib/db"

export async function GET() {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      role: { select: { name: true } },
      signalsAccessOverride: true,
      accessRequests: {
        where: { status: "APPROVED" },
        take: 1,
      },
    },
  })

  if (!user) {
    return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
  }

  const isAdmin = user.role.name === "ADMIN" || user.role.name === "SUPER_ADMIN"
  const hasAccess = isAdmin || user.signalsAccessOverride || user.accessRequests.length > 0

  return NextResponse.json({
    hasAccess,
    accessOverride: user.signalsAccessOverride,
    profileCompletion: 100,
    isProfileComplete: true,
    kycStatus: "APPROVED",
    isKycSubmitted: true,
    isKycApproved: true,
    brokerStatus: "APPROVED",
    isBrokerSubmitted: true,
    isBrokerApproved: true,
    steps: [],
    isOnlyValidationPending: false,
    targetActivationTime: null,
  })
}
