// Register Telegram bot webhook — run once: `npx tsx scripts/register-telegram-webhook.ts`
import "dotenv/config"

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const WEBHOOK_URL = `${process.env.NEXT_PUBLIC_APP_URL}/api/telegram/webhook`

async function main() {
  if (!BOT_TOKEN) { console.error("TELEGRAM_BOT_TOKEN missing"); process.exit(1) }
  console.log("Registering webhook:", WEBHOOK_URL)

  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: WEBHOOK_URL, allowed_updates: ["message"] }),
  })
  const data = await res.json()
  console.log("Result:", JSON.stringify(data, null, 2))

  const info = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`)
  console.log("Info:", JSON.stringify(await info.json(), null, 2))
}

main()