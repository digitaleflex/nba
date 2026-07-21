import { NextRequest, NextResponse } from "next/server"
import { auth } from "@nba/lib/auth"
import { logger } from "@nba/lib/logger"
import { logAuditEvent } from "@nba/lib/services/audit"
import { rateLimitMiddleware } from "@nba/lib/rate-limit"
import { msg } from "@nba/lib/messages"

const log = logger.child({ module: "sign-in" })

const signInRateLimit = rateLimitMiddleware({ window: 60, max: 5 })

export async function POST(req: NextRequest) {
  let email = ""
  let ipAddress: string | undefined
  let userAgent: string | undefined

  try {
    const rateLimitRes = await signInRateLimit(req, "sign-in")
    if (rateLimitRes) return rateLimitRes

    const body = await req.json().catch(() => ({}))
    email = typeof body.email === "string" ? body.email : ""

    const h = req.headers
    ipAddress = h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? undefined
    userAgent = h.get("user-agent") ?? undefined

    // Delegate to better-auth. asResponse:true returns the framework
    // Response (with Set-Cookie) so the session cookie is correctly set.
    const response = await auth.api.signInEmail({
      body: { email, password: body.password ?? "", rememberMe: body.rememberMe ?? false },
      headers: req.headers,
      asResponse: true,
    })

    return response
  } catch (err) {
    // Failed login: record a security audit event so the admin inbox
    // "Sécurité" category and the SecurityTab brute-force counter are real.
    const message = err instanceof Error ? err.message : msg.auth.INVALID_CREDENTIALS
    const status = (err as { status?: number; code?: number })?.status ?? (err as { status?: number; code?: number })?.code ?? 0
    await logAuditEvent({
      userId: undefined,
      action: "LOGIN_FAILED",
      resourceType: "session",
      details: {
        email,
        reason: message,
        status,
        ipAddress,
        userAgent,
      },
    }).catch((err) => {
      log.warn({ err, email }, "Failed to log audit event for failed sign-in")
    })

    return NextResponse.json({ message }, { status: 401 })
  }
}
