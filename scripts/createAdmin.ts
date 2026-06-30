#!/usr/bin/env tsx
import "dotenv/config"
import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { prisma } from "../src/lib/db"

async function main() {
  const email = process.argv.find((a) => a.startsWith("--email="))?.split("=")[1]
    || process.env.ADMIN_EMAIL
  const password = process.argv.find((a) => a.startsWith("--password="))?.split("=")[1]
    || process.env.ADMIN_PASSWORD
  const name = process.argv.find((a) => a.startsWith("--name="))?.split("=")[1]
    || process.env.ADMIN_NAME
    || email?.split("@")[0]
    || "admin"

  if (!email || !password) {
    console.error("Usage: npx tsx scripts/createAdmin.ts --email=admin@example.com --password=securepass")
    console.error("Or set ADMIN_EMAIL and ADMIN_PASSWORD environment variables.")
    process.exit(1)
  }

  const superAdminRole = await prisma.role.findUnique({ where: { name: "SUPER_ADMIN" } })
  if (!superAdminRole) {
    console.error("SUPER_ADMIN role not found. Run `npx tsx scripts/seed.ts` first.")
    process.exit(1)
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    console.log(`Utilisateur ${email} existe déjà. Recréation avec le nouveau mot de passe...`)
    await prisma.session.deleteMany({ where: { userId: existing.id } })
    await prisma.account.deleteMany({ where: { userId: existing.id } })
    await prisma.user.delete({ where: { id: existing.id } })
  }

  const auth = betterAuth({
    database: prismaAdapter(prisma as any, { provider: "postgresql" }),
    emailAndPassword: { enabled: true },
    advanced: { database: { generateId: () => crypto.randomUUID() } },
  })

  try {
    await auth.api.signUpEmail({
      body: { email, password, name },
    })
  } catch (error: any) {
    console.error("Erreur création utilisateur:", error.message || error)
    process.exit(1)
  }

  await prisma.user.update({
    where: { email },
    data: { roleId: superAdminRole.id, emailVerified: true },
  })

  console.log(`✅ Admin créé: ${email}`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
