import type { CoachMessage, TradeEvent } from "./providers/types"
import { emitCoachMessage } from "./events"

function uid() {
  return Math.random().toString(36).slice(2, 9)
}

function getStreak(storage: Storage, key: string): number {
  const raw = storage.getItem(key)
  return raw ? parseInt(raw, 10) || 0 : 0
}

function setStreak(storage: Storage, key: string, val: number) {
  storage.setItem(key, String(val))
}

export function analyzeTrade(trade: TradeEvent, storage: Storage): CoachMessage | null {
  const messages: CoachMessage[] = []

  if (trade.result === "WIN") {
    const streak = getStreak(storage, "coach:win_streak") + 1
    setStreak(storage, "coach:win_streak", streak)
    setStreak(storage, "coach:loss_streak", 0)

    if (streak === 3) {
      messages.push({
        id: uid(),
        title: "🔥 Série de 3 wins",
        body: `Trois wins consécutives sur ${trade.pair} ! Continue comme ça, mais reste discipliné.`,
        severity: "achievement",
        category: "streak",
        rule: "win_streak_3",
        createdAt: new Date(),
      })
    }
    if (streak === 5) {
      messages.push({
        id: uid(),
        title: "💪 5 wins d'affilée",
        body: `Cinq trades gagnants consécutifs. Attention à l'excès de confiance — garde ton risk management.`,
        severity: "achievement",
        category: "streak",
        rule: "win_streak_5",
        createdAt: new Date(),
      })
    }
  }

  if (trade.result === "LOSS") {
    const streak = getStreak(storage, "coach:loss_streak") + 1
    setStreak(storage, "coach:loss_streak", streak)
    setStreak(storage, "coach:win_streak", 0)

    if (streak === 3) {
      messages.push({
        id: uid(),
        title: "⚠️ 3 pertes consécutives",
        body: "Tu viens d'enchaîner 3 pertes. Fais une pause, analyse ce qui ne va pas, et ne force pas un retour.",
        severity: "warning",
        category: "streak",
        rule: "loss_streak_3",
        createdAt: new Date(),
      })
    }
  }

  if (!trade.stopLoss && trade.result === "LOSS") {
    messages.push({
      id: uid(),
      title: "Stop Loss manquant",
      body: "Tu n'as pas défini de stop loss sur ce trade perdant. Un SL protège ton capital — même large, il vaut mieux que rien.",
      severity: "warning",
      category: "risk",
      rule: "missing_sl",
      createdAt: new Date(),
    })
  }

  if (trade.lotSize > 1) {
    messages.push({
      id: uid(),
      title: "Taille de lot élevée",
      body: `Lot de ${trade.lotSize} — c'est conséquent. Vérifie que ton risk management suit.`,
      severity: "tip",
      category: "risk",
      rule: "large_lot",
      createdAt: new Date(),
    })
  }

  if (trade.mood === "ANXIOUS" || trade.mood === "STRESSED") {
    messages.push({
      id: uid(),
      title: "État émotionnel",
      body: trade.result === "WIN"
        ? "Trade gagnant malgré le stress. Note ce qui a bien fonctionné pour reproduire."
        : "Tu étais anxieux en entrant ce trade. Entraîne-toi à attendre des setups plus calmes.",
      severity: "insight",
      category: "psychology",
      rule: "emotional_state",
      createdAt: new Date(),
    })
  }

  if (trade.confidence !== null && trade.confidence >= 8 && trade.result === "LOSS") {
    messages.push({
      id: uid(),
      title: "Haute confiance, perte",
      body: "Tu étais très confiant mais le trade est perdant. Révise tes critères d'entrée.",
      severity: "insight",
      category: "psychology",
      rule: "high_confidence_loss",
      createdAt: new Date(),
    })
  }

  if (messages.length === 0) return null

  const sorted = messages.sort((a, b) => {
    const order: Record<string, number> = { warning: 0, insight: 1, tip: 2, achievement: 3 }
    return (order[a.severity] ?? 9) - (order[b.severity] ?? 9)
  })

  const selected = sorted[0]
  emitCoachMessage(selected)
  return selected
}
