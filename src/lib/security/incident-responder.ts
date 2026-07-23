import { prisma } from "../db"
import { getConnection as getRedis } from "../redis-pubsub"
import { logger } from "../logger"

const log = logger.child({ module: "incident-responder" })

export type IncidentSeverity = "P0" | "P1" | "P2" | "P3"

export type PlaybookAction =
  | "REVOKE_ALL_SESSIONS"
  | "REVOKE_SESSION"
  | "SUSPEND_ACCOUNT"
  | "BLOCK_IP"
  | "FORCE_2FA"
  | "NOTIFY_USER"
  | "NOTIFY_ADMIN"
  | "LOG_EVENT"
  | "CAPTCHA_CHALLENGE"
  | "CHALLENGE_2FA"

export interface PlaybookStep {
  order: number
  action: PlaybookAction
  automated: boolean
  params?: Record<string, string>
}

export interface IncidentPlaybook {
  id: string
  name: string
  severity: IncidentSeverity
  detectType: string
  steps: PlaybookStep[]
}

export const PLAYBOOKS: IncidentPlaybook[] = [
  {
    id: "IR-001", name: "Credential Stuffing", severity: "P0", detectType: "CREDENTIAL_STUFFING",
    steps: [
      { order: 1, action: "BLOCK_IP", automated: true },
      { order: 2, action: "SUSPEND_ACCOUNT", automated: true, params: { duration: "3600" } },
      { order: 3, action: "FORCE_2FA", automated: true },
      { order: 4, action: "NOTIFY_USER", automated: true },
      { order: 5, action: "NOTIFY_ADMIN", automated: true },
    ],
  },
  {
    id: "IR-002", name: "Session Hijack", severity: "P0", detectType: "SESSION_HIJACK",
    steps: [
      { order: 1, action: "REVOKE_ALL_SESSIONS", automated: true },
      { order: 2, action: "FORCE_2FA", automated: true },
      { order: 3, action: "NOTIFY_USER", automated: true },
      { order: 4, action: "LOG_EVENT", automated: true },
    ],
  },
  {
    id: "IR-003", name: "Brute Force", severity: "P1", detectType: "BRUTE_FORCE",
    steps: [
      { order: 1, action: "BLOCK_IP", automated: true },
      { order: 2, action: "SUSPEND_ACCOUNT", automated: true, params: { duration: "1800" } },
      { order: 3, action: "NOTIFY_USER", automated: true },
    ],
  },
  {
    id: "IR-004", name: "Account Takeover", severity: "P0", detectType: "ACCOUNT_TAKEOVER",
    steps: [
      { order: 1, action: "REVOKE_ALL_SESSIONS", automated: true },
      { order: 2, action: "SUSPEND_ACCOUNT", automated: true },
      { order: 3, action: "FORCE_2FA", automated: true },
      { order: 4, action: "NOTIFY_USER", automated: true },
      { order: 5, action: "NOTIFY_ADMIN", automated: true },
    ],
  },
  {
    id: "IR-005", name: "Impossible Travel", severity: "P1", detectType: "IMPOSSIBLE_TRAVEL",
    steps: [
      { order: 1, action: "REVOKE_SESSION", automated: true },
      { order: 2, action: "CHALLENGE_2FA", automated: true },
      { order: 3, action: "NOTIFY_USER", automated: true },
    ],
  },
  {
    id: "IR-006", name: "API Scraping", severity: "P1", detectType: "API_SCRAPING",
    steps: [
      { order: 1, action: "BLOCK_IP", automated: true, params: { duration: "86400" } },
      { order: 2, action: "NOTIFY_ADMIN", automated: true },
    ],
  },
  {
    id: "IR-007", name: "Distributed Brute Force", severity: "P0", detectType: "DISTRIBUTED_BRUTE_FORCE",
    steps: [
      { order: 1, action: "SUSPEND_ACCOUNT", automated: true },
      { order: 2, action: "CAPTCHA_CHALLENGE", automated: true },
      { order: 3, action: "FORCE_2FA", automated: true },
      { order: 4, action: "NOTIFY_USER", automated: true },
      { order: 5, action: "NOTIFY_ADMIN", automated: true },
    ],
  },
  {
    id: "IR-008", name: "Multiple Account Creation", severity: "P1", detectType: "MULTIPLE_ACCOUNTS",
    steps: [
      { order: 1, action: "BLOCK_IP", automated: true },
      { order: 2, action: "SUSPEND_ACCOUNT", automated: true },
      { order: 3, action: "NOTIFY_ADMIN", automated: true },
    ],
  },
  {
    id: "IR-009", name: "Account Selling", severity: "P1", detectType: "ACCOUNT_SELLING",
    steps: [
      { order: 1, action: "SUSPEND_ACCOUNT", automated: true },
      { order: 2, action: "REVOKE_ALL_SESSIONS", automated: true },
      { order: 3, action: "NOTIFY_ADMIN", automated: true },
    ],
  },
  {
    id: "IR-010", name: "Dormant Account Reuse", severity: "P1", detectType: "DORMANT_ACCOUNT_REUSE",
    steps: [
      { order: 1, action: "CHALLENGE_2FA", automated: true },
      { order: 2, action: "NOTIFY_USER", automated: true },
    ],
  },
  {
    id: "IR-011", name: "Phishing Detection", severity: "P0", detectType: "PHISHING",
    steps: [
      { order: 1, action: "SUSPEND_ACCOUNT", automated: true },
      { order: 2, action: "NOTIFY_USER", automated: true },
      { order: 3, action: "NOTIFY_ADMIN", automated: true },
      { order: 4, action: "LOG_EVENT", automated: true },
    ],
  },
  {
    id: "IR-012", name: "Data Exfiltration", severity: "P0", detectType: "DATA_EXFILTRATION",
    steps: [
      { order: 1, action: "SUSPEND_ACCOUNT", automated: true },
      { order: 2, action: "REVOKE_ALL_SESSIONS", automated: true },
      { order: 3, action: "NOTIFY_ADMIN", automated: true },
      { order: 4, action: "LOG_EVENT", automated: true },
    ],
  },
]

export class IncidentResponder {
   async execute(userId: string, detectType: string, context: { ipAddress?: string; sessionId?: string }): Promise<void> {
    try {
      const playbook = PLAYBOOKS.find(p => p.detectType === detectType)
      if (!playbook) {
        log.warn({ detectType }, "Aucun playbook trouve pour ce type d'incident")
        return
      }

      log.info({ playbook: playbook.id, name: playbook.name, userId }, "Execution playbook")

      const ctx = { ...context, playbookName: playbook.name, playbookSeverity: playbook.severity }

      for (const step of playbook.steps) {
        try {
          await this.executeStep(step, userId, ctx)
          log.info({ step: step.action, userId }, "Etape playbook executee")
        } catch (err) {
          log.error({ err, step: step.action, userId, errorCode: "INTEGRATION_ERROR" }, "Echec etape playbook")
        }
      }
    } catch (err) {
      log.error({ err, userId, detectType, errorCode: "INTEGRATION_ERROR" }, "Echec execution playbook")
    }
  }

  private async executeStep(step: PlaybookStep, userId: string, context: { ipAddress?: string; sessionId?: string; playbookName?: string; playbookSeverity?: string }): Promise<void> {
    const redis = getRedis()

    switch (step.action) {
      case "REVOKE_ALL_SESSIONS":
        await prisma.session.deleteMany({ where: { userId } })
        break

      case "REVOKE_SESSION":
        if (context.sessionId) {
          await prisma.session.deleteMany({ where: { id: context.sessionId, userId } })
        }
        break

      case "SUSPEND_ACCOUNT":
        await prisma.user.update({
          where: { id: userId },
          data: { isActive: false, suspendedAt: new Date() },
        })
        break

      case "BLOCK_IP":
        if (context.ipAddress && redis) {
          const duration = parseInt(step.params?.duration ?? "86400")
          await redis.setex(`blocked:ip:${context.ipAddress}`, duration, "1")
        }
        break

      case "FORCE_2FA":
        await prisma.securityPolicy.upsert({
          where: { userId },
          update: { require2fa: true },
          create: { userId, require2fa: true },
        })
        break

      case "NOTIFY_USER":
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { name: true, email: true },
        })
        if (user) {
          const { notify } = await import("../services/notifications")
          await notify({
            userId,
            type: "SECURITY",
            title: "Alerte de securite",
            body: `Une activite suspecte a ete detectee sur votre compte. Playbook: ${step.params?.playbook ?? "securite"}`,
            data: { incidentPlaybook: true },
          })
        }
        break

      case "NOTIFY_ADMIN":
        const pbName = context.playbookName || step.params?.playbook || "Sécurité"
        const pbSeverity = context.playbookSeverity || "P1"
        const { sendAdminAlert } = await import("./admin-alert")
        await sendAdminAlert(
          `[${pbSeverity}] Alerte: ${pbName} — NBA`,
          `Un incident a été déclenché automatiquement.<br/><br/>
           <b>Playbook :</b> ${pbName}<br/>
           <b>Sévérité :</b> ${pbSeverity}<br/>
           <b>Utilisateur :</b> ${userId || "N/A"}<br/>
           <b>IP :</b> ${context.ipAddress || "N/A"}<br/>
           <b>Actions exécutées :</b> suspension, révocation sessions, blocage IP, etc.<br/><br/>
           Connectez-vous au panel admin pour plus de détails.`,
        ).catch((err) => log.warn({ err, errorCode: "ADMIN_ALERT_FAILED" }, "Échec envoi alerte admin"))
        break

      case "LOG_EVENT":
        const { securityEventBus } = await import("./security-event-bus")
        await securityEventBus.emit({
          userId,
          type: "SECURITY_ALERT",
          severity: "HIGH",
          details: { playbook: true, action: step.action },
          ipAddress: context.ipAddress,
        })
        break

      case "CAPTCHA_CHALLENGE":
        if (redis) {
          await redis.setex(`captcha:required:${userId}`, 3600, "1")
        }
        break
    }
  }
}

export const incidentResponder = new IncidentResponder()
