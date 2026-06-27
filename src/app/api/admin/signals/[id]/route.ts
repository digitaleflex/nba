import { NextRequest, NextResponse } from "next/server"
import { deleteSignal } from "@nba/modules/signals/services/get-signals"
import { requirePermission, handleAuthError } from "@nba/lib/auth-utils"

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission("signals.create")
    const { id } = await params
    const updated = await deleteSignal(id)
    return NextResponse.json(updated)
  } catch (error) {
    return handleAuthError(error)
  }
}
