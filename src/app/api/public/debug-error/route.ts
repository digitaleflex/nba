import { NextResponse } from "next/server"
import { auth } from "@nba/lib/auth"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email = body.email || "debug@test.com"
    const password = body.password || "debug"
    
    try {
      // Test 1: direct sign-in via better-auth API
      const result = await auth.api.signInEmail({
        body: { email, password },
        asResponse: false,
      } as any)
      return NextResponse.json({ test: "sign-in", ok: true, result })
    } catch (e: any) {
      return NextResponse.json({
        test: "sign-in",
        ok: false,
        error: e.message,
        stack: e.stack?.slice(0, 500),
        code: e.code,
        cause: e.cause?.message,
        type: e.constructor?.name,
        name: e.name,
      })
    }
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message })
  }
}
