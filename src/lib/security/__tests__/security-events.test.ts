import { describe, it, expect } from "vitest"
import {
  getEventsByCategory,
  getP0Events,
  getP1Events,
  CATALOG,
} from "../security-event-catalog"

describe("SecurityEventCatalog", () => {
  it("all events have required metadata", () => {
    for (const meta of Object.values(CATALOG)) {
      expect(meta.type).toBeDefined()
      expect(meta.category).toBeDefined()
      expect(meta.defaultSeverity).toBeDefined()
      expect(meta.retentionDays).toBeGreaterThan(0)
    }
  })

  it("getEventsByCategory returns filtered events", () => {
    const authEvents = getEventsByCategory("authentication")
    expect(authEvents.length).toBeGreaterThan(0)
    for (const e of authEvents) {
      expect(e.category).toBe("authentication")
    }
  })

  it("getP0Events returns critical events", () => {
    const p0 = getP0Events()
    expect(p0.length).toBeGreaterThan(0)
    for (const e of p0) {
      expect(e.alertP0).toBe(true)
    }
  })

  it("getP1Events returns high-importance events", () => {
    const p1 = getP1Events()
    for (const e of p1) {
      expect(e.alertP1).toBe(true)
    }
  })
})

describe("SecurityEventRetention", () => {
  it("exports correctly", async () => {
    const mod = await import("../security-event-retention")
    expect(mod.securityEventRetention).toBeDefined()
  })
})

describe("SecurityEventRules", () => {
  it("exports correctly", async () => {
    const mod = await import("../security-event-rules")
    expect(mod.securityEventRules).toBeDefined()
  })
})

describe("AbuseDetector", () => {
  it("exports correctly", async () => {
    const mod = await import("../abuse-detector")
    expect(mod.abuseDetector).toBeDefined()
    expect(mod.AbuseDetector).toBeDefined()
  })
})
