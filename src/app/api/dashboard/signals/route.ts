import { NextRequest, NextResponse } from "next/server"
import { getSignalsApi } from "@nba/modules/signals/services/get-signals-api"
import { handleAuthError, AuthError } from "@nba/lib/auth-utils"
import { msg } from "@nba/lib/messages"
import { logger } from "@nba/lib/logger"

const log = logger.child({ module: "signals" })

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search") || ""
    const filter = (searchParams.get("filter") || "all") as "all" | "unread" | "today" | "week" | "forex" | "indices" | "forex+indices"
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = parseInt(searchParams.get("limit") || "20")

    const result = await getSignalsApi({ search, filter, page, limit })
    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.httpStatus })
    }
    log.error({ err: error, errorCode: "INTEGRATION_ERROR" }, "Signals API error")
    return NextResponse.json({ error: msg.signal.INTERNAL_ERROR }, { status: 500 })
  }
}