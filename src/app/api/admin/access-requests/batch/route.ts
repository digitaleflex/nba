import { NextRequest } from "next/server"
import { prisma } from "@nba/lib/db"
import { requirePermission, handleAuthError } from "@nba/lib/auth-utils"
import { logAuditEvent } from "@nba/lib/services/audit"
import { invalidatePrefix } from "@nba/lib/cache"
import { createBatchStream } from "@nba/lib/batch-stream"
import { z } from "zod"

const batchAssignSchema = z.object({
  userIds: z.array(z.string().uuid()).min(1).max(200),
  planId: z.string().uuid(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("subscriptions.manage")
    const body = await req.json()
    const { userIds, planId } = batchAssignSchema.parse(body)

    const { stream, progress, done, error: streamError } = createBatchStream()

    const response = new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })

    processAssignBatch(session.user.id, userIds, planId, progress, done, streamError)

    return response
  } catch (error) {
    return handleAuthError(error)
  }
}

async function processAssignBatch(
  adminId: string,
  userIds: string[],
  planId: string,
  progress: (data: { succeeded: number; failed: number; total: number; step: string }) => void,
  done: (result: { total: number; succeeded: number; skipped: number; failed: number; errors: { id: string; error: string }[] }) => void,
  streamError: (msg: string) => void,
) {
  let succeeded = 0
  let skipped = 0
  let failed = 0
  const errors: { id: string; error: string }[] = []
  const total = userIds.length

  try {
    const batches: string[][] = []
    for (let i = 0; i < userIds.length; i += 10) {
      batches.push(userIds.slice(i, i + 10))
    }

    progress({ succeeded, failed, total, step: "Recherche des accès existants..." })

    for (let bi = 0; bi < batches.length; bi++) {
      const batch = batches[bi]
      const results = await Promise.allSettled(
        batch.map(async (userId) => {
          const existing = await prisma.accessRequest.findFirst({
            where: { userId, planId },
          })

          if (existing && existing.status === "APPROVED") return "skipped"

          await prisma.$transaction(async (tx) => {
            if (existing) {
              await tx.accessRequest.update({
                where: { id: existing.id },
                data: { status: "APPROVED", reviewedBy: adminId, reviewedAt: new Date() },
              })
            } else {
              await tx.accessRequest.create({
                data: {
                  userId,
                  planId,
                  status: "APPROVED",
                  reviewedBy: adminId,
                  reviewedAt: new Date(),
                },
              })
            }

            await tx.user.update({
              where: { id: userId },
              data: { onboardingStatus: "ACTIVE", isActive: true },
            })
          })

          return "ok"
        })
      )

      for (const r of results) {
        if (r.status === "fulfilled") {
          if (r.value === "skipped") skipped++
          else succeeded++
        } else {
          failed++
          const idx = results.indexOf(r as any)
          errors.push({ id: batch[idx] ?? "", error: r.reason?.message || "Erreur" })
        }
      }

      progress({
        succeeded,
        failed,
        total,
        step: `${succeeded + failed + skipped}/${total} membre${total > 1 ? "s" : ""} traité${total > 1 ? "s" : ""}...`,
      })
    }

    await logAuditEvent({
      userId: adminId,
      action: "access_request.batch_assign",
      resourceType: "access_request",
      resourceId: planId,
      details: { succeeded, skipped, failed, total, planId },
    })

    await invalidatePrefix("ops").catch(() => {})
    await invalidatePrefix("access:").catch(() => {})
    await invalidatePrefix("members:").catch(() => {})

    done({ total, succeeded, skipped, failed, errors: errors.slice(0, 5) })
  } catch (err: any) {
    streamError(err.message || "Erreur serveur")
  }
}
