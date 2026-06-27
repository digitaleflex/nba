import { describe, it, expect } from "vitest"
import { signalCreateSchema } from "./signal-schema"

describe("signalCreateSchema", () => {
  const validUUID = "550e8400-e29b-41d4-a716-446655440000"

  it("passes with valid minimum fields", () => {
    const result = signalCreateSchema.safeParse({
      content: "📈 EUR/USD BUY NOW",
      planIds: [validUUID],
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.status).toBe("DRAFT") // default value
    }
  })

  it("passes with all optional and required fields", () => {
    const result = signalCreateSchema.safeParse({
      content: "📈 EUR/USD BUY NOW",
      imageUrl: "signals/graph.png",
      planIds: [validUUID],
      status: "PUBLISHED",
    })
    expect(result.success).toBe(true)
  })

  it("rejects empty content", () => {
    const result = signalCreateSchema.safeParse({
      content: "",
      planIds: [validUUID],
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Le contenu du signal est requis")
    }
  })

  it("rejects empty planIds array", () => {
    const result = signalCreateSchema.safeParse({
      content: "📈 EUR/USD",
      planIds: [],
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Veuillez sélectionner au moins un groupe de diffusion")
    }
  })

  it("rejects invalid plan UUIDs", () => {
    const result = signalCreateSchema.safeParse({
      content: "📈 EUR/USD",
      planIds: ["not-a-uuid"],
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("ID de groupe invalide")
    }
  })

  it("rejects invalid status enum value", () => {
    const result = signalCreateSchema.safeParse({
      content: "📈 EUR/USD",
      planIds: [validUUID],
      status: "INVALID_STATUS",
    })
    expect(result.success).toBe(false)
  })
})
