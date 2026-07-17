import { NextResponse } from "next/server"
import { requireAuth } from "@nba/lib/auth-utils"
import { auth } from "@nba/lib/auth"
import { headers } from "next/headers"

export async function GET() {
  try {
    const session = await requireAuth()
    const baSession = await auth.api.getSession({ headers: await headers() })
    return NextResponse.json({
      hasSession: !!baSession,
      userId: baSession?.user?.id ?? null,
      userKeys: baSession?.user ? Object.keys(baSession.user) : [],
      userSample: baSession?.user
        ? {
            id: baSession.user.id,
            role: (baSession.user as any).role,
            ba_role: (baSession.user as any).ba_role,
          }
        : null,
      rbacUserId: session.user.id,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? String(e) }, { status: 500 })
  }
}
