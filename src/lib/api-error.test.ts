import { describe, it, expect, vi, beforeEach } from "vitest"
import { serverError } from "./api-error"

const mockHeadersGet = vi.fn()

const { logErrorSpy } = vi.hoisted(() => ({
  logErrorSpy: vi.fn(),
}))

vi.mock("@nba/lib/logger", () => ({
  logger: {
    child: vi.fn(() => ({
      error: logErrorSpy,
      warn: vi.fn(),
      info: vi.fn(),
      debug: vi.fn(),
    })),
  },
}))

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
    const result = await serverError(new Error("db connection failed"), "/api/test") as unknown as { status: number; body: Record<string, unknown> }

    expect(result.status).toBe(500)
    expect(result.body.message).toContain("Une erreur inattendue est survenue")
    expect(result.body.code).toBe("SYS_001")
    expect(result.body.errorId).toBeDefined()
    expect(typeof result.body.errorId).toBe("string")
    expect((result.body.errorId as string).length).toBeGreaterThanOrEqual(6)
  })

  it("includes correlationId when x-request-id header is present", async () => {
    mockHeadersGet.mockReturnValue("abc12345")

    const result = await serverError("oops", "/api/test") as unknown as { status: number; body: Record<string, unknown> }

    expect(result.body.correlationId).toBe("abc12345")
  })

  it("omits correlationId when x-request-id header is absent", async () => {
    mockHeadersGet.mockReturnValue(null)

    const result = await serverError("oops", "/api/test") as unknown as { status: number; body: Record<string, unknown> }

    expect(result.body.correlationId).toBeUndefined()
  })

  it("includes route in error log", async () => {
    await serverError("test error", "/api/users")

    expect(logErrorSpy).toHaveBeenCalledWith(
      expect.objectContaining({ route: "/api/users" }),
      "Unhandled error",
    )
  })

  it("logs Error instances with message and stack", async () => {
    const error = new Error("something broke")

    await serverError(error, "/api/test")

    expect(logErrorSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        route: "/api/test",
        err: expect.objectContaining({ message: "something broke", stack: expect.any(String) }),
      }),
      "Unhandled error",
    )
  })
})
