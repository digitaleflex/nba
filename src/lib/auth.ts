import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { prisma } from "./db"
import { nextCookies } from "better-auth/next-js"
import { sendVerificationEmail, sendResetPasswordEmail, sendWelcomeEmail } from "./services/notifications"
import { isEmailBanned } from "./services/moderation"
import { purgeSoftDeletedUser } from "./services/user-deletion"

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
    updateAge: 60 * 60 * 24, // refresh token toutes les 24h (stale session prevention)
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
    password: {
      minLength: 10,
      autoSignIn: false,
    },
    sendResetPassword: async ({ user, url }) => {
      await sendResetPasswordEmail(user, url)
    },
  },
  emailVerification: {
    // Désactive l'envoi auto de l'email de vérification better-auth à l'inscription :
    // la vérification est gérée par notre propre OTP onboarding (/api/onboarding/send-otp),
    // évitant un double email (lien better-auth + OTP) redondant et confus pour l'utilisateur.
    sendOnSignUp: false,
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
      // En production derrière Cloudflare, truster uniquement cf-connecting-ip
      // (Cloudflare écrase le header, il ne peut pas être spoofé par le client).
      // En dev/staging sans CDN, ne truster aucun header proxy.
      ipAddressHeaders:
        process.env.NODE_ENV === "production"
          ? ["cf-connecting-ip"]
          : [],
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
          await purgeSoftDeletedUser(prisma, user.email)
        },
        after: async (user) => {
          await sendWelcomeEmail({ id: user.id, name: user.name, email: user.email })
        },
      },
    },
  },
  plugins: [
    nextCookies(),
  ],
})

export type Session = typeof auth.$Infer.Session
