import { config } from "dotenv"
import { resolve } from "path"

const ENVS = [
  { name: "staging", file: ".env.staging" },
  { name: "production", file: ".env.production" },
]

async function ping(url: string, label: string) {
  const start = Date.now()
  try {
    const { default: pg } = await import("pg")
    const { Pool } = pg
    const pool = new Pool({ connectionString: url, connectionTimeoutMillis: 10000 })
    const result = await pool.query("SELECT 1 AS ok")
    await pool.end()
    const ms = Date.now() - start
    console.log(`[${new Date().toISOString()}] ${label} ✅ ${ms}ms`)
  } catch (err) {
    console.error(`[${new Date().toISOString()}] ${label} ❌ ${(err as Error).message}`)
  }
}

async function keepAlive() {
  console.log(`\n═══ Keep-Alive ═══`)

  await Promise.all(
    ENVS.map((env) => {
      config({ path: resolve(__dirname, "..", env.file) })
      return ping(process.env.DATABASE_URL!, env.name)
    })
  )
}

// Run immediately then every 4 minutes
keepAlive()
setInterval(keepAlive, 4 * 60 * 1000)
