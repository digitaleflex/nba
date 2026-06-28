import { NextRequest, NextResponse } from "next/server"
import { deleteSignal } from "@nba/modules/signals/services/get-signals"
import { updateSignal } from "@nba/modules/signals/services/update-signal"
import { requirePermission, handleAuthError } from "@nba/lib/auth-utils"
import { validateId } from "@nba/lib/validations"

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission("signals.create")
    const { id } = await params
    const idCheck = validateId(id)
    if (!idCheck.valid) return idCheck.response
    const updated = await deleteSignal(id)
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
    const idCheck = validateId(id)
    if (!idCheck.valid) return idCheck.response
    const body = await req.json()
    const updated = await updateSignal(id, session.user.id, body)
    return NextResponse.json(updated)
  } catch (error) {
    return handleAuthError(error)
  }
}

