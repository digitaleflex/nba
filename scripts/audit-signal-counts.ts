import { prisma } from "../src/lib/db"

async function main() {
  const plans = await prisma.subscriptionPlan.findMany({
    where: { deletedAt: null },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, isActive: true, sortOrder: true },
  })

  console.log("=== AUDIT: comptes destinataires par plan ===\n")
  console.log("Plan".padEnd(32), "activeOK".padStart(10), "allOK".padStart(8), "delta".padStart(7), "  _countUI")
  console.log("-".repeat(80))

  for (const plan of plans) {
    // Ce que l'UI affiche (badge) : _count.accessRequests APPROVED, sans filtre user actif
    const allApproved = await prisma.accessRequest.count({
      where: { planId: plan.id, status: "APPROVED" },
    })

    // Ce que l'estimate renvoie (vrai destinataire) : user actif + non supprimé + APPROVED
    const activeApproved = await prisma.user.count({
      where: {
        isActive: true,
        deletedAt: null,
        accessRequests: { some: { planId: plan.id, status: "APPROVED" } },
      },
    })

    // Ce que la distribution envoie réellement : actif + non supprimé + APPROVED pour ce plan + (OR override)
    const overrideCount = await prisma.user.count({ where: { signalsAccessOverride: true, isActive: true, deletedAt: null } })
    const delta = allApproved - activeApproved
    console.log(
      plan.name.padEnd(32),
      String(activeApproved).padStart(10),
      String(allApproved).padStart(8),
      String(delta).padStart(7),
      `  _count.accessRequests APPROVED = ${allApproved}`,
    )
  }

  console.log("\n=== Audit override ===")
  const overrides = await prisma.user.findMany({
    where: { signalsAccessOverride: true },
    select: { id: true, email: true, name: true, isActive: true, deletedAt: true },
  })
  console.log(`Membres avec signalsAccessOverride: ${overrides.length}`)
  for (const u of overrides) {
    console.log(`  - ${u.email} | ${u.name} | active=${u.isActive} | deleted=${!!u.deletedAt}`)
  }

  console.log("\n=== Audit désactivés/supprimés avec accès APPROVED ===")
  const ghosts = await prisma.user.findMany({
    where: {
      OR: [{ isActive: false }, { deletedAt: { not: null } }],
      accessRequests: { some: { status: "APPROVED" } },
    },
    select: {
      id: true, email: true, name: true, isActive: true, deletedAt: true,
      _count: { select: { accessRequests: { where: { status: "APPROVED" } } } },
    },
  })
  console.log(`Utilisateurs "fantômes" (inactifs/supprimés) avec accès APPROVED: ${ghosts.length}`)
  for (const u of ghosts) {
    console.log(`  - ${u.email} | ${u.name} | active=${u.isActive} | deleted=${u.deletedAt?.toISOString() ?? "non"} | approved_plans=${u._count.accessRequests}`)
  }

  console.log("\n=== Total général ===")
  const totalActive = await prisma.user.count({ where: { isActive: true, deletedAt: null } })
  console.log(`Membres actifs non supprimés: ${totalActive}`)

  await prisma.$disconnect()
}

main().catch((e) => { console.error(e); process.exit(1) })
