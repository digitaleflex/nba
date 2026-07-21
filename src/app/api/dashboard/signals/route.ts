import { NextRequest, NextResponse } from "next/server"
import { getSignalsApi } from "@nba/modules/signals/services/get-signals-api"
import { handleAuthError, AuthError } from "@nba/lib/auth-utils"
import { msg } from "@nba/lib/messages"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search") || ""
    const filter = (searchParams.get("filter") || "all") as "all" | "unread" | "today" | "week" | "forex" | "deriv" | "forex+deriv"
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = parseInt(searchParams.get("limit") || "20")

    const result = await getSignalsApi({ search, filter, page, limit })
    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.httpStatus })
    }
    console.error("Signals API error:", error)
    return NextResponse.json({ error: msg.signal.INTERNAL_ERROR }, { status: 500 })
  }
}