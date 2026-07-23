import { NextRequest, NextResponse } from "next/server"
import { auth } from "@nba/lib/auth"
import { prisma } from "@nba/lib/db"
import { logger } from "@nba/lib/logger"
import { logAuditEvent } from "@nba/lib/services/audit"
import { rateLimitMiddleware } from "@nba/lib/rate-limit"
import { msg } from "@nba/lib/messages"
import { detectNewDevice, sendVerificationCode } from "@nba/lib/services/device"
import { syncRiskEngine, asyncRiskEngine } from "@nba/lib/security/risk-engine"
import { SessionManager } from "@nba/lib/security/session-manager"
import { securityEventBus } from "@nba/lib/security/security-event-bus"
import { recordLogin } from "@nba/lib/services/streak"

const log = logger.child({ module: "sign-in" })
const signInRateLimit = rateLimitMiddleware({ window: 60, max: 5 })
const sessionManager = new SessionManager()

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

    // ── Delegate to better-auth (credentials validated here) ──
    const response = await auth.api.signInEmail({
      body: {
        email,
        password: body.password ?? "",
        rememberMe: body.rememberMe ?? false,
      },
      headers: req.headers,
      asResponse: true,
    })

    // ── Post-auth : device detection + session binding ──
    if (response.ok || response.status === 200) {
      let userId: string | undefined
      let sessionId: string | undefined
      let deviceId: string | undefined
      let isNewDevice = false

      try {
        // Recuperer la session creee
        const sessionCookie = response.headers.getSetCookie?.()
          ?.find(c => c.includes("better-auth.session_token"))
        if (sessionCookie) {
          const tokenMatch = sessionCookie.match(/better-auth\.session_token=([^;]+)/)
          if (tokenMatch) {
            const sessionToken = tokenMatch[1]
            const session = await prisma.session.findUnique({
              where: { token: sessionToken },
              select: { id: true, userId: true },
            })
            if (session) {
              userId = session.userId
              sessionId = session.id
            }
          }
        }

        if (userId) {
          // Device detection
          const deviceResult = await detectNewDevice(userId, req)
          deviceId = deviceResult.deviceId
          isNewDevice = deviceResult.isNew

          if (deviceId && sessionId) {
            await sessionManager.bindSessionToDevice(sessionId, deviceId)
          }

          // Risk scoring async
          if (sessionId && ipAddress) {
            await asyncRiskEngine.evaluateAsync(sessionId, userId, ipAddress, deviceId)
          }

          // Abuse detection
          if (userId && ipAddress) {
            const { abuseDetector } = await import("@nba/lib/security/abuse-detector")
            const abuse = await abuseDetector.checkLogin(userId, ipAddress, deviceId)
            if (abuse && abuse.action === "suspend") {
              await securityEventBus.emit({
                userId, type: "SECURITY_ALERT", severity: "HIGH",
                details: { abuse: abuse.type, category: abuse.category },
                ipAddress, sessionId, deviceId,
              })
            }
          }

          // Login streak (retention)
          if (userId) {
            recordLogin(userId).catch(() => {})
          }

          // Notification nouvel appareil
          if (isNewDevice) {
            const user = await prisma.user.findUnique({
              where: { id: userId },
              select: { name: true, email: true },
            })
            if (user) {
              await securityEventBus.emit({
                userId,
                type: "LOGIN_NEW_DEVICE",
                severity: "WARNING",
                details: { deviceId, ipAddress, userAgent },
                ipAddress,
                userAgent,
                deviceId,
                sessionId,
              })
              await sendVerificationCode(userId, user.email, req)
            }
          }
        }
      } catch (err) {
        log.warn({ err, errorCode: "POST_AUTH_ERROR" }, "Echec post-auth traitement")
      }
    }

    return response
  } catch (err) {
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
      log.warn({ err, email, errorCode: "DATABASE_ERROR" }, "Failed to log audit event for failed sign-in")
    })

    return NextResponse.json({ message }, { status: 401 })
  }
}
