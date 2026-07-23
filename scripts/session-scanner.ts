import "dotenv/config"
import { scanSessions } from "../src/lib/security/session-scanner"

async function main() {
  const dryRun = process.argv.includes("--dry-run")
  console.log(`[session-scanner] ${dryRun ? "DRY RUN" : "RUN"} - ${new Date().toISOString()}`)

  const result = await scanSessions()

  console.log(`[session-scanner] Resultats:`)
  console.log(`  IP clusterees:      ${result.ipClusters}`)
  console.log(`  Device sharing:     ${result.deviceShares}`)
  console.log(`  Geo anomalies:      ${result.geoAnomalies}`)
  console.log(`  IP velocity hits:   ${result.ipVelocityHits}`)
  console.log(`  Total flags:        ${result.totalFlags}`)
  if (result.errors.length > 0) {
    console.error(`  Erreurs:            ${result.errors.length}`)
    for (const err of result.errors) console.error(`    - ${err}`)
  }
  console.log(`[session-scanner] FIN - ${new Date().toISOString()}`)
}

main().catch((err) => {
  console.error("[session-scanner] ERREUR:", err)
  process.exit(1)
})
