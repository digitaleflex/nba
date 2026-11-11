import { describe, it, expect } from "vitest"
import { computeLot } from "./lot-calculator"

describe("computeLot", () => {
  it("EURUSD compte USD : lot cohérent", () => {
    const r = computeLot({
      balance: 1000, riskPct: 1, entry: 1.1, sl: 1.09,
      direction: "BUY", contractSize: 100000, contractKnown: true,
    })
    expect(r.riskAmount).toBe(10)
    expect(r.slDistance).toBeCloseTo(0.01)
    expect(r.lot).toBe(0.01)
    expect(r.issues).toEqual([])
    expect(r.valid).toBe(true)
  })

  it("GBPJPY compte EUR : applique le taux de conversion", () => {
    const without = computeLot({
      balance: 1000, riskPct: 1, entry: 180, sl: 179,
      direction: "BUY", contractSize: 100000, contractKnown: true, conversionRate: 1,
    })
    const withRate = computeLot({
      balance: 1000, riskPct: 1, entry: 180, sl: 179,
      direction: "BUY", contractSize: 100000, contractKnown: true, conversionRate: 0.006,
    })
    expect(withRate.lot).toBeGreaterThanOrEqual(without.lot)
    expect(withRate.lossIfSl).not.toBe(without.lossIfSl)
  })

  it("V75 : avertissement taille de contrat inconnue", () => {
    const r = computeLot({
      balance: 1000, riskPct: 1, entry: 60000, sl: 59900,
      direction: "BUY", contractSize: 1, contractKnown: false,
    })
    expect(r.issues.some((m) => m.includes("Taille de contrat inconnue"))).toBe(true)
  })

  it("solde négatif : invalide avec message", () => {
    const r = computeLot({
      balance: -100, riskPct: 1, entry: 1.1, sl: 1.09,
      direction: "BUY", contractSize: 100000, contractKnown: true,
    })
    expect(r.valid).toBe(false)
    expect(r.issues.some((m) => m.includes("Solde invalide"))).toBe(true)
    expect(r.lot).toBe(0)
  })

  it("SL = entrée : message explicite, pas de résultat", () => {
    const r = computeLot({
      balance: 1000, riskPct: 1, entry: 1.1, sl: 1.1,
      direction: "BUY", contractSize: 100000, contractKnown: true,
    })
    expect(r.valid).toBe(false)
    expect(r.issues.some((m) => m.includes("SL = entrée"))).toBe(true)
  })

  it("lot < 0.01 : clampé avec message", () => {
    const r = computeLot({
      balance: 10, riskPct: 0.1, entry: 1.1, sl: 1.09,
      direction: "BUY", contractSize: 100000, contractKnown: true,
    })
    expect(r.lot).toBe(0.01)
    expect(r.clamped).toBe(true)
    expect(r.issues.some((m) => m.includes("inférieur au minimum broker"))).toBe(true)
  })
})
