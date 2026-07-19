import { NextResponse } from "next/server"

// IMPERSONATION DÉSACTIVÉE (voir /api/admin/members/[id]/impersonate).
export async function POST() {
  return NextResponse.json(
    { error: "Impersonation temporairement indisponible." },
    { status: 503 },
  )
}
