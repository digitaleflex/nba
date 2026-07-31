import { prisma } from "../db"
import { logAuditEvent } from "../services/audit"
import { securityEventBus } from "./security-event-bus"
import { logger } from "../logger"
import type { AuthAttemptType } from "@nba/generated/prisma/enums"

const log = logger.child({ module: "auth-attempt-recorder" })

export interface RecordAuthAttemptInput {
  email: string
  type: AuthAttemptType
  success: boolean
  ipAddress?: string
  userAgent?: string
  userId?: string | null
  deviceId?: string | null
  country?: string | null
  reason?: string | null
  status?: number
}

function auditAction(type: AuthAttemptType, success: boolean): string {
  if (type === "SIGNUP") return success ? "SIGNUP_SUCCESS" : "SIGNUP_FAILED"
  return success ? "LOGIN_SUCCESS" : "LOGIN_FAILED"
}

/**
 * Enregistre chaque tentative d'authentification (connexion ET inscription,
 * y compris les échecs) pour le débogage et la détection d'abus :
 *  - ligne `login_attempts` (email brut, type, raison, IP) — source de
 *    vérité pour l'admin et les règles anti force-brute ;
 *  - journal d'audit (email hashé dans les détails, email brut en
 *    resourceLabel pour la recherche) ;
 *  - événement sécurité LOGIN_FAILED quand un compte existe (alimente la
 *    règle brute_force → suspension automatique).
 */
export async function recordAuthAttempt(input: RecordAuthAttemptInput): Promise<void> {
  const email = input.email.trim().toLowerCase()
  const ipAddress = input.ipAddress ?? "unknown"

  try {
    await prisma.loginAttempt.create({
      data: {
        userId: input.userId ?? null,
        email,
        success: input.success,
        type: input.type,
        reason: input.reason ?? null,
        ipAddress,
        userAgent: input.userAgent ?? null,
        deviceId: input.deviceId ?? null,
        country: input.country ?? null,
      },
    })
  } catch (err) {
    log.error({ err, errorCode: "DATABASE_ERROR" }, "Echec enregistrement tentative auth")
  }

  try {
    await logAuditEvent({
      userId: input.userId ?? undefined,
      action: auditAction(input.type, input.success),
      resourceType: input.type === "SIGNUP" ? "user" : "session",
      resourceLabel: email,
      details: {
        email,
        success: input.success,
        reason: input.reason ?? null,
        status: input.status,
        ipAddress,
        userAgent: input.userAgent,
      },
    })
  } catch (err) {
    log.error({ err, errorCode: "INTEGRATION_ERROR" }, "Echec journalisation audit tentative auth")
  }

  // Événement LOGIN_FAILED uniquement pour un échec de connexion sur un compte
  // existant : c'est lui qui déclenche la règle brute_force (suspension après
  // 5 échecs en 1 min). Un email inconnu n'a pas de userId → pas d'événement.
  if (!input.success && input.type === "LOGIN" && input.userId) {
    try {
      await securityEventBus.emit({
        userId: input.userId,
        type: "LOGIN_FAILED",
        severity: "WARNING",
        ipAddress,
        userAgent: input.userAgent,
        deviceId: input.deviceId ?? undefined,
        details: {
          email,
          reason: input.reason ?? "invalid_credentials",
          status: input.status,
        },
      })
    } catch (err) {
      log.error({ err, errorCode: "INTEGRATION_ERROR" }, "Echec event securite LOGIN_FAILED")
    }
  }
}
