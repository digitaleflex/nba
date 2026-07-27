import { NextRequest, NextResponse } from "next/server"
import { auth } from "@nba/lib/auth"
import { prisma } from "@nba/lib/db"
import { logger } from "@nba/lib/logger"
import { logAuditEvent } from "@nba/lib/services/audit"
import { rateLimitMiddleware } from "@nba/lib/rate-limit"
import { getConnection as getRedis } from "@nba/lib/redis-pubsub"
import { msg } from "@nba/lib/messages"
import { AUTH_MESSAGES } from "@nba/lib/auth-error-messages"
import { detectNewDevice, sendVerificationCode } from "@nba/lib/services/device"
import { syncRiskEngine, asyncRiskEngine } from "@nba/lib/security/risk-engine"
import { SessionManager } from "@nba/lib/security/session-manager"
import { securityEventBus } from "@nba/lib/security/security-event-bus"
import { incidentResponder } from "@nba/lib/security/incident-responder"
import { abuseDetector } from "@nba/lib/security/abuse-detector"

const log = logger.child({ module: "sign-in" })
const signInRateLimit = rateLimitMiddleware({ window: 60, max: 5 })
const sessionManager = new SessionManager()

const PLAYBOOK_BY_ABUSE: Record<string, string> = {
  BRUTE_FORCE: "BRUTE_FORCE",
  BLOCKED_DEVICE_LOGIN: "ACCOUNT_TAKEOVER",
  LOGIN_VELOCITY: "CREDENTIAL_STUFFING",
  LOGIN_FROM_TOR: "DORMANT_ACCOUNT_REUSE",
  DORMANT_ACCOUNT_REUSE: "DORMANT_ACCOUNT_REUSE",
}

async function blockLoginAndRespond(
  userId: string, sessionId: string | undefined,
  message: string, status: number,
): Promise<NextResponse> {
  if (sessionId) {
    await prisma.session.deleteMany({ where: { id: sessionId } })
  }
  return NextResponse.json({ message }, { status })
}

export async function POST(req: NextRequest) {
  let email = ""
  let ipAddress: string | undefined
  let userAgent: string | undefined

  try {
    const rateLimitRes = await signInRateLimit(req, "sign-in")
    if (rateLimitRes) return rateLimitRes

    const body = await req.json().catch(() => ({}))
    email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""

    const h = req.headers
    ipAddress = h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? undefined
    userAgent = h.get("user-agent") ?? undefined

    // ── Pre-auth : IP bloquee ? ──
    if (ipAddress) {
      const redis = getRedis()
      if (redis) {
        const blocked = await redis.get(`blocked:ip:${ipAddress}`)
        if (blocked) {
          return NextResponse.json(
            { message: "Trop de tentatives. Réessayez dans 1 minute." },
            { status: 429 },
          )
        }
      }
    }

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

    // ── Post-auth : securite + device binding ──
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
          const tokenMatch = sessionCookie.match(/(?:__Secure-)?better-auth\.session_token=([^;]+)/)
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

          // ── Sync risk evaluation (avec toutes les donnees) ──
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
              twoFactorBackupCodes: { take: 1, select: { id: true } },
              securityPolicy: { select: { require2fa: true } },
              accessRequests: {
                where: { status: "APPROVED" },
                select: { plan: { select: { maxSessions: true } } },
                take: 1,
              },
            },
          })

          const has2fa = (user?.twoFactorBackupCodes?.length ?? 0) > 0 || user?.securityPolicy?.require2fa === true

          const riskResult = await syncRiskEngine.evaluate({
            userId,
            email,
            ipAddress: ipAddress ?? "",
            userAgent: userAgent ?? "",
            deviceId,
            has2fa,
            planMaxSessions: user?.accessRequests?.[0]?.plan?.maxSessions ?? 5,
          })

          if (riskResult.shouldBlock) {
            await securityEventBus.emit({
              userId, type: "LOGIN_BLOCKED", severity: "HIGH",
              details: { reason: "sync_risk", score: riskResult.totalScore, factors: riskResult.factors },
              ipAddress, sessionId, deviceId,
              riskScore: riskResult.totalScore,
            })
            return blockLoginAndRespond(userId, sessionId, "Connexion bloquée pour des raisons de sécurité. Contactez le support si le problème persiste.", 423)
          }

          if (riskResult.requiresChallenge) {
            const redis = getRedis()
            if (redis && sessionId) {
              await redis.setex(`challenge_2fa:${userId}:${sessionId}`, 600, "1")
            }
          }

          // ── Abuse detection + enforcement ──
          if (ipAddress) {
            const abuse = await abuseDetector.checkLogin(userId, ipAddress, deviceId)
            if (abuse) {
              await securityEventBus.emit({
                userId, type: "SECURITY_ALERT", severity: "HIGH",
                details: { abuse: abuse.type, category: abuse.category, action: abuse.action },
                ipAddress, sessionId, deviceId,
              })

              switch (abuse.action) {
                case "suspend": {
                  await prisma.user.update({
                    where: { id: userId },
                    data: { isActive: false, suspendedAt: new Date() },
                  })
                  const playbookType = PLAYBOOK_BY_ABUSE[abuse.type]
                  if (playbookType) {
                    await incidentResponder.execute(userId, playbookType, { ipAddress, sessionId })
                  }
                  return blockLoginAndRespond(userId, sessionId, "Compte suspendu pour activité suspecte. Contactez le support.", 423)
                }

                case "block_ip": {
                  const redis = getRedis()
                  if (redis) {
                    await redis.setex(`blocked:ip:${ipAddress}`, 86400, "1")
                  }
                  return blockLoginAndRespond(userId, sessionId, "Accès refusé temporairement. Réessayez plus tard.", 429)
                }

                case "challenge_2fa": {
                  const redis = getRedis()
                  if (redis && sessionId) {
                    await redis.setex(`challenge_2fa:${userId}:${sessionId}`, 600, "1")
                  }
                  const playbookType = PLAYBOOK_BY_ABUSE[abuse.type]
                  if (playbookType) {
                    await incidentResponder.execute(userId, playbookType, { ipAddress, sessionId })
                  }
                  break
                }
              }
            }
          }

          // ── Abuse detection signup si nouveau compte ──
          if (isNewDevice) {
            const signupAbuse = await abuseDetector.checkSignup(email, ipAddress ?? "", deviceId ?? "")
            if (signupAbuse && signupAbuse.action !== "log") {
              await securityEventBus.emit({
                userId, type: "SECURITY_ALERT", severity: "HIGH",
                details: { abuse: signupAbuse.type, category: signupAbuse.category },
                ipAddress, sessionId, deviceId,
              })
              if (signupAbuse.action === "block_ip") {
                const redis = getRedis()
                if (redis) {
                  await redis.setex(`blocked:ip:${ipAddress}`, 86400, "1")
                }
                await incidentResponder.execute(userId, "MULTIPLE_ACCOUNTS", { ipAddress, sessionId })
              }
            }
          }

          // ── Notification nouvel appareil ──
          if (isNewDevice) {
            const notifiedUser = await prisma.user.findUnique({
              where: { id: userId },
              select: { name: true, email: true },
            })
            if (notifiedUser) {
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
              await sendVerificationCode(userId, notifiedUser.email, req)
            }
          }

          // ── Risk scoring async ──
          if (sessionId && ipAddress) {
            await asyncRiskEngine.evaluateAsync(sessionId, userId, ipAddress, deviceId)
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

    return NextResponse.json({ message }, { status: status || 401 })
  }
}
