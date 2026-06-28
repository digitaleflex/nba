import { prisma } from "../db"
import type { OnboardingStatus } from "@nba/generated/prisma"

export interface OnboardingChecklist {
  emailVerified: boolean
  kycSubmitted: boolean
  brokerSubmitted: boolean
  reviewed: boolean
}

export interface OnboardingState {
  status: OnboardingStatus
  checklist: OnboardingChecklist
  progress: number
  nextStep: string | null
}

const STEP_PROGRESS: Record<string, number> = {
  emailVerified: 25,
  kycSubmitted: 50,
  brokerSubmitted: 75,
  reviewed: 100,
}

export async function getOnboardingState(userId: string): Promise<OnboardingState> {
  const [user, kycCount, brokerCount] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        emailVerified: true,
        onboardingStatus: true,
      },
    }),
    prisma.kycDocument.count({ where: { userId } }),
    prisma.brokerVerification.count({ where: { userId } }),
  ])

  const checklist: OnboardingChecklist = {
    emailVerified: user.emailVerified,
    kycSubmitted: kycCount > 0,
    brokerSubmitted: brokerCount > 0,
    reviewed: user.onboardingStatus === "ACTIVE",
  }

  const completedWeight = Object.entries(checklist)
    .filter(([, done]) => done)
    .reduce((sum, [key]) => sum + (STEP_PROGRESS[key] ?? 0), 0)

  const progress = Math.min(100, completedWeight)

  const steps: Record<string, string> = {
    emailVerified: "Vérifier votre email",
    kycSubmitted: "Vérification d'identité",
    brokerSubmitted: "Vérification Broker",
    reviewed: "Validation par notre équipe",
  }

  const nextStep = Object.entries(checklist).find(([, done]) => !done)?.[0] ?? null

  return {
    status: user.onboardingStatus,
    checklist,
    progress,
    nextStep: nextStep ? (steps[nextStep] ?? null) : null,
  }
}

export async function updateOnboardingStatus(
  userId: string,
  status: OnboardingStatus
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { onboardingStatus: status },
  })
}
