import { prisma } from "../db";
import type { OnboardingStatus } from "@nba/generated/prisma/enums";

export interface OnboardingChecklist {
  emailVerified: boolean;
  kycSubmitted: boolean;
  brokerSubmitted: boolean;
  reviewed: boolean;
}

export interface OnboardingState {
  status: OnboardingStatus;
  checklist: OnboardingChecklist;
  progress: number;
  nextStep: string | null;
  kycStatus: string | null;
  kycFeedback: string | null;
  brokerStatus: string | null;
  brokerFeedback: string | null;
}

const STEP_PROGRESS: Record<string, number> = {
  emailVerified: 20,
  kycSubmitted: 40,
  brokerSubmitted: 40,
  reviewed: 0,
};

export async function getOnboardingState(
  userId: string,
): Promise<OnboardingState> {
  const [user, lastKyc, lastBroker] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        emailVerified: true,
        onboardingStatus: true,
      },
    }),
    prisma.kycDocument.findFirst({
      where: { userId },
      orderBy: { submittedAt: "desc" },
    }),
    prisma.brokerVerification.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const checklist: OnboardingChecklist = {
    emailVerified: user.emailVerified,
    kycSubmitted: lastKyc !== null && lastKyc.status !== "REJECTED",
    brokerSubmitted: lastBroker !== null && lastBroker.status !== "REJECTED",
    reviewed: user.onboardingStatus === "ACTIVE",
  };

  const completedWeight = Object.entries(checklist)
    .filter(([, done]) => done)
    .reduce((sum, [key]) => sum + (STEP_PROGRESS[key] ?? 0), 0);

  const progress = user.onboardingStatus === "ACTIVE" ? 100 : Math.min(100, completedWeight);

  const steps: Record<string, string> = {
    emailVerified: "Vérifier votre email",
    kycSubmitted: "Vérification d'identité",
    brokerSubmitted: "Vérification Broker",
    reviewed: "Validation par notre équipe",
  };

  const nextStep =
    Object.entries(checklist).find(([, done]) => !done)?.[0] ?? null;

  return {
    status: user.onboardingStatus,
    checklist,
    progress,
    nextStep: nextStep ? (steps[nextStep] ?? null) : null,
    kycStatus: lastKyc?.status ?? null,
    kycFeedback: lastKyc?.reviewNotes ?? null,
    brokerStatus: lastBroker?.status ?? null,
    brokerFeedback: lastBroker?.reviewNotes ?? null,
  };
}

export async function getOnboardingStateForUsers(
  userIds: string[],
): Promise<Record<string, OnboardingState>> {
  if (userIds.length === 0) return {};

  const [users, kycDocs, brokerVerifs] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, emailVerified: true, onboardingStatus: true },
    }),
    prisma.kycDocument.findMany({
      where: { userId: { in: userIds } },
      orderBy: { submittedAt: "desc" },
    }),
    prisma.brokerVerification.findMany({
      where: { userId: { in: userIds } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // Deduplicate: keep only latest KYC/broker per user (already ordered desc)
  const seenKyc = new Set<string>();
  const latestKyc = kycDocs.filter((k) => {
    if (seenKyc.has(k.userId)) return false;
    seenKyc.add(k.userId);
    return true;
  });

  const seenBroker = new Set<string>();
  const latestBroker = brokerVerifs.filter((b) => {
    if (seenBroker.has(b.userId)) return false;
    seenBroker.add(b.userId);
    return true;
  });

  const kycByUser = new Map(latestKyc.map((k) => [k.userId, k]));
  const brokerByUser = new Map(latestBroker.map((b) => [b.userId, b]));

  const result: Record<string, OnboardingState> = {};

  for (const user of users) {
    const lastKyc = kycByUser.get(user.id) ?? null;
    const lastBroker = brokerByUser.get(user.id) ?? null;

    const checklist: OnboardingChecklist = {
      emailVerified: user.emailVerified,
      kycSubmitted: lastKyc !== null && lastKyc.status !== "REJECTED",
      brokerSubmitted: lastBroker !== null && lastBroker.status !== "REJECTED",
      reviewed: user.onboardingStatus === "ACTIVE",
    };

    const completedWeight = Object.entries(checklist)
      .filter(([, done]) => done)
      .reduce((sum, [key]) => sum + (STEP_PROGRESS[key] ?? 0), 0);

    const progress = user.onboardingStatus === "ACTIVE" ? 100 : Math.min(100, completedWeight);

    const steps: Record<string, string> = {
      emailVerified: "Vérifier votre email",
      kycSubmitted: "Vérification d'identité",
      brokerSubmitted: "Vérification Broker",
      reviewed: "Validation par notre équipe",
    };

    const nextStep =
      Object.entries(checklist).find(([, done]) => !done)?.[0] ?? null;

    result[user.id] = {
      status: user.onboardingStatus,
      checklist,
      progress,
      nextStep: nextStep ? (steps[nextStep] ?? null) : null,
      kycStatus: lastKyc?.status ?? null,
      kycFeedback: lastKyc?.reviewNotes ?? null,
      brokerStatus: lastBroker?.status ?? null,
      brokerFeedback: lastBroker?.reviewNotes ?? null,
    };
  }

  return result;
}

export async function updateOnboardingStatus(
  userId: string,
  status: OnboardingStatus,
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { onboardingStatus: status },
  });
}
