import { NextRequest, NextResponse } from "next/server"
import { createSignal } from "@nba/modules/signals/services/create-signal"
import { getSignals } from "@nba/modules/signals/services/get-signals"
import { requirePermission, handleAuthError } from "@nba/lib/auth-utils"

export async function GET() {
  try {
    await requirePermission("signals.create")
    const signals = await getSignals()
    return NextResponse.json(signals)
  } catch (error) {
    return handleAuthError(error)
  }
}

export async function POST(req: NextRequest) {
  try {
    await requirePermission("signals.create")
    const body = await req.json()
    const signal = await createSignal(body)
    return NextResponse.json(signal)
  } catch (error) {
    return handleAuthError(error)
  }
}
