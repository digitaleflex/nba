import { describe, it, expect } from "vitest"
import { isInQuietHours, shouldMuteNow } from "./quiet-hours"

const night = { start: "22:00", end: "07:00" }
// 21:30 UTC le 15 janvier = 22:30 à Paris (UTC+1), 21:30 à Dakar (UTC), 16:30 à New York (UTC-5)
const at = new Date("2026-01-15T21:30:00Z")

describe("isInQuietHours (#368)", () => {
  it("lit l'heure dans le fuseau de l'utilisateur, pas celle du serveur", () => {
    expect(isInQuietHours(night, "Europe/Paris", at)).toBe(true)
    expect(isInQuietHours(night, "Africa/Dakar", at)).toBe(false)
    expect(isInQuietHours(night, "America/New_York", at)).toBe(false)
  })
  it("gère les plages qui franchissent minuit", () => {
    expect(isInQuietHours(night, "Europe/Paris", new Date("2026-01-15T02:00:00Z"))).toBe(true)
    expect(isInQuietHours(night, "Europe/Paris", new Date("2026-01-15T12:00:00Z"))).toBe(false)
  })
  it("gère le changement d'heure (été : Paris = UTC+2)", () => {
    expect(isInQuietHours(night, "Europe/Paris", new Date("2026-07-15T20:30:00Z"))).toBe(true) // 22:30
    expect(isInQuietHours(night, "Europe/Paris", new Date("2026-07-15T19:30:00Z"))).toBe(false) // 21:30
  })
  it("ignore une plage vide ou invalide", () => {
    expect(isInQuietHours(null)).toBe(false)
    expect(isInQuietHours({ start: "08:00", end: "08:00" }, "Europe/Paris", at)).toBe(false)
  })
})

describe("shouldMuteNow", () => {
  it("un signal sonne toujours par défaut", () => {
    expect(shouldMuteNow({ quietHours: night }, true, "Europe/Paris", at)).toBe(false)
  })
  it("un signal respecte le silence si le membre l'a demandé", () => {
    expect(shouldMuteNow({ quietHours: night, signalsRespectQuietHours: true }, true, "Europe/Paris", at)).toBe(true)
  })
  it("les autres types respectent toujours le silence", () => {
    expect(shouldMuteNow({ quietHours: night }, false, "Europe/Paris", at)).toBe(true)
  })
})
