import { NextRequest, NextResponse } from "next/server"
import { requireRole, handleAuthError } from "@nba/lib/auth-utils"
import { prisma } from "@nba/lib/db"
import { startOrReplyAsAdmin } from "@nba/lib/services/messaging"
import { rateLimitOrDeny } from "@nba/lib/rate-limit"
import { logger } from "@nba/lib/logger"
import { createBatchStream } from "@nba/lib/batch-stream"

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
      select: { userId: true },
    })

    const unique = new Set(approvedAccess.map((a) => a.userId))
    const members = Array.from(unique)

    if (members.length === 0) {
      return NextResponse.json({ error: "Aucun membre approuvé trouvé." }, { status: 404 })
    }

    const systemAdmin = await prisma.user.findUnique({
      where: { email: "admin@signauxx.com" },
      select: { id: true },
    })
    const senderId = systemAdmin?.id ?? session.user.id

    const { stream, progress, done, error: streamError } = createBatchStream()

    const response = new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })

    processBulkMessage(senderId, members, content, progress, done, streamError)

    return response
  } catch (error) {
    return handleAuthError(error)
  }
}

async function processBulkMessage(
  senderId: string,
  members: string[],
  content: string,
  progress: (data: { succeeded: number; failed: number; total: number; step: string }) => void,
  done: (result: { total: number; succeeded: number; skipped: number; failed: number; errors: { id: string; error: string }[] }) => void,
  streamError: (msg: string) => void,
) {
  let sent = 0
  let failed = 0
  const errors: { id: string; error: string }[] = []
  const total = members.length

  try {
    const batches: string[][] = []
    for (let i = 0; i < members.length; i += 10) {
      batches.push(members.slice(i, i + 10))
    }

    for (let bi = 0; bi < batches.length; bi++) {
      const batch = batches[bi]
      const results = await Promise.allSettled(
        batch.map((userId) =>
          startOrReplyAsAdmin(senderId, userId, content).then(() => userId)
        )
      )

      for (const r of results) {
        if (r.status === "fulfilled") sent++
        else {
          failed++
          const idx = results.indexOf(r as any)
          errors.push({ id: batch[idx] ?? "", error: r.reason?.message || "Erreur" })
        }
      }

      progress({
        succeeded: sent,
        failed,
        total,
        step: `${sent + failed}/${total} message${total > 1 ? "s" : ""} envoyé${total > 1 ? "s" : ""}...`,
      })
    }

    log.info({ sent, failed, total }, "Bulk message sent")
    done({ total, succeeded: sent, skipped: 0, failed, errors: errors.slice(0, 5) })
  } catch (err: any) {
    streamError(err.message || "Erreur serveur")
  }
}
