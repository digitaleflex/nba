#!/usr/bin/env tsx
import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { auth } from "../src/lib/auth"

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
})

async function main() {
  const email = process.argv.find((a) => a.startsWith("--email="))?.split("=")[1]
  const password = process.argv.find((a) => a.startsWith("--password="))?.split("=")[1]

  if (!email || !password) {
    console.error("Usage: npx tsx scripts/createAdmin.ts --email=admin@example.com --password=securepass")
    process.exit(1)
  }

  const superAdminRole = await prisma.role.findUnique({ where: { name: "SUPER_ADMIN" } })
  if (!superAdminRole) {
    console.error("SUPER_ADMIN role not found. Run seed first.")
    process.exit(1)
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    await prisma.user.update({
      where: { email },
      data: { roleId: superAdminRole.id },
    })
    console.log(`✅ Role mis à jour pour ${email}`)
    return
  }

  await auth.api.signUpEmail({
    body: {
      email,
      password,
      name: email.split("@")[0],
    },
  })

  await prisma.user.update({
    where: { email },
    data: { roleId: superAdminRole.id, emailVerified: true },
  })

  console.log(`✅ Admin créé: ${email}`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
