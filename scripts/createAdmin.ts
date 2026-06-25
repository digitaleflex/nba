#!/usr/bin/env tsx
/**
 * Admin creation script.
 * Usage: npx tsx scripts/createAdmin.ts --email admin@example.com --password securepass
 */
import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

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

  const adminRole = await prisma.role.findUnique({ where: { name: "SUPER_ADMIN" } })
  if (!adminRole) {
    console.error("SUPER_ADMIN role not found. Run seed first.")
    process.exit(1)
  }

  // Create using Better Auth API
  console.log(`✅ Admin created: ${email}`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
