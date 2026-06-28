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

const ROLES: { name: string; description: string }[] = [
  { name: "SUPER_ADMIN", description: "Accès système complet" },
  { name: "ADMIN", description: "Opérations administratives" },
  { name: "KYC_AGENT", description: "Vérification KYC" },
  { name: "SUPPORT_AGENT", description: "Support utilisateur" },
  { name: "MEMBER", description: "Accès standard à la plateforme" },
]

interface PermissionDef {
  name: string
  module: string
  description: string
}

const PERMISSIONS: PermissionDef[] = [
  { name: "users.read", module: "users", description: "Consulter les utilisateurs" },
  { name: "users.update", module: "users", description: "Modifier les utilisateurs" },
  { name: "users.suspend", module: "users", description: "Suspendre des utilisateurs" },
  { name: "subscriptions.manage", module: "subscriptions", description: "Gérer les abonnements" },
  { name: "kyc.review", module: "kyc", description: "Vérifier les documents KYC" },
  { name: "broker.review", module: "broker", description: "Vérifier les documents broker" },
  { name: "signals.create", module: "signals", description: "Créer des signaux" },
  { name: "signals.publish", module: "signals", description: "Publier des signaux" },
  { name: "notifications.send", module: "notifications", description: "Envoyer des notifications" },
  { name: "settings.manage", module: "settings", description: "Gérer les paramètres" },
  { name: "audit.read", module: "audit", description: "Consulter les logs d'audit" },
]

type RoleName = (typeof ROLES)[number]["name"]

const ROLE_PERMISSIONS: Record<RoleName, string[]> = {
  SUPER_ADMIN: [
    "users.read", "users.update", "users.suspend",
    "subscriptions.manage",
    "kyc.review", "broker.review",
    "signals.create", "signals.publish",
    "notifications.send",
    "settings.manage",
    "audit.read",
  ],
  ADMIN: [
    "users.read", "users.update", "users.suspend",
    "subscriptions.manage",
    "kyc.review", "broker.review",
    "signals.create", "signals.publish",
    "notifications.send",
    "audit.read",
  ],
  KYC_AGENT: [
    "kyc.review", "broker.review",
  ],
  SUPPORT_AGENT: [
    "users.read",
  ],
  MEMBER: [],
}

async function main() {
  console.log("Seeding roles...")
  const roleMap = new Map<string, string>()
  for (const role of ROLES) {
    const created = await prisma.role.upsert({
      where: { name: role.name },
      update: { description: role.description },
      create: { ...role, isSystem: true },
    })
    roleMap.set(role.name, created.id)
    console.log(`  ✅ Rôle: ${role.name}`)
  }

  console.log("Seeding permissions...")
  const permissionMap = new Map<string, string>()
  for (const perm of PERMISSIONS) {
    const created = await prisma.permission.upsert({
      where: { name: perm.name },
      update: { description: perm.description, module: perm.module },
      create: perm,
    })
    permissionMap.set(perm.name, created.id)
    console.log(`  ✅ Permission: ${perm.name}`)
  }

  console.log("Assigning permissions to roles...")
  for (const [roleName, permNames] of Object.entries(ROLE_PERMISSIONS)) {
    const roleId = roleMap.get(roleName)
    if (!roleId) continue

    for (const permName of permNames) {
      const permissionId = permissionMap.get(permName)
      if (!permissionId) continue

      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId, permissionId } },
        update: {},
        create: { roleId, permissionId },
      })
    }
    console.log(`  ✅ ${roleName}: ${permNames.length} permissions`)
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
