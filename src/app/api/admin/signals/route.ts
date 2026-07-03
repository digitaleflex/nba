import { NextRequest, NextResponse } from "next/server"
import { createSignal } from "@nba/modules/signals/services/create-signal"
import { getSignals } from "@nba/modules/signals/services/get-signals"
import { requirePermission, handleAuthError } from "@nba/lib/auth-utils"

export async function GET(req: NextRequest) {
  try {
    await requirePermission("signals.create")
    const { searchParams } = new URL(req.url)
    const page = Number(searchParams.get("page") ?? 1)
    const limit = Number(searchParams.get("limit") ?? 50)
    const status = searchParams.get("status") ?? undefined
    const result = await getSignals({ page, limit, status })
    return NextResponse.json(result)
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
