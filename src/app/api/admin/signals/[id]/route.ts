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

import { updateSignal } from "@nba/modules/signals/services/update-signal"
import { getServerSession } from "@nba/lib/get-session"

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const updated = await updateSignal(id, session.user.id, body)
    return NextResponse.json(updated)
  } catch (error) {
    return handleAuthError(error)
  }
}

