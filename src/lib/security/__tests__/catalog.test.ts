import { describe, it, expect } from "vitest"
import { CATALOG, getEventMeta, getEventsByCategory, getP0Events, getP1Events } from "../security-event-catalog"

describe("SecurityEventCatalog", () => {
  it("contains exactly 49 event types", () => {
    expect(Object.keys(CATALOG).length).toBe(49)
  })

  it("all events have valid metadata", () => {
    for (const meta of Object.values(CATALOG)) {
      expect(meta.type).toBeTruthy()
      expect(meta.category).toMatch(/^(authentication|session|device|two_factor|account|risk|admin|data|kyc|subscription)$/)
      expect(["INFO", "WARNING", "HIGH", "CRITICAL"]).toContain(meta.defaultSeverity)
      expect(meta.retentionDays).toBeGreaterThanOrEqual(30)
    }
  })

  it("getEventMeta returns specific event", () => {
    const meta = getEventMeta("LOGIN_SUCCESS")
    expect(meta.category).toBe("authentication")
    expect(meta.defaultSeverity).toBe("INFO")
  })

  it("getEventsByCategory filters correctly", () => {
    const auth = getEventsByCategory("authentication")
    expect(auth.length).toBeGreaterThanOrEqual(6)
    auth.forEach(e => expect(e.category).toBe("authentication"))
  })

  it("getP0Events returns immediate alerts", () => {
    const p0 = getP0Events()
    expect(p0.length).toBeGreaterThanOrEqual(1)
    p0.forEach(e => expect(e.alertP0).toBe(true))
  })

  it("getP1Events returns high alerts", () => {
    const p1 = getP1Events()
    expect(p1.length).toBeGreaterThanOrEqual(8)
    p1.forEach(e => expect(e.alertP1).toBe(true))
  })

  it("critical events have longer retention", () => {
    const critical = Object.values(CATALOG).filter(e => e.defaultSeverity === "CRITICAL")
    critical.forEach(e => expect(e.retentionDays).toBeGreaterThanOrEqual(365))
  })

  it("info events have retention ≥ 30d and ≤ 730d", () => {
    const info = Object.values(CATALOG).filter(e => e.defaultSeverity === "INFO")
    info.forEach(e => {
      expect(e.retentionDays).toBeGreaterThanOrEqual(30)
      expect(e.retentionDays).toBeLessThanOrEqual(730)
    })
  })
})
