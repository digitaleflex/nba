import { NextRequest, NextResponse } from "next/server"
import { requirePermission, handleAuthError } from "@nba/lib/auth-utils"
import { listDlq, dlqStats } from "@nba/lib/services/webhook-dlq"

/**
 * Liste les entrees de la Dead Letter Queue des webhooks.
 * Query params : ?status=PENDING|REPLAYED|ABANDONED&limit=50
 *   - sans params : retourne liste (PENDING par defaut) + stats
 */
export async function GET(req: NextRequest) {
  try {
    await requirePermission("admin.webhooks.dlq")
    const { searchParams } = new URL(req.url)
    const status = (searchParams.get("status") ?? "PENDING") as
      | "PENDING"
      | "REPLAYED"
      | "ABANDONED"
    const limit = Number(searchParams.get("limit") ?? 50)

    const [items, stats] = await Promise.all([
      listDlq({ status, limit }),
      dlqStats(),
    ])

    return NextResponse.json({ items, stats })
  } catch (error) {
    return handleAuthError(error)
  }
}
