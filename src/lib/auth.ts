import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { admin } from "better-auth/plugins"
import { prisma } from "./db"
import { nextCookies } from "better-auth/next-js"
import { sendVerificationEmail, sendResetPasswordEmail, sendWelcomeEmail } from "./services/notifications"
import { isEmailBanned } from "./services/moderation"

const trustedOrigins = [
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
].filter(Boolean) as string[]

export const auth = betterAuth({
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
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    },
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
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerificationEmail(user, url)
    },
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 3600, max: 3 },
      "/request-password-reset": { window: 3600, max: 3 },
    },
  },
  advanced: {
    database: {
      generateId: () => crypto.randomUUID(),
    },
    ipAddress: {
      ipAddressHeaders: ["x-forwarded-for", "x-real-ip", "cf-connecting-ip"],
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const banned = await isEmailBanned(user.email)
          if (banned) {
            throw new Error(`Ce compte a été banni : ${banned.reason}. Contactez le support.`)
          }
        },
        after: async (user) => {
          await sendWelcomeEmail({ id: user.id, name: user.name, email: user.email })
        },
      },
    },
  },
  plugins: [
    // Impersonation admin : permet à un ADMIN/SUPER_ADMIN de se connecter
    // "en tant que" un membre pour voir son compte de son point de vue.
    // Le rôle better-auth est lu sur la colonne `ba_role` (synchronisée avec
    // le RBAC custom). adminUserIds: [] bypass la validation de adminRoles
    // (qui exigerait de redéclarer tous les rôles) ; l'admin est reconnu via
    // ba_role = "admin" (initialisé par le backfill).
    admin({
      adminUserIds: [],
      schema: {
        user: {
          fields: {
            role: { fieldName: "ba_role" },
          },
        },
      } as any,
    }),
    nextCookies(),
  ],
})

export type Session = typeof auth.$Infer.Session
