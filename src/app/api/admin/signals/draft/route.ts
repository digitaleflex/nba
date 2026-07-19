import { NextRequest, NextResponse } from "next/server"
import { updateSignal } from "@nba/modules/signals/services/update-signal"
import { requirePermission, handleAuthError } from "@nba/lib/auth-utils"
import { prisma } from "@nba/lib/db"
import { z } from "zod"
import { serverError } from "@nba/lib/api-error"

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("signals.create")
    const userId = session.user.id

    const body = await req.json()
    const { id, ...rest } = body ?? {}

    // A draft may be incomplete (empty content / no plans yet), so we use a
    // relaxed schema here rather than the strict create/update schemas.
    const draftSchema = z.object({
      content: z.string().optional().default(""),
      imageUrls: z.array(z.string()).max(5).optional().default([]),
      planIds: z.array(z.string()).optional().default([]),
      scheduledAt: z.string().nullable().optional(),
    })
    const parsed = draftSchema.parse({ ...rest, status: "DRAFT" })

    if (id) {
      const updateInput: any = { status: "DRAFT" }
      if (parsed.content) updateInput.content = parsed.content
      updateInput.imageUrls = parsed.imageUrls
      updateInput.planIds = parsed.planIds
      if (parsed.scheduledAt !== undefined) updateInput.scheduledAt = parsed.scheduledAt
      const signal = await updateSignal(id, userId, updateInput)
      return NextResponse.json({ id: signal.id })
    }

    // Create the initial DRAFT record. planIds may be empty at this stage
    // (the strict createSignal schema requires >=1 plan), so we insert
    // directly with status DRAFT and no audience yet.
    const signal = await prisma.signal.create({
      data: {
        content: parsed.content,
        imageUrls: parsed.imageUrls,
        status: "DRAFT",
        createdBy: userId,
        publishedAt: null,
        scheduledAt: parsed.scheduledAt ? new Date(parsed.scheduledAt) : null,
      },
    })
    return NextResponse.json({ id: signal.id })
  } catch (err: any) {
    if (err?.name === "ZodError") {
      return NextResponse.json({ error: "Brouillon invalide", details: err.errors }, { status: 400 })
    }
    console.error("[signals/draft] failed:", err)
    return serverError(err, "POST /api/admin/signals/draft")
  }
}
