import { createCircuitBreaker, withTimeout } from "../circuit-breaker"

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_ENABLED = process.env.TELEGRAM_ENABLED !== "false"
const API_BASE = "https://api.telegram.org/bot"
const TELEGRAM_TIMEOUT_MS = 10_000

const telegramBreaker = createCircuitBreaker("telegram", { threshold: 5, cooldownMs: 60_000 })

async function apiCall(method: string, body: Record<string, unknown>) {
  if (!TELEGRAM_ENABLED) return { ok: false, error: "Telegram notifications are disabled" }
  if (!BOT_TOKEN) return { ok: false, error: "TELEGRAM_BOT_TOKEN not configured" }
  return telegramBreaker.execute(() =>
    withTimeout(async (signal) => {
      const res = await fetch(`${API_BASE}${BOT_TOKEN}/${method}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal,
      })
      return res.json() as Promise<{ ok: boolean; result?: unknown; error_code?: number; description?: string }>
    }, TELEGRAM_TIMEOUT_MS),
  )
}

export async function sendTelegramMessage(
  chatId: string,
  text: string,
  options?: { parseMode?: "HTML" | "MarkdownV2"; disableNotification?: boolean }
): Promise<{ ok: boolean; messageId?: number; error?: string }> {
  if (!TELEGRAM_ENABLED) return { ok: false, error: "Telegram notifications are disabled" }
  if (!BOT_TOKEN) return { ok: false, error: "Bot token not configured" }
  if (!chatId) return { ok: false, error: "No chat_id" }

  const result = await apiCall("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: options?.parseMode || "HTML",
    disable_notification: options?.disableNotification || false,
    disable_web_page_preview: true,
  })

  if (!result.ok) {
    console.warn(`[telegram] send failed to ${chatId}: ${(result as any).description || "unknown"}`)
    return { ok: false, error: (result as any).description }
  }

  const data = result as any
  return { ok: true, messageId: data.result?.message_id }
}


export async function deleteTelegramChat(chatId: string): Promise<void> {
  if (!BOT_TOKEN || !chatId) return
  await fetch(`${API_BASE}${BOT_TOKEN}/deleteChat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId }),
  }).catch(() => {})
}