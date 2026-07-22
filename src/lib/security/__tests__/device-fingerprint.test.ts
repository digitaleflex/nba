import { describe, it, expect } from "vitest"
import { DeviceFingerprintService } from "../device-fingerprint"

const service = new DeviceFingerprintService()

describe("DeviceFingerprintService", () => {
  it("computes deterministic hash for identical signals", () => {
    const signals = {
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      language: "fr-FR",
      platform: "Win32",
      screenResolution: "1920x1080",
      colorDepth: 24,
      timezone: "Europe/Paris",
      timezoneOffset: -60,
      cpuCores: 8,
      touchSupport: false,
      pixelRatio: 1,
      hardwareConcurrency: 8,
      vendor: "Google Inc.",
    }
    const hash1 = service.computeHash(signals)
    const hash2 = service.computeHash(signals)
    expect(hash1).toBe(hash2)
  })

  it("produces different hashes for different signals", () => {
    const s1 = {
      userAgent: "Chrome/120",
      language: "fr-FR",
      platform: "Win32",
      screenResolution: "1920x1080",
      colorDepth: 24,
      timezone: "Europe/Paris",
      timezoneOffset: -60,
      cpuCores: 8,
      touchSupport: false,
      pixelRatio: 1,
      hardwareConcurrency: 8,
      vendor: "Google Inc.",
    }
    const s2 = { ...s1, userAgent: "Firefox/120" }
    expect(service.computeHash(s1)).not.toBe(service.computeHash(s2))
  })

  it("returns a 64-char hex hash", () => {
    const hash = service.computeHash({
      userAgent: "test",
      language: "en",
      platform: "Linux",
      screenResolution: "800x600",
      colorDepth: 16,
      timezone: "UTC",
      timezoneOffset: 0,
      cpuCores: 4,
      touchSupport: true,
      pixelRatio: 2,
      hardwareConcurrency: 4,
      vendor: "",
    })
    expect(hash).toMatch(/^[a-f0-9]{64}$/)
  })

  it("handles legacy fingerprint from request", () => {
    const req = new Request("https://example.com", {
      headers: { "user-agent": "TestAgent", "x-forwarded-for": "1.2.3.4" },
    })
    const legacy = service.computeLegacyFingerprint(req)
    expect(legacy).toBe("1.2.3.4|TestAgent")
  })
})
