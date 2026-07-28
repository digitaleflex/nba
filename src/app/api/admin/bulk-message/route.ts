import { NextRequest, NextResponse } from "next/server"
import { requireRole, handleAuthError } from "@nba/lib/auth-utils"
import { prisma } from "@nba/lib/db"
import { startOrReplyAsAdmin } from "@nba/lib/services/messaging"
import { rateLimitOrDeny } from "@nba/lib/rate-limit"
import { logger } from "@nba/lib/logger"

const log = logger.child({ module: "bulk-message" })

export async function GET() {
  try {
    const session = await requireRole(["ADMIN", "SUPER_ADMIN"])

    const plans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true, deletedAt: null },
      select: { id: true, name: true },
      orderBy: { sortOrder: "asc" },
    })

    const counts = await prisma.accessRequest.groupBy({
      by: ["planId"],
      where: { status: "APPROVED", planId: { in: plans.map((p) => p.id) } },
      _count: { _all: true },
    })

    const countMap = new Map(counts.map((c) => [c.planId, c._count._all]))

    const planStats = plans.map((p) => ({
      id: p.id,
      name: p.name,
      count: countMap.get(p.id) || 0,
    }))

    return NextResponse.json({ plans: planStats })
  } catch (error) {
    return handleAuthError(error)
  }
}

interface BulkMessageBody {
  planIds?: string[]
  content: string
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireRole(["ADMIN", "SUPER_ADMIN"])

    const rl = await rateLimitOrDeny("BULK_MESSAGE", session.user.id)
    if (rl) return rl

    const body = (await req.json().catch(() => ({}))) as BulkMessageBody
    const content = (body.content || "").trim()
    if (!content) {
      return NextResponse.json({ error: "Le contenu du message est requis." }, { status: 400 })
    }

    if (content.length > 4000) {
      return NextResponse.json({ error: "Le message dépasse 4000 caractères." }, { status: 400 })
    }

    const planWhere = body.planIds && body.planIds.length > 0
      ? { planId: { in: body.planIds } }
      : {}

    const approvedAccess = await prisma.accessRequest.findMany({
      where: { status: "APPROVED", ...planWhere },
      select: { userId: true, plan: { select: { name: true } } },
    })

    const unique = new Map<string, string>()
    for (const a of approvedAccess) {
      if (!unique.has(a.userId)) unique.set(a.userId, a.plan.name)
    }

    const members = Array.from(unique.entries())
    const total = members.length

    if (total === 0) {
      return NextResponse.json({ error: "Aucun membre approuvé trouvé pour ces groupes." }, { status: 404 })
    }

    let sent = 0
    let failed = 0

    for (const [userId] of members) {
      try {
        await startOrReplyAsAdmin(session.user.id, userId, content)
        sent++
      } catch (err) {
        failed++
        log.error({ err, userId, errorCode: "INTEGRATION_ERROR" }, "Failed to send bulk message")
      }
    }

    log.info({ sent, failed, total, adminId: session.user.id }, "Bulk message sent")

    return NextResponse.json({ sent, failed, total })
  } catch (error) {
    return handleAuthError(error)
  }
}
