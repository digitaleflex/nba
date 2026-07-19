import "dotenv/config"
import { cleanupGhostAccess } from "../src/lib/services/access-cleanup"

async function main() {
  const dryRun = process.argv.includes("--dry-run")
  console.log(`[cleanup-ghost-access] ${dryRun ? "DRY RUN" : "RUN"} - debut`)

  const result = await cleanupGhostAccess({ dryRun })

  console.log(`[cleanup-ghost-access] Utilisateurs fantomes: ${result.usersAffected}`)
  console.log(`[cleanup-ghost-access] Acces APPROVED revoques: ${result.accessRequestsRevoked}`)

  if (result.byPlan.length > 0) {
    console.log(`[cleanup-ghost-access] Par plan:`)
    for (const p of result.byPlan) {
      console.log(`  - ${p.planName}: ${p.revoked}`)
    }
  }

  if (result.ghostUsers.length > 0) {
    console.log(`[cleanup-ghost-access] Utilisateurs concernes:`)
    for (const u of result.ghostUsers) {
      console.log(`  - ${u.email} (${u.name}) [${u.reason}]`)
    }
  }

  console.log(`[cleanup-ghost-access] Termine.`)
  process.exit(0)
}

main().catch((err) => {
  console.error("[cleanup-ghost-access] ERREUR:", err)
  process.exit(1)
})
