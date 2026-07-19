import { NextRequest, NextResponse } from "next/server"
import { deleteSignal } from "@nba/modules/signals/services/get-signals"
import { updateSignal } from "@nba/modules/signals/services/update-signal"
import { requirePermission, handleAuthError } from "@nba/lib/auth-utils"
import { invalidatePrefix } from "@nba/lib/cache"
import { logAuditEvent } from "@nba/lib/services/audit"

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("signals.create")
    const { id } = await params
    const updated = await deleteSignal(id)
    await invalidatePrefix("signals:")

    await logAuditEvent({
      userId: session.user.id,
      action: "DELETE",
      resourceType: "signal",
      resourceId: id,
    })

    return NextResponse.json(updated)
  } catch (error) {
    return handleAuthError(error)
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("signals.create")
    const { id } = await params
    const body = await req.json()
    const updated = await updateSignal(id, session.user.id, body)
    await invalidatePrefix("signals:")

    await logAuditEvent({
      userId: session.user.id,
      action: "UPDATE",
      resourceType: "signal",
      resourceId: id,
      details: {
        changes: Object.keys(body),
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    return handleAuthError(error)
  }
}
