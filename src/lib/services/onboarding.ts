import { prisma } from "../db"
import type { OnboardingStatus } from "../../generated/prisma"

export interface OnboardingChecklist {
  emailVerified: boolean
  profileCompleted: boolean
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
  emailVerified: 20,
  profileCompleted: 40,
  kycSubmitted: 60,
  brokerSubmitted: 80,
  reviewed: 100,
}

export async function getOnboardingState(userId: string): Promise<OnboardingState> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: {
      kycDocuments: { take: 1, orderBy: { submittedAt: "desc" } },
      brokerVerifications: { take: 1, orderBy: { submittedAt: "desc" } },
      accessRequests: { take: 1, orderBy: { createdAt: "desc" } },
    },
  })

  const checklist: OnboardingChecklist = {
    emailVerified: user.emailVerified,
    profileCompleted: !!(user.country && user.timezone),
    kycSubmitted: user.kycDocuments.length > 0,
    brokerSubmitted: user.brokerVerifications.length > 0,
    reviewed: user.onboardingStatus === "ACTIVE",
  }

  const completedWeight = Object.entries(checklist)
    .filter(([, done]) => done)
    .reduce((sum, [key]) => sum + (STEP_PROGRESS[key] ?? 0), 0)

  const progress = Math.min(100, completedWeight)

  const steps: Record<string, string> = {
    emailVerified: "Vérifier votre email",
    profileCompleted: "Compléter votre profil",
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
