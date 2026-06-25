#!/usr/bin/env tsx
/**
 * Health check script.
 * Usage: npx tsx scripts/healthcheck.ts
 */
const url = process.env.HEALTH_CHECK_URL || "http://localhost:3000/api/public/health"

async function main() {
  const response = await fetch(url)
  const data = await response.json()

  if (response.ok && data.status === "healthy") {
    console.log("✅ Application is healthy")
    process.exit(0)
  } else {
    console.error("❌ Application is unhealthy:", data)
    process.exit(1)
  }
}

main().catch((e) => {
  console.error("❌ Health check failed:", e.message)
  process.exit(1)
})
