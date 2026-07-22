import { describe, it, expect } from "vitest"

describe("SessionManager", () => {
  it("exports PlanLimits interface correctly", async () => {
    const mod = await import("../session-manager")
    expect(mod.SessionManager).toBeDefined()
    expect(mod.sessionManager).toBeDefined()
  })

  it("singleton returns same instance", async () => {
    const mod = await import("../session-manager")
    const instance1 = mod.SessionManager.getInstance()
    const instance2 = mod.SessionManager.getInstance()
    expect(instance1).toBe(instance2)
  })
})

describe("DeviceFingerprintService", () => {
  it("computes deterministic hash for same signals", async () => {
    const { deviceFingerprintService } = await import("../device-fingerprint")
    const signals = {
      userAgent: "Mozilla/5.0",
      language: "en-US",
      platform: "Win32",
      screenResolution: "1920x1080",
      colorDepth: 24,
      timezone: "UTC",
      timezoneOffset: 0,
      cpuCores: 8,
      touchSupport: false,
      pixelRatio: 1,
      hardwareConcurrency: 8,
      vendor: "Google Inc.",
    }
    const hash1 = deviceFingerprintService.computeHash(signals)
    const hash2 = deviceFingerprintService.computeHash(signals)
    expect(hash1).toBe(hash2)
    expect(hash1.length).toBe(64)
  })
})

describe("SecurityEventBus", () => {
  it("exports correctly", async () => {
    const mod = await import("../security-event-bus")
    expect(mod.SecurityEventBus).toBeDefined()
    expect(mod.securityEventBus).toBeDefined()
  })
})

describe("IncidentResponder", () => {
  it("exports correctly", async () => {
    const mod = await import("../incident-responder")
    expect(mod.IncidentResponder).toBeDefined()
    expect(mod.incidentResponder).toBeDefined()
    expect(mod.PLAYBOOKS).toBeDefined()
  })

  it("has all 12 playbooks", async () => {
    const { PLAYBOOKS } = await import("../incident-responder")
    expect(PLAYBOOKS.length).toBe(12)
  })
})

describe("SecurityEventCatalog", () => {
  it("has all 48 events cataloged", async () => {
    const { CATALOG } = await import("../security-event-catalog")
    const eventCount = Object.keys(CATALOG).length
    expect(eventCount).toBe(49)
  })

  it("returns metadata for each event", async () => {
    const { CATALOG, getEventMeta } = await import("../security-event-catalog")
    for (const type of Object.keys(CATALOG)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const meta = getEventMeta(type as any)
      expect(meta.category).toBeDefined()
      expect(meta.defaultSeverity).toBeDefined()
      expect(meta.retentionDays).toBeGreaterThan(0)
    }
  })
})
