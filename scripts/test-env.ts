import { config } from "dotenv"
import { resolve } from "path"
import { Resend } from "resend"

const ENV_MAP: Record<string, string> = {
  dev: ".env",
  staging: ".env.staging",
  production: ".env.production",
}

async function testDatabase(url: string) {
  console.log(`\n📦 Testing database connection...`)
  try {
    const { default: pg } = await import("pg")
    const { Pool } = pg
    const pool = new Pool({ connectionString: url, connectionTimeoutMillis: 5000 })
    const result = await pool.query("SELECT 1 AS ok")
    await pool.end()
    console.log(`   ✅ Connected — ${result.rows[0].ok === 1 ? "OK" : "UNEXPECTED"}`)
  } catch (err) {
    console.error(`   ❌ Failed: ${(err as Error).message}`)
  }
}

async function testEmail(resend: Resend, to: string, label: string) {
  try {
    const { error } = await resend.emails.send({
      from: "test@signauxx.com",
      to,
      subject: `[Test] ${label}`,
      html: `<p>Test email envoyé depuis <strong>${label}</strong> — ${new Date().toISOString()}</p>`,
    })
    if (error) {
      console.error(`   ❌ ${label} <${to}>: ${error.message}`)
    } else {
      console.log(`   ✅ ${label} <${to}>`)
    }
  } catch (err) {
    console.error(`   ❌ ${label} <${to}>: ${(err as Error).message}`)
  }
}

async function main() {
  const env = process.argv[2]?.toLowerCase()
  if (!env || !ENV_MAP[env]) {
    console.error(`Usage: tsx scripts/test-env.ts [dev | staging | production]`)
    process.exit(1)
  }

  const envFile = resolve(__dirname, "..", ENV_MAP[env])
  config({ path: envFile })

  console.log(`🔧 Environment: ${env} (${ENV_MAP[env]})`)
  console.log(`   APP_URL: ${process.env.NEXT_PUBLIC_APP_URL}`)

  // Database
  if (process.env.DATABASE_URL) {
    await testDatabase(process.env.DATABASE_URL)
  } else {
    console.log(`\n📦 Skipping database — no DATABASE_URL`)
  }

  // Emails
  const resendApiKey = process.env.RESEND_API_KEY
  if (!resendApiKey || resendApiKey === "re_xxxxxxxxxxxx") {
    console.log(`\n📧 Skipping emails — no valid RESEND_API_KEY`)
    console.log(`\n✅ Done`)
    return
  }

  const resend = new Resend(resendApiKey)
  const emails: { key: string; label: string }[] = [
    { key: "RESEND_FROM_EMAIL", label: "From" },
    { key: "SUPPORT_EMAIL", label: "Support" },
    { key: "ADMIN_EMAIL", label: "Admin" },
    { key: "CONTACT_EMAIL", label: "Contact" },
    { key: "TEAM_EMAIL", label: "Team" },
  ]

  console.log(`\n📧 Testing emails via Resend...`)
  for (const { key, label } of emails) {
    const to = process.env[key]
    if (to) {
      await testEmail(resend, to, label)
    }
  }

  console.log(`\n✅ Done`)
}

main()
