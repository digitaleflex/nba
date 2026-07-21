import { NextResponse } from "next/server"
import { ErrorCode, errorResponse } from "@nba/lib/errors"

export async function GET() {
  const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  if (!key) {
    return errorResponse(500, ErrorCode.INTERNAL_ERROR, "VAPID key not configured")
  }
  return NextResponse.json({ key })
}
