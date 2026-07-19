import { NextResponse } from "next/server"
import { getServerSession } from "@nba/lib/get-session"
import { prisma } from "@nba/lib/db"
import { getCached } from "@nba/lib/cache"
import { serverError } from "@nba/lib/api-error"

const ONBOARDING_LABELS: Record<string, string> = {
  REGISTERED: "Inscrit (non onboardé)",
  PAYMENT_PENDING: "Paiement en attente",
  PAYMENT_CONFIRMED: "Paiement confirmé",
  KYC_PENDING: "KYC en attente",
  KYC_APPROVED: "KYC approuvé",
  BROKER_PENDING: "Broker en attente",
  BROKER_APPROVED: "Broker approuvé",
  ACTIVE: "Actif",
  SUSPENDED: "Suspendu",
  PENDING_EMAIL: "E-mail en attente",
  PROFILE_INCOMPLETE: "Profil incomplet",
  REVIEW_PENDING: "En revue",
}

const KYC_LABELS: Record<string, string> = {
  PENDING: "En attente",
  APPROVED: "Approuvé",
  REJECTED: "Rejeté",
  EXPIRED: "Expiré",
}

function parseDays(raw: string | null): number {
  const n = Number(raw)
  if (n === 7 || n === 30 || n === 90) return n
  return 30
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const userDb = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: { select: { name: true } } },
    })

    if (!userDb?.role || (userDb.role.name !== "ADMIN" && userDb.role.name !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const days = parseDays(searchParams.get("days"))

    const cacheKey = `analytics:${days}`

    const data = await getCached(
      cacheKey,
      async () => {
        const now = new Date()
        const start = new Date()
        start.setDate(start.getDate() - days)
        const prevStart = new Date()
        prevStart.setDate(prevStart.getDate() - days * 2)

        const [
          totalMembers,
          membersByStatus,
          kycByStatus,
          plansRaw,
          plans,
          conversations,
          unreadMessages,
          reports,
          devices,
          activeSessions,
          growthUsers,
          currentPeriodCount,
          previousPeriodCount,
        ] = await Promise.all([
          prisma.user.count(),
          prisma.user.groupBy({ by: ["onboardingStatus"], _count: { _all: true } }),
          prisma.kycDocument.groupBy({ by: ["status"], _count: { _all: true } }),
          prisma.accessRequest.groupBy({
            by: ["planId"],
            where: { status: "APPROVED" },
            _count: { _all: true },
          }),
          prisma.subscriptionPlan.findMany({ select: { id: true, name: true } }),
          prisma.conversation.count(),
          prisma.message.count({ where: { readAt: null } }),
          prisma.messageReport.count(),
          prisma.device.count(),
          prisma.session.count({ where: { expiresAt: { gt: now } } }),
          prisma.user.findMany({
            where: { createdAt: { gte: start } },
            select: { createdAt: true },
          }),
          prisma.user.count({ where: { createdAt: { gte: start } } }),
          prisma.user.count({ where: { createdAt: { gte: prevStart, lt: start } } }),
        ])

        const statusMap = new Map(plans.map((p) => [p.id, p.name]))

        const membersBreakdown = membersByStatus.map((s) => ({
          status: s.onboardingStatus,
          label: ONBOARDING_LABELS[s.onboardingStatus] ?? s.onboardingStatus,
          count: s._count._all,
        }))

        const kycCounts = kycByStatus.reduce<Record<string, number>>((acc, s) => {
          acc[s.status] = s._count._all
          return acc
        }, {})
        const kycApproved = kycCounts["APPROVED"] ?? 0
        const kycPending = kycCounts["PENDING"] ?? 0
        const kycRejected = kycCounts["REJECTED"] ?? 0
        const kycTotalDocs = Object.values(kycCounts).reduce((a, b) => a + b, 0)
        const verifiedPct = totalMembers > 0 ? Math.round((kycApproved / totalMembers) * 100) : 0
        const completionPct =
          kycTotalDocs > 0 ? Math.round((kycApproved / kycTotalDocs) * 100) : 0

        const plansBreakdown = plansRaw.map((p) => ({
          planId: p.planId,
          planName: statusMap.get(p.planId) ?? p.planId,
          count: p._count._all,
        }))

        // Série journalière des inscriptions sur la période
        const series = Array.from({ length: days }, (_, i) => {
          const d = new Date()
          d.setDate(d.getDate() - (days - 1 - i))
          return { date: d, count: 0 }
        })
        for (const u of growthUsers) {
          const idx = series.findIndex(
            (s) => s.date.toDateString() === new Date(u.createdAt).toDateString(),
          )
          if (idx >= 0) series[idx].count += 1
        }
        const growthSeries = series.map((s) => ({
          label: `${s.date.getDate()}/${s.date.getMonth() + 1}`,
          count: s.count,
        }))

        const changePct =
          previousPeriodCount > 0
            ? Math.round(((currentPeriodCount - previousPeriodCount) / previousPeriodCount) * 100)
            : currentPeriodCount > 0
              ? 100
              : 0

        return {
          totalMembers,
          membersBreakdown,
          kyc: {
            approved: kycApproved,
            pending: kycPending,
            rejected: kycRejected,
            totalDocs: kycTotalDocs,
            verifiedPct,
            completionPct,
            breakdown: Object.entries(kycCounts).map(([status, count]) => ({
              status,
              label: KYC_LABELS[status] ?? status,
              count,
            })),
          },
          plansBreakdown,
          messaging: {
            conversations,
            unreadMessages,
            reports,
          },
          infra: {
            devices,
            activeSessions,
          },
          growth: {
            days,
            series: growthSeries,
            currentPeriodCount,
            previousPeriodCount,
            changePct,
          },
        }
      },
      60,
    )

    return NextResponse.json(data)
  } catch (error: unknown) {
    return serverError(error, "GET /api/admin/analytics")
  }
}
