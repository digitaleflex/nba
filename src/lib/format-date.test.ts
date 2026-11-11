import { describe, it, expect } from "vitest"
import { formatDayLabel, parseDay } from "./format-date"

describe("parseDay", () => {
  it("parse un jour YYYY-MM-DD à midi local (pas minuit UTC)", () => {
    const d = parseDay("2026-01-05")
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(0)
    expect(d.getDate()).toBe(5)
    expect(d.getHours()).toBe(12)
  })

  it("laisse passer un timestamp ISO complet", () => {
    const iso = "2026-01-05T08:30:00.000Z"
    expect(parseDay(iso).toISOString()).toBe(iso)
  })
})

describe("formatDayLabel", () => {
  it("formate en jour/mois français sans décalage", () => {
    expect(formatDayLabel("2026-01-05")).toBe("05/01")
  })

  it("retourne l'entrée brute si la date est invalide", () => {
    expect(formatDayLabel("nope")).toBe("nope")
  })
})
