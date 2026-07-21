import { msg } from "../messages";
import { prisma } from "../db";
import type { AccessStatus } from "@nba/generated/prisma/enums";

export interface CreateAccessRequestInput {
  userId: string;
  planId: string;
}

export async function createAccessRequest(input: CreateAccessRequestInput) {
  const existing = await prisma.accessRequest.findFirst({
    where: {
      userId: input.userId,
      planId: input.planId,
      status: { in: ["PENDING", "APPROVED"] },
    },
  });

  if (existing) {
    throw new Error(msg.member.REQUEST_EXISTS);
  }

  return prisma.accessRequest.create({
    data: {
      userId: input.userId,
      planId: input.planId,
    },
    include: { plan: true },
  });
}

export async function reviewAccessRequest(
  requestId: string,
  reviewerId: string,
  status: AccessStatus,
  notes?: string,
) {
  const request = await prisma.accessRequest.findUniqueOrThrow({
    where: { id: requestId },
  });

  const updated = await prisma.accessRequest.update({
    where: { id: requestId },
    data: {
      status,
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
      notes,
    },
  });

  if (status === "APPROVED") {
    await prisma.user.update({
      where: { id: request.userId },
      data: { onboardingStatus: "ACTIVE" },
    });
  }

  if (status === "REJECTED") {
    await prisma.user.update({
      where: { id: request.userId },
      data: { onboardingStatus: "REVIEW_PENDING" },
    });
  }

  return updated;
}

export async function getPendingAccessRequests() {
  return prisma.accessRequest.findMany({
    where: { status: "PENDING" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          whatsapp: true,
          country: true,
          onboardingStatus: true,
          kycDocuments: { orderBy: { submittedAt: "desc" }, take: 1 },
          brokerVerifications: { orderBy: { submittedAt: "desc" }, take: 1 },
        },
      },
      plan: true,
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function getUserAccess(userId: string) {
  return prisma.accessRequest.findMany({
    where: { userId },
    include: { plan: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function hasActiveAccess(
  userId: string,
  planId: string,
): Promise<boolean> {
  const request = await prisma.accessRequest.findFirst({
    where: { userId, planId, status: "APPROVED" },
  });
  return !!request;
}
