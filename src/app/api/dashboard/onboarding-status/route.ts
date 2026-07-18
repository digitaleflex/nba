import { NextResponse } from "next/server"
import { getServerSession } from "@nba/lib/get-session"

export async function GET() {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  return NextResponse.json({
    hasAccess: true,
    accessOverride: false,
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
