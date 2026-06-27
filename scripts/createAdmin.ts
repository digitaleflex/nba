#!/usr/bin/env tsx
import "dotenv/config"
import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { prisma } from "../src/lib/db"

async function main() {
  const email = process.argv.find((a) => a.startsWith("--email="))?.split("=")[1]
  const password = process.argv.find((a) => a.startsWith("--password="))?.split("=")[1]

  if (!email || !password) {
    console.error("Usage: npx tsx scripts/createAdmin.ts --email=admin@example.com --password=securepass")
    process.exit(1)
  }

  const superAdminRole = await prisma.role.findUnique({ where: { name: "SUPER_ADMIN" } })
  if (!superAdminRole) {
    console.error("SUPER_ADMIN role not found. Run `npx tsx scripts/seed.ts` first.")
    process.exit(1)
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    await prisma.user.update({
      where: { email },
      data: { roleId: superAdminRole.id },
    })
    console.log(`✅ Rôle SUPER_ADMIN assigné à ${email}`)
    return
  }

  const auth = betterAuth({
    database: prismaAdapter(prisma as any, { provider: "postgresql" }),
    emailAndPassword: { enabled: true },
    advanced: { database: { generateId: () => crypto.randomUUID() } },
  })

  const { error } = await auth.api.signUpEmail({
    body: { email, password, name: email.split("@")[0] },
  })

  if (error) {
    console.error("Erreur création utilisateur:", error.message)
    process.exit(1)
  }

  await prisma.user.update({
    where: { email },
    data: { roleId: superAdminRole.id, emailVerified: true },
  })

  console.log(`✅ Admin créé: ${email}`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
