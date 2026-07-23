import { redirect } from "next/navigation"
import { getServerSession } from "@nba/lib/get-session"
import { ErrorBoundary } from "@nba/app/components/error-boundary"
import { getOnboardingState } from "@nba/lib/services/onboarding"
import { OnboardingLayoutClient } from "./onboarding-layout-client"

const ONBOARDING_STEPS = [
  { id: "email", label: "Email", href: "/onboarding" },
  { id: "profile", label: "Profil", href: "/onboarding/profile" },
  { id: "kyc", label: "Identité", href: "/onboarding/kyc" },
  { id: "broker", label: "Broker", href: "/onboarding/broker" },
]

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession()
  if (!session) redirect("/login")

  const state = await getOnboardingState(session.user.id)
    .catch(() => null)

  const checklist = state?.checklist
  let currentStepId = "email"
  if (checklist?.emailVerified && !checklist?.kycSubmitted) currentStepId = "profile"
  else if (checklist?.kycSubmitted && !checklist?.brokerSubmitted) currentStepId = "kyc"
  else if (checklist?.brokerSubmitted) currentStepId = "broker"

  return (
    <div className="flex min-h-dvh flex-col">
      <main id="main-content" className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-8">
        <OnboardingLayoutClient
          steps={ONBOARDING_STEPS}
          currentStepId={currentStepId}
          progress={state?.progress ?? 0}
        >
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </OnboardingLayoutClient>
      </main>
    </div>
  )
}
