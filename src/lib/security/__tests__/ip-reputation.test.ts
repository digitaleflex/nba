import { describe, it, expect } from "vitest"

describe("IPReputationService", () => {
  it("classifies localhost as safe", async () => {
    const { ipReputationService } = await import("../ip-reputation")
    const result = await ipReputationService.lookup("127.0.0.1")
    expect(result.confidence).toBe(100)
    expect(result.isVPN).toBe(false)
    expect(result.isTor).toBe(false)
    expect(result.isDatacenter).toBe(false)
  })
})

describe("ImpossibleTravelDetector", () => {
  it("exports correctly", async () => {
    const mod = await import("../impossible-travel")
    expect(mod.ImpossibleTravelDetector).toBeDefined()
    expect(mod.impossibleTravelDetector).toBeDefined()
  })
})
