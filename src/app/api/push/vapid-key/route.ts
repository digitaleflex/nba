import { NextResponse } from "next/server"
import { ErrorCode, errorResponse } from "@nba/lib/errors"
import { msg } from "@nba/lib/messages"

export async function GET() {
  const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  if (!key) {
    return errorResponse(500, ErrorCode.INTERNAL_ERROR, msg.push.VAPID_NOT_CONFIGURED)
  }
  return NextResponse.json({ key })
}
