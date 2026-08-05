import { NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { requireRole, handleAuthError } from "@nba/lib/auth-utils"

function normalizeEmail(email: string): string {
  return email
    .toLowerCase()
    .replace(/\s+/g, "")
    .split("@")[0]
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 12)
}

export async function GET() {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"])

    const [users, loginAttempts] = await Promise.all([
      prisma.user.findMany({
        where: { deletedAt: null },
        select: {
          id: true,
          name: true,
          email: true,
          isActive: true,
          onboardingStatus: true,
          signalsAccessOverride: true,
          createdAt: true,
          accessRequests: {
            where: { status: "APPROVED" },
            select: { plan: { select: { name: true, price: true } } },
          },
        },
      }),
      prisma.loginAttempt.findMany({
        where: { userId: { not: null } },
        distinct: ["userId", "ipAddress"],
        select: { userId: true, ipAddress: true },
      }),
    ])

    const emailToUser = new Map(users.map((u) => [u.id, u]))

    function summarize(name: string, list: (typeof users)[number][], detectedBy: string[]) {
      const approved = list.filter((u) => u.accessRequests.length > 0)
      const paidPlans = approved.flatMap((u) => u.accessRequests.map((ar) => ar.plan))
      const totalPaid = paidPlans.reduce((acc, p) => acc + Number(p.price), 0)
      return {
        name,
        count: list.length,
        activeCount: list.filter((u) => u.isActive).length,
        approvedCount: approved.length,
        plans: [...new Set(paidPlans.map((p) => p.name))],
        totalPaid,
        detectedBy,
        accounts: list.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          isActive: u.isActive,
          onboardingStatus: u.onboardingStatus,
          signalsAccessOverride: u.signalsAccessOverride,
          createdAt: u.createdAt,
          plans: u.accessRequests.map((ar) => ({
            name: ar.plan.name,
            price: ar.plan.price,
          })),
        })),
      }
    }

    // 1) Doublons par nom normalisé
    const byName = new Map<string, (typeof users)[number][]>()
    for (const u of users) {
      const key = u.name.trim().replace(/\s+/g, " ").toLowerCase()
      if (!key) continue
      const list = byName.get(key) ?? []
      list.push(u)
      byName.set(key, list)
    }

    // 2) Doublons par préfixe email (même base avant @, chiffres/points ignorés)
    const byEmail = new Map<string, (typeof users)[number][]>()
    for (const u of users) {
      const key = normalizeEmail(u.email)
      if (key.length < 6) continue
      const list = byEmail.get(key) ?? []
      list.push(u)
      byEmail.set(key, list)
    }

    // 3) Doublons par IP partagée (sessions + login attempts)
    const ipGroups = new Map<string, Set<string>>()
    for (const la of loginAttempts) {
      if (!la.ipAddress || !la.userId) continue
      const set = ipGroups.get(la.ipAddress) ?? new Set<string>()
      set.add(la.userId)
      ipGroups.set(la.ipAddress, set)
    }

    const seenPairs = new Set<string>()
    const byIp: ReturnType<typeof summarize>[] = []

    for (const [, userIds] of ipGroups) {
      if (userIds.size < 2) continue
      const list = [...userIds]
        .map((id) => emailToUser.get(id))
        .filter((u): u is (typeof users)[number] => Boolean(u))
      if (list.length < 2) continue
      const key = list.map((u) => u.id).sort().join("|")
      if (seenPairs.has(key)) continue
      seenPairs.add(key)
      byIp.push(summarize(list.map((u) => u.email).join(", "), list, ["IP partagée"]))
    }

    const nameGroups = [...byName.entries()]
      .filter(([, list]) => list.length > 1)
      .map(([name, list]) => summarize(name, list, ["nom"]))
    const emailGroups = [...byEmail.entries()]
      .filter(([, list]) => list.length > 1)
      .map(([name, list]) => summarize(name, list, ["email"]))
      .filter((g) => !nameGroups.some((n) => n.accounts.map((a) => a.id).sort().join() === g.accounts.map((a) => a.id).sort().join()))

    const duplicates = [...nameGroups, ...emailGroups, ...byIp].sort(
      (a, b) => b.totalPaid - a.totalPaid || b.count - a.count,
    )

    return NextResponse.json({
      duplicates,
      total: duplicates.length,
      breakdown: { byName: nameGroups.length, byEmail: emailGroups.length, byIp: byIp.length },
    })
  } catch (error) {
    return handleAuthError(error)
  }
}
