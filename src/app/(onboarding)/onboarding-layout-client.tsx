"use client"

import { usePathname } from "next/navigation"
import { StepIndicator, type Step } from "./_components/step-indicator"

export function OnboardingLayoutClient({
  steps,
  currentStepId,
  progress,
  children,
}: {
  steps: Step[]
  currentStepId: string
  progress: number
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const showStepper = pathname.startsWith("/onboarding")

  return (
    <div className="space-y-8">
      {showStepper && (
        <StepIndicator
          steps={steps}
          currentStepId={currentStepId}
          progress={progress}
        />
      )}
      {children}
    </div>
  )
}
