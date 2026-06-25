#!/usr/bin/env tsx
import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
})

async function main() {
  console.log("🌱 Seeding database...")

  // Create roles
  const roles = await Promise.all([
    prisma.role.create({ data: { name: "SUPER_ADMIN", description: "Full system access", isSystem: true } }),
    prisma.role.create({ data: { name: "ADMIN", description: "Administrative operations", isSystem: true } }),
    prisma.role.create({ data: { name: "KYC_AGENT", description: "KYC verification operations", isSystem: true } }),
    prisma.role.create({ data: { name: "SUPPORT_AGENT", description: "Support operations", isSystem: true } }),
    prisma.role.create({ data: { name: "MEMBER", description: "Standard platform access", isSystem: true } }),
  ])

  // Create permissions
  const permissions = [
    { name: "users.read", module: "members", description: "View user profiles" },
    { name: "users.update", module: "members", description: "Update user profiles" },
    { name: "users.suspend", module: "members", description: "Suspend user accounts" },
    { name: "subscriptions.manage", module: "plans", description: "Manage subscriptions" },
    { name: "kyc.review", module: "kyc", description: "Review KYC submissions" },
    { name: "broker.review", module: "broker", description: "Review broker verifications" },
    { name: "signals.create", module: "signals", description: "Create trading signals" },
    { name: "signals.publish", module: "signals", description: "Publish trading signals" },
    { name: "notifications.send", module: "notifications", description: "Send notifications" },
    { name: "settings.manage", module: "admin", description: "Manage system settings" },
    { name: "audit.read", module: "audit", description: "View audit logs" },
  ]

  await Promise.all(permissions.map((p) => prisma.permission.create({ data: p })))

  console.log("✅ Seed complete")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
