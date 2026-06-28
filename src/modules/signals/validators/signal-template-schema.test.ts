import { describe, it, expect } from "vitest"
import { signalTemplateSchema } from "./signal-schema"

describe("signalTemplateSchema", () => {
  it("passes with valid fields", () => {
    const result = signalTemplateSchema.safeParse({
      name: "Forex BUY template",
      content: "📈 EUR/USD BUY NOW",
    })
    expect(result.success).toBe(true)
  })

  it("rejects empty name", () => {
    const result = signalTemplateSchema.safeParse({
      name: "",
      content: "📈 EUR/USD",
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Le nom du modèle est requis")
    }
  })

  it("rejects empty content", () => {
    const result = signalTemplateSchema.safeParse({
      name: "Swing template",
      content: "",
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Le contenu du modèle est requis")
    }
  })
})
