import { redirect } from "next/navigation"
import { getServerSession } from "@nba/lib/get-session"
import { getOnboardingState } from "@nba/lib/services/onboarding"
import { EmailVerificationStep } from "./email-verification-step"

export default async function OnboardingWizardPage() {
  const session = await getServerSession()
  if (!session) redirect("/login")

  const state = await getOnboardingState(session.user.id)

  if (state.status === "ACTIVE") {
    redirect("/dashboard")
  }

  const emailVerified = state.checklist.emailVerified

  return <EmailVerificationStep emailVerified={emailVerified} />
}
