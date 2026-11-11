import { describe, it, expect } from "vitest"
import { analyzeTrade } from "./patterns"

function storage(): Storage {
  const map = new Map<string, string>()
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => { map.set(k, v) },
    removeItem: (k) => { map.delete(k) },
    clear: () => map.clear(),
    key: (i) => [...map.keys()][i] ?? null,
    get length() { return map.size },
  } as Storage
}

const baseTrade = {
  pair: "EURUSD",
  direction: "BUY" as const,
  result: "LOSS" as const,
  pnl: -10,
  lotSize: 0.1,
  spread: 1,
  stopLoss: 1.08,
  takeProfit: 1.10,
  mood: null,
  confidence: 5,
  tags: [],
  tradedAt: "2026-01-05T12:00:00",
}

describe("analyzeTrade", () => {
  it("déclenche 'Haute confiance, perte' à 5/5 étoiles (seuil aligné sur l'échelle 1-5)", () => {
    const msg = analyzeTrade({ ...baseTrade, confidence: 4 }, storage())
    expect(msg?.rule).toBe("high_confidence_loss")
  })

  it("ne déclenche pas la règle sous le seuil", () => {
    const msg = analyzeTrade({ ...baseTrade, confidence: 3 }, storage())
    // pas de high_confidence_loss (peut être null ou une autre règle)
    expect(msg?.rule).not.toBe("high_confidence_loss")
  })

  it("déclenche le message stress pour l'humeur STRESSED", () => {
    const msg = analyzeTrade({ ...baseTrade, mood: "STRESSED", confidence: 2 }, storage())
    expect(msg?.rule).toBe("emotional_state")
  })
})
