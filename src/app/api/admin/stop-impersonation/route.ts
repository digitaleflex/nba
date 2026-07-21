import { NextResponse } from "next/server"
import { ErrorCode, errorResponse } from "@nba/lib/errors"

// IMPERSONATION DÉSACTIVÉE — voir members/[id]/impersonate
export async function POST() {
  return errorResponse(503, ErrorCode.NOT_IMPLEMENTED, "Impersonation temporairement indisponible.")
}
