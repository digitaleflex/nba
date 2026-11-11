import "dotenv/config"
import { expireAccess } from "../src/lib/services/access-expiration"

async function main() {
  const dryRun = process.argv.includes("--dry-run")
  console.log(`[expire-access] ${dryRun ? "DRY RUN" : "RUN"} - debut`)

  const result = await expireAccess({ dryRun })

  console.log(`[expire-access] Acces APPROVED verifies: ${result.checked}`)
  console.log(`[expire-access] Acces expires revoques: ${result.revoked}`)

  if (result.byPlan.length > 0) {
    console.log(`[expire-access] Par plan:`)
    for (const p of result.byPlan) {
      console.log(`  - ${p.planName}: ${p.revoked}`)
    }
  }

  if (result.expired.length > 0) {
    console.log(`[expire-access] Acces concernes:`)
    for (const e of result.expired) {
      console.log(`  - ${e.email} (${e.planName}, expire le ${e.expiresAt})`)
    }
  }

  console.log(`[expire-access] Termine.`)
  process.exit(0)
}

main().catch((err) => {
  console.error("[expire-access] ERREUR:", err)
  process.exit(1)
})
