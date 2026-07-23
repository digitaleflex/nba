import { msg } from "./messages"
import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { twoFactor } from "better-auth/plugins"
import { prisma } from "./db"
import { nextCookies } from "better-auth/next-js"
import { sendVerificationEmail, sendResetPasswordEmail, sendWelcomeEmail, sendOtpEmail } from "./services/notifications"
import { isEmailBanned } from "./services/moderation"
import { purgeSoftDeletedUser } from "./services/user-deletion"
import { SessionManager } from "./security/session-manager"
import { securityEventBus } from "./security/security-event-bus"
import { securityNotificationService } from "./security/security-notification-service"

const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/+$/, "")

const trustedOrigins = [appUrl].filter(Boolean) as string[]

const sessionManager = new SessionManager()

export const auth = betterAuth({
  baseURL: appUrl,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  trustedOrigins,
  user: {
    modelName: "user",
  },
  session: {
    modelName: "session",
    expiresIn: 60 * 60 * 24 * 7, // 7 jours
    updateAge: 60 * 60 * 24, // refresh token toutes les 24h
  },
  account: {
    modelName: "account",
  },
  verification: {
    modelName: "verification",
  },
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      await sendResetPasswordEmail(user, url)
    },
  },
  password: {
    minPasswordLength: 10,
  },
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      sendVerificationEmail(user, url).catch(() => {})
    },
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 3600, max: 100 },
      "/request-password-reset": { window: 3600, max: 3 },
    },
  },
  advanced: {
    database: {
      generateId: () => crypto.randomUUID(),
    },
    ipAddress: {
      ipAddressHeaders:
        process.env.NODE_ENV === "production"
          ? ["x-forwarded-for"]
          : [],
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const banned = await isEmailBanned(user.email)
          if (banned) {
            throw new Error(msg.auth.ACCOUNT_BANNED(banned.reason))
          }
          await purgeSoftDeletedUser(prisma, user.email)
          if (!user.roleId) {
            const memberRole = await prisma.role.findUnique({ where: { name: "MEMBER" }, select: { id: true } })
            if (memberRole) {
              return { data: { roleId: memberRole.id } }
            }
          }
        },
        after: async (user) => {
          sendWelcomeEmail({ id: user.id, name: user.name, email: user.email }).catch(() => {})
          try {
            const { newUserRegisteredAdminEmail } = await import("./email")
            const { sendAdminAlert } = await import("./security/admin-alert")
            const template = newUserRegisteredAdminEmail({ name: user.name, email: user.email })
            sendAdminAlert(template.subject, template.html).catch(() => {})
          } catch {}
        },
      },
    },
    session: {
      create: {
        before: async (session) => {
          const limit = await sessionManager.checkSessionLimit(session.userId)
          if (!limit.allowed) {
            const revoked = await sessionManager.revokeExcessSessions(session.userId, limit.maxSessions)
            if (revoked > 0) {
              await securityEventBus.emit({
                userId: session.userId,
                type: "LOGIN_SESSION_LIMIT",
                severity: "WARNING",
                details: {
                  action: "revoked_oldest",
                  count: revoked,
                  maxSessions: limit.maxSessions,
                  activeCount: limit.activeCount,
                },
              })
            }
          }
        },
        after: async (session) => {
          try {
            await securityEventBus.emit({
              userId: session.userId,
              type: "LOGIN_SUCCESS",
              severity: "INFO",
              sessionId: session.id,
              details: {
                token: session.token?.slice(0, 8) + "...",
              },
            })
            const user = await prisma.user.findUnique({
              where: { id: session.userId },
              select: { email: true },
            })
            if (user) {
              await securityNotificationService.handlePostLogin(session.userId, user.email, {})
            }
          } catch {
            // Non-critical
          }
        },
      },
    },
  },
  plugins: [
    twoFactor({
      otpOptions: { async sendOTP({ user, otp }) { await sendOtpEmail(user.name, user.email, otp) } },
    }),
    nextCookies(),
  ],
})

export type Session = typeof auth.$Infer.Session
