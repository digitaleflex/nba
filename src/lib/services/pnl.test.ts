import { describe, it, expect } from "vitest"
import { calculatePnl, calculateRR } from "./pnl"

describe("calculatePnl", () => {
  it("calcule le PnL brut d'un trade Forex BUY gagnant", () => {
    const pnl = calculatePnl({
      pair: "EURUSD",
      entryPrice: 1.08500,
      exitPrice: 1.08700,
      lotSize: 0.01,
      direction: "BUY",
      result: "WIN",
    })
    expect(pnl).toBe(2) // 20 pips x 0.01 lot = 2€
  })

  it("calcule le PnL brut d'un trade Forex SELL gagnant", () => {
    const pnl = calculatePnl({
      pair: "EURUSD",
      entryPrice: 1.08700,
      exitPrice: 1.08500,
      lotSize: 0.01,
      direction: "SELL",
      result: "WIN",
    })
    expect(pnl).toBe(2)
  })

  it("calcule le PnL brut d'un trade Forex BUY perdant", () => {
    const pnl = calculatePnl({
      pair: "EURUSD",
      entryPrice: 1.08700,
      exitPrice: 1.08500,
      lotSize: 0.01,
      direction: "BUY",
      result: "LOSS",
    })
    expect(pnl).toBe(-2)
  })

  it("retourne 0 pour un trade BREAKEVEN", () => {
    const pnl = calculatePnl({
      pair: "EURUSD",
      entryPrice: 1.08700,
      exitPrice: 1.08500,
      lotSize: 0.01,
      direction: "BUY",
      result: "BREAKEVEN",
    })
    expect(pnl).toBe(0)
  })

  it("déduit spread, commission et swap", () => {
    const pnl = calculatePnl({
      pair: "EURUSD",
      entryPrice: 1.08500,
      exitPrice: 1.08700,
      lotSize: 0.01,
      direction: "BUY",
      result: "WIN",
      spread: 0.2,
      commission: 1.5,
      swap: 0.1,
    })
    expect(pnl).toBe(0.2)
  })

  it("utilise un contractSize de 1 pour le crypto", () => {
    const pnl = calculatePnl({
      pair: "BTCUSD",
      entryPrice: 60000,
      exitPrice: 61000,
      lotSize: 0.5,
      direction: "BUY",
      result: "WIN",
    })
    expect(pnl).toBe(500)
  })

  it("accepte les paires en majuscules ou minuscules", () => {
    const upper = calculatePnl({ pair: "EURUSD", entryPrice: 1.08500, exitPrice: 1.08700, lotSize: 0.01, direction: "BUY", result: "WIN" })
    const lower = calculatePnl({ pair: "eurusd", entryPrice: 1.08500, exitPrice: 1.08700, lotSize: 0.01, direction: "BUY", result: "WIN" })
    expect(upper).toBe(lower)
  })
})

describe("calculateRR", () => {
  it("retourne null si SL ou TP manquant", () => {
    expect(calculateRR({ entryPrice: 1.08500, direction: "BUY" })).toBeNull()
    expect(calculateRR({ entryPrice: 1.08500, stopLoss: 1.08200, direction: "BUY" })).toBeNull()
    expect(calculateRR({ entryPrice: 1.08500, takeProfit: 1.09000, direction: "BUY" })).toBeNull()
  })

  it("calcule le R:R pour un BUY", () => {
    const rr = calculateRR({
      entryPrice: 1.08500,
      stopLoss: 1.08200,
      takeProfit: 1.09000,
      direction: "BUY",
    })
    expect(rr).toBe(1.7)
  })

  it("calcule le R:R pour un SELL", () => {
    const rr = calculateRR({
      entryPrice: 1.09000,
      stopLoss: 1.09300,
      takeProfit: 1.08500,
      direction: "SELL",
    })
    expect(rr).toBe(1.7)
  })

  it("retourne null si le risque est nul", () => {
    const rr = calculateRR({
      entryPrice: 1.08500,
      stopLoss: 1.08500,
      takeProfit: 1.09000,
      direction: "BUY",
    })
    expect(rr).toBeNull()
  })
})
