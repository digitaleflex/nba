const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL
const WHATSAPP_API_KEY = process.env.WHATSAPP_API_KEY
const WHATSAPP_ENABLED = process.env.WHATSAPP_ENABLED !== "false"

interface WhatsAppSendResult {
  ok: boolean
  error?: string
}

export async function sendWhatsAppMessage(
  phoneNumber: string,
  text: string,
): Promise<WhatsAppSendResult> {
  if (!WHATSAPP_ENABLED) {
    return { ok: false, error: "WhatsApp notifications are disabled" }
  }
  if (!WHATSAPP_API_URL || !WHATSAPP_API_KEY) {
    return { ok: false, error: "WHATSAPP_API_URL or WHATSAPP_API_KEY not configured" }
  }
  if (!phoneNumber) return { ok: false, error: "No phone number" }

  // Nettoyer le numéro (enlever espaces, +, etc.)
  const clean = phoneNumber.replace(/[\s+()-]/g, "")

  try {
    const res = await fetch(WHATSAPP_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${WHATSAPP_API_KEY}`,
      },
      body: JSON.stringify({
        to: clean,
        message: text,
      }),
    })

    if (!res.ok) {
      console.warn(`[whatsapp] send failed to ${clean}: HTTP ${res.status}`)
      return { ok: false, error: `HTTP ${res.status}` }
    }

    return { ok: true }
  } catch (err: any) {
    console.warn(`[whatsapp] send failed to ${clean}:`, err.message)
    return { ok: false, error: err.message }
  }
}

export async function sendWhatsAppSignal(
  phoneNumber: string,
  title: string,
  body: string,
): Promise<WhatsAppSendResult> {
  return sendWhatsAppMessage(
    phoneNumber,
    `🔔 *${title}*\n\n${body}\n\n📱 _NeverBrokeAgain_`,
  )
}