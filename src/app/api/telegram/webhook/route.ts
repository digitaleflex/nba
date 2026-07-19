import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { sendTelegramMessage } from "@nba/lib/services/telegram"

export async function POST(req: NextRequest) {
  try {
    const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET
    if (expectedSecret) {
      const provided = req.headers.get("x-telegram-bot-api-secret-token")
      if (provided !== expectedSecret) {
        return NextResponse.json({ ok: false }, { status: 401 })
      }
    }

    const body = await req.json()
    const { message } = body

    if (!message?.text || !message?.chat?.id) {
      return NextResponse.json({ ok: true })
    }

    const chatId = String(message.chat.id)
    const text = message.text.trim()

    const users = await prisma.user.findMany({
      where: { deletedAt: null },
      select: { id: true, metadata: true },
    })

    const linkedUser = users.find((u) => {
      const meta = (u.metadata || {}) as Record<string, any>
      return meta.telegram_chat_id === chatId
    })

    if (text === "/start") {
      const code = text.slice(7).trim()
      if (code && code.length >= 4) {
        const matching = users.find((u) => {
          const meta = (u.metadata || {}) as Record<string, any>
          return meta.telegram_link_code === code
        })
        if (matching) {
          const existingMeta = (matching.metadata || {}) as Record<string, any>
          await prisma.user.update({
            where: { id: matching.id },
            data: { metadata: { ...existingMeta, telegram_chat_id: chatId, telegram_active: true, telegram_link_code: null } },
          })
          await sendTelegramMessage(chatId, "✅ Compte lié avec succès !\n\nVous recevrez désormais les signaux de trading en temps réel sur Telegram.\n\n/stop — Désactiver\n/status — Voir l'état")
          return NextResponse.json({ ok: true })
        }
        await sendTelegramMessage(chatId, "❌ Code invalide. Vérifiez le code dans l'application NeverBrokeAgain.")
        return NextResponse.json({ ok: true })
      }
      if (linkedUser) {
        await sendTelegramMessage(chatId, "✅ Vous recevez déjà les signaux.\n\n/stop — Désactiver\n/status — Voir l'état")
        return NextResponse.json({ ok: true })
      }
      await sendTelegramMessage(chatId, "👋 <b>NeverBrokeAgain</b>\n\nConnectez votre compte :\n📱 <b>Paramètres → Notifications → Telegram</b>")
      return NextResponse.json({ ok: true })
    }

    if (text === "/stop") {
      if (!linkedUser) {
        await sendTelegramMessage(chatId, "Aucun abonnement actif. Envoyez /start pour commencer.")
        return NextResponse.json({ ok: true })
      }
      const meta = (linkedUser.metadata || {}) as Record<string, any>
      await prisma.user.update({
        where: { id: linkedUser.id },
        data: { metadata: { ...meta, telegram_active: false } },
      })
      await sendTelegramMessage(chatId, "🔕 Notifications désactivées. /start pour réactiver.")
      return NextResponse.json({ ok: true })
    }

    if (text === "/status") {
      if (!linkedUser) {
        await sendTelegramMessage(chatId, "Aucun compte lié. Utilisez /start.")
        return NextResponse.json({ ok: true })
      }
      const meta = (linkedUser.metadata || {}) as Record<string, any>
      await sendTelegramMessage(
        chatId,
        `<b>État :</b> ${meta.telegram_active !== false ? "✅ Actif" : "🔕 Désactivé"}\n\n/stop — Désactiver\n/status — Voir l'état`,
      )
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[telegram-webhook]", err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}

function generateCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}