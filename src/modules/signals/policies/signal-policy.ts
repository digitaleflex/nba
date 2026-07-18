import { prisma } from "@nba/lib/db"

interface UserPerms {
  isAdmin: boolean
  hasCreatePerm: boolean
}

async function getUserPerms(userId: string): Promise<UserPerms | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: {
        select: {
          name: true,
          permissions: { select: { permission: { select: { name: true } } } },
        },
      },
    },
  })
  if (!user) return null
  return {
    isAdmin: user.role.name === "ADMIN" || user.role.name === "SUPER_ADMIN",
    hasCreatePerm: user.role.permissions.some(
      (rp: any) => rp.permission.name === "signals.create",
    ),
  }
}

function canAct(userPerms: UserPerms, createdBy: string, userId: string): boolean {
  if (userPerms.isAdmin) return true
  return createdBy === userId && userPerms.hasCreatePerm
}

export async function canCreateSignal(userId: string): Promise<boolean> {
  const perms = await getUserPerms(userId)
  if (!perms) return false
  return perms.isAdmin || perms.hasCreatePerm
}

export async function canUpdateSignal(
  userId: string,
  signal: { createdBy: string },
): Promise<boolean> {
  const perms = await getUserPerms(userId)
  if (!perms) return false
  return canAct(perms, signal.createdBy, userId)
}

export async function canPublishSignal(
  userId: string,
  signal: { createdBy: string },
): Promise<boolean> {
  const perms = await getUserPerms(userId)
  if (!perms) return false
  return canAct(perms, signal.createdBy, userId)
}

export async function canDeleteSignal(
  userId: string,
  signal: { createdBy: string },
): Promise<boolean> {
  const perms = await getUserPerms(userId)
  if (!perms) return false
  return canAct(perms, signal.createdBy, userId)
}

export async function canViewSignal(userId: string, signalId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: { select: { name: true } },
      isActive: true,
      signalsAccessOverride: true,
    },
  })
  if (!user) return false
  if (!user.isActive) return false
  if (user.role?.name === "ADMIN" || user.role?.name === "SUPER_ADMIN") return true
  if (user.signalsAccessOverride) return true

  const audience = await prisma.signalAudience.findMany({
    where: { signalId },
    select: { planId: true },
  })
  const planIds = audience.map((a) => a.planId)
  if (planIds.length === 0) return false

  const approved = await prisma.accessRequest.findFirst({
    where: { userId, planId: { in: planIds }, status: "APPROVED" },
  })
  return !!approved
}
