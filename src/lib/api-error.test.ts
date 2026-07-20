import { describe, it, expect, vi, beforeEach } from "vitest"
import { serverError } from "./api-error"

const mockHeadersGet = vi.fn()

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => ({
    get: mockHeadersGet,
  })),
}))

vi.mock("next/server", () => ({
  NextResponse: {
    json: vi.fn((body: Record<string, unknown>, init: { status: number }) => ({ body, status: init.status })),
  },
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe("serverError", () => {
  it("returns 500 with generic error message and errorId", async () => {
    const result = await serverError(new Error("db connection failed"), "/api/test")

    expect(result.status).toBe(500)
    expect(result.body.error).toContain("Une erreur inattendue est survenue")
    expect(result.body.errorId).toBeDefined()
    expect(typeof result.body.errorId).toBe("string")
    expect(result.body.errorId.length).toBeGreaterThanOrEqual(6)
  })

  it("includes correlationId when x-request-id header is present", async () => {
    mockHeadersGet.mockReturnValue("abc12345")

    const result = await serverError("oops", "/api/test")

    expect(result.body.correlationId).toBe("abc12345")
  })

  it("omits correlationId when x-request-id header is absent", async () => {
    mockHeadersGet.mockReturnValue(null)

    const result = await serverError("oops", "/api/test")

    expect(result.body.correlationId).toBeUndefined()
  })

  it("includes route in console error log", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    await serverError("test error", "/api/users")

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("/api/users"),
      "test error",
    )
    consoleSpy.mockRestore()
  })

  it("logs Error instances with message and stack", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    const error = new Error("something broke")

    await serverError(error, "/api/test")

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ message: "something broke", stack: expect.any(String) }),
    )
    consoleSpy.mockRestore()
  })
})
