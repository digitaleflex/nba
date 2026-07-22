import { describe, it, expect } from "vitest"
import { SyncRiskEngine } from "../risk-engine"

const engine = new SyncRiskEngine()

describe("SyncRiskEngine", () => {
  it("returns scores and factors", async () => {
    const result = await engine.evaluate({
      ipAddress: "192.168.1.1",
      userAgent: "Mozilla/5.0",
      has2fa: true,
    })
    expect(result.totalScore).toBeGreaterThanOrEqual(0)
    expect(result).toHaveProperty("level")
    expect(result).toHaveProperty("factors")
    expect(result).toHaveProperty("requiresChallenge")
    expect(result).toHaveProperty("shouldBlock")
    expect(Array.isArray(result.factors)).toBe(true)
  })

  it("includes device_unknown factor without deviceId", async () => {
    const result = await engine.evaluate({
      ipAddress: "10.0.0.1",
      userAgent: "curl/7.0",
      has2fa: false,
    })
    const deviceFactor = result.factors.find(f => f.name === "device_unknown")
    expect(deviceFactor).toBeDefined()
    expect(deviceFactor!.weight).toBe(30)
  })

  it("includes no_2fa factor when 2FA disabled", async () => {
    const result = await engine.evaluate({
      ipAddress: "203.0.113.1",
      userAgent: "Mozilla/5.0",
      has2fa: false,
    })
    const factor = result.factors.find(f => f.name === "no_two_factor")
    expect(factor).toBeDefined()
  })

  it("calculates weighted score correctly", () => {
    const factors = [
      { name: "test_1", weight: 50, score: 100, reason: "high risk" },
      { name: "test_2", weight: 50, score: 0, reason: "no risk" },
    ]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = (engine as any)["calculate"](factors)
    expect(result.totalScore).toBe(50)
    expect(result.level).toBe("MEDIUM")
  })
})

describe("AbuseDetector", () => {
  it("exports correctly", async () => {
    const { abuseDetector } = await import("../abuse-detector")
    expect(abuseDetector).toBeDefined()
  })
})
