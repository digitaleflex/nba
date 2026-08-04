import { NextRequest } from "next/server"
import { prisma } from "@nba/lib/db"
import { requirePermission, handleAuthError } from "@nba/lib/auth-utils"
import { logAuditEvent } from "@nba/lib/services/audit"
import { invalidatePrefix } from "@nba/lib/cache"
import { createBatchStream } from "@nba/lib/batch-stream"
import { z } from "zod"

const batchReviewSchema = z.object({
  requestIds: z.array(z.string().uuid()).min(1).max(100),
  status: z.enum(["APPROVED", "REJECTED"]),
  notes: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("subscriptions.manage")
    const body = await req.json()
    const { requestIds, status, notes } = batchReviewSchema.parse(body)

    const { stream, progress, done, error: streamError } = createBatchStream()

    const response = new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })

    // Process asynchronously — response is already sent with stream open
    processBatch(session.user.id, requestIds, status, notes, progress, done, streamError)

    return response
  } catch (error) {
    return handleAuthError(error)
  }
}

async function processBatch(
  adminId: string,
  requestIds: string[],
  status: "APPROVED" | "REJECTED",
  notes: string | undefined,
  progress: (data: { succeeded: number; failed: number; total: number; step: string }) => void,
  done: (result: { total: number; succeeded: number; skipped: number; failed: number; errors: { id: string; error: string }[] }) => void,
  streamError: (msg: string) => void,
) {
  let succeeded = 0
  let failed = 0
  let skipped = 0
  const errors: { id: string; error: string }[] = []
  const total = requestIds.length

  try {
    const requests = await prisma.accessRequest.findMany({
      where: { id: { in: requestIds } },
      select: { id: true, userId: true, status: true },
    })
    const requestMap = new Map(requests.map((r) => [r.id, r]))

    const batches: string[][] = []
    for (let i = 0; i < requestIds.length; i += 10) {
      batches.push(requestIds.slice(i, i + 10))
    }

    progress({ succeeded, failed, total, step: "Analyse des demandes..." })

    for (let bi = 0; bi < batches.length; bi++) {
      const batch = batches[bi]
      const results = await Promise.allSettled(
        batch.map(async (id) => {
          const req = requestMap.get(id)
          if (!req || req.status !== "PENDING") return "skipped"

          await prisma.$transaction(async (tx) => {
            await tx.accessRequest.update({
              where: { id },
              data: {
                status,
                reviewedBy: adminId,
                reviewedAt: new Date(),
                notes: notes || (status === "APPROVED" ? "Approuvé en lot" : "Refusé en lot"),
              },
            })

            await tx.user.update({
              where: { id: req.userId },
              data:
                status === "APPROVED"
                  ? { onboardingStatus: "ACTIVE", isActive: true }
                  : { onboardingStatus: "REVIEW_PENDING" },
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
          errors.push({ id: batch[results.indexOf(r) as number] ?? "", error: r.reason?.message || "Erreur" })
        }
      }

      progress({
        succeeded,
        failed,
        total,
        step: `${succeeded + failed + skipped}/${total} traitée${total > 1 ? "s" : ""}...`,
      })
    }

    await logAuditEvent({
      userId: adminId,
      action: `access_request.batch_${status.toLowerCase()}`,
      resourceType: "access_request",
      resourceId: requestIds.join(","),
      details: { succeeded, failed, skipped, status },
    })

    await invalidatePrefix("ops").catch(() => {})
    await invalidatePrefix("access:").catch(() => {})

    done({ total, succeeded, skipped, failed, errors: errors.slice(0, 5) })
  } catch (err: any) {
    streamError(err.message || "Erreur serveur")
  }
}
