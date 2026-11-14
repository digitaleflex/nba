import { describe, it, expect } from "vitest"
import { detectPlatform, phoneGuide } from "./push-phone-guide"

describe("push-phone-guide", () => {
  it("détecte la plateforme", () => {
    expect(detectPlatform("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)")).toBe("ios")
    expect(detectPlatform("Mozilla/5.0 (Linux; Android 14; Pixel 8)")).toBe("android")
    expect(detectPlatform("Mozilla/5.0 (Windows NT 10.0) Chrome/130")).toBe("desktop")
  })
  it("iPhone : mode Concentration et commutateur de sonnerie", () => {
    const text = phoneGuide("iPhone").steps.join(" ")
    expect(text).toContain("Concentration")
    expect(text).toContain("silencieux")
  })
  it("Android : batterie sans restriction et son de la catégorie", () => {
    const text = phoneGuide("Android").steps.join(" ")
    expect(text).toContain("Sans restriction")
    expect(text).toContain("son")
  })
  it("n'invente aucun nom de canal « Signaux »", () => {
    for (const ua of ["iPhone", "Android", "Windows"]) {
      expect(phoneGuide(ua).steps.join(" ")).not.toMatch(/canal « ?Signaux/i)
    }
  })
})
