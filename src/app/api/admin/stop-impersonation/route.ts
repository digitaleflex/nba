import { NextResponse } from "next/server"
import { ErrorCode, errorResponse } from "@nba/lib/errors"
import { msg } from "@nba/lib/messages"

// IMPERSONATION DÉSACTIVÉE — voir members/[id]/impersonate
export async function POST() {
  return errorResponse(503, ErrorCode.NOT_IMPLEMENTED, msg.admin.IMPERSONATION_UNAVAILABLE)
}
