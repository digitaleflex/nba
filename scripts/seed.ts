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
  const t0 = Date.now()

  // --- 1. Permissions (parallel createMany) ---
  const existingPerms = await prisma.permission.findMany({ select: { name: true } })
  const existingPermNames = new Set(existingPerms.map(p => p.name))
  const newPerms = PERMISSIONS.filter(p => !existingPermNames.has(p.name))
  if (newPerms.length > 0) {
    await prisma.permission.createMany({ data: newPerms, skipDuplicates: true })
  }
  console.log(`  ✅ Permissions: ${PERMISSIONS.length} total (${newPerms.length} added)`)

  // --- 2. Roles (parallel createMany + set isSystem) ---
  const existingRoles = await prisma.role.findMany({ select: { name: true, id: true, isSystem: true } })
  const existingRoleMap = new Map(existingRoles.map(r => [r.name, r]))
  const newRoles = ROLES.filter(r => !existingRoleMap.has(r.name))
  if (newRoles.length > 0) {
    await prisma.role.createMany({
      data: newRoles.map(r => ({ ...r, isSystem: true })),
    })
  }
  // Set isSystem=true on existing roles that don't have it
  const rolesNeedingSystemFlag = existingRoles.filter(r => !r.isSystem).map(r => r.id)
  if (rolesNeedingSystemFlag.length > 0) {
    await prisma.role.updateMany({
      where: { id: { in: rolesNeedingSystemFlag } },
      data: { isSystem: true },
    })
  }
  console.log(`  ✅ Roles: ${ROLES.length} total (${newRoles.length} added)`)

  // --- 3. RolePermissions (bulk) ---
  const allRoles = await prisma.role.findMany({ select: { id: true, name: true } })
  const allPerms = await prisma.permission.findMany({ select: { id: true, name: true } })
  const roleIdByName = new Map(allRoles.map(r => [r.name, r.id]))
  const permIdByName = new Map(allPerms.map(p => [p.name, p.id]))

  // Get existing role-permissions
  const existingRP = await prisma.rolePermission.findMany({ select: { roleId: true, permissionId: true } })
  const existingRPSet = new Set(existingRP.map(rp => `${rp.roleId}:${rp.permissionId}`))

  const newRPs: { roleId: string; permissionId: string }[] = []
  for (const [roleName, permNames] of Object.entries(ROLE_PERMISSIONS)) {
    const roleId = roleIdByName.get(roleName as RoleName)
    if (!roleId) continue
    for (const permName of permNames) {
      const permissionId = permIdByName.get(permName)
      if (!permissionId) continue
      if (!existingRPSet.has(`${roleId}:${permissionId}`)) {
        newRPs.push({ roleId, permissionId })
      }
    }
  }
  if (newRPs.length > 0) {
    // createMany in batches of 1000 to avoid query size limits
    for (let i = 0; i < newRPs.length; i += 1000) {
      await prisma.rolePermission.createMany({
        data: newRPs.slice(i, i + 1000),
        skipDuplicates: true,
      })
    }
  }
  const totalRPs = Object.values(ROLE_PERMISSIONS).reduce((sum, p) => sum + p.length, 0)
  console.log(`  ✅ Role-Permissions: ${totalRPs} total (${newRPs.length} added)`)

  // --- 4. Subscription Plans (parallel createMany) ---
  const existingPlans = await prisma.subscriptionPlan.findMany({ select: { name: true } })
  const existingPlanNames = new Set(existingPlans.map(p => p.name))
  const newPlans = PLANS.filter(p => !existingPlanNames.has(p.name))
  if (newPlans.length > 0) {
    await prisma.subscriptionPlan.createMany({
      data: newPlans.map(p => ({ ...p, currency: "F CFA", features: [] })),
    })
  }
  console.log(`  ✅ Plans: ${PLANS.length} total (${newPlans.length} added)`)

  console.log(`Done! (${Date.now() - t0}ms)`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
