import "dotenv/config"
import { prisma } from "../src/lib/db"

const PLANS = [
  { name: "Signals X Forex", price: 0, durationDays: 30, sortOrder: 1 },
  { name: "Signals X Deriv", price: 0, durationDays: 30, sortOrder: 2 },
  { name: "Signals X Forex + Deriv", price: 0, durationDays: 30, sortOrder: 3 },
  { name: "Signals X Pro Forex", price: 0, durationDays: 30, sortOrder: 4 },
  { name: "Signals X Pro Deriv", price: 0, durationDays: 30, sortOrder: 5 },
  { name: "Signals X Pro Forex + Deriv", price: 0, durationDays: 30, sortOrder: 6 },
]

const DEFAULT_ROLES = [
  { name: "Membre", description: "Utilisateur standard avec accès aux signaux", isSystem: true },
  { name: "Admin", description: "Administrateur avec accès complet", isSystem: true },
]

async function main() {
  console.log("Seeding roles...")
  for (const role of DEFAULT_ROLES) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: role,
      create: role,
    })
    console.log(`  ✅ Rôle: ${role.name}`)
  }

  console.log("Seeding subscription plans...")
  for (const plan of PLANS) {
    await prisma.subscriptionPlan.upsert({
      where: { name: plan.name },
      update: plan,
      create: { ...plan, currency: "F CFA", features: [] },
    })
    console.log(`  ✅ ${plan.name}`)
  }

  console.log("Done!")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
