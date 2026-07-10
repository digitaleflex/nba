import { describe, it, expect } from "vitest"
import { profileSchema, selectPlanSchema, reviewAccessSchema, reviewDocumentSchema, validateOrThrow, ValidationError } from "./index"

describe("profileSchema", () => {
  it("accepts valid profile", () => {
    const result = profileSchema.safeParse({ country: "France", language: "fr" })
    expect(result.success).toBe(true)
  })

  it("rejects missing country", () => {
    const result = profileSchema.safeParse({ language: "fr" })
    expect(result.success).toBe(false)
  })

  it("rejects empty country", () => {
    const result = profileSchema.safeParse({ country: "", language: "fr" })
    expect(result.success).toBe(false)
  })
})

describe("selectPlanSchema", () => {
  it("accepts valid UUID", () => {
    const result = selectPlanSchema.safeParse({ planId: "550e8400-e29b-41d4-a716-446655440000" })
    expect(result.success).toBe(true)
  })

  it("rejects non-UUID", () => {
    const result = selectPlanSchema.safeParse({ planId: "not-a-uuid" })
    expect(result.success).toBe(false)
  })
})

describe("reviewAccessSchema", () => {
  it("accepts valid status", () => {
    const result = reviewAccessSchema.safeParse({ status: "APPROVED" })
    expect(result.success).toBe(true)
  })

  it("accepts optional notes", () => {
    const result = reviewAccessSchema.safeParse({ status: "REJECTED", notes: "Document manquant" })
    expect(result.success).toBe(true)
  })

  it("rejects invalid status", () => {
    const result = reviewAccessSchema.safeParse({ status: "INVALID" })
    expect(result.success).toBe(false)
  })
})

describe("reviewDocumentSchema", () => {
  it("accepts APPROVED", () => {
    const result = reviewDocumentSchema.safeParse({ status: "APPROVED" })
    expect(result.success).toBe(true)
  })

  it("rejects SUSPENDED (not in verification)", () => {
    const result = reviewDocumentSchema.safeParse({ status: "SUSPENDED" })
    expect(result.success).toBe(false)
  })
})

describe("validateOrThrow", () => {
  it("returns parsed data on success", () => {
    const data = validateOrThrow(profileSchema, { country: "France", language: "fr" })
    expect(data.country).toBe("France")
  })

  it("throws ValidationError on failure", () => {
    expect(() => validateOrThrow(profileSchema, { country: "" })).toThrow(ValidationError)
  })
})
