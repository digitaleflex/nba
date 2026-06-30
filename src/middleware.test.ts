import { describe, it, expect, vi, beforeEach } from "vitest"
import { middleware } from "./middleware"
import { NextResponse } from "next/server"

vi.mock("next/server", () => {
  const redirect = vi.fn((url: string | URL) => ({
    status: 307,
    headers: new Map([["location", typeof url === "string" ? url : url.href]]),
    redirected: true,
  }))

  const next = vi.fn(() => ({
    status: 200,
    headers: new Map(),
    redirected: false,
  }))

  return { NextResponse: { redirect, next } }
})

function createMockRequest(
  pathname: string,
  cookie?: string,
): any {
  const url = `https://app.example.com${pathname}`
  return {
    nextUrl: new URL(url),
    headers: new Map(cookie ? [["cookie", cookie]] : []),
    url,
  }
}

describe("middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  describe("public routes (/login, /register, etc.)", () => {
    it("allows unauthenticated users to access /login", async () => {
      const req = createMockRequest("/login")
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(null),
      } as any)

      const response = await middleware(req)
      expect(response.status).toBe(200)
      expect(response.redirected).toBe(false)
    })

    it("redirects authenticated users away from /login to /dashboard", async () => {
      const req = createMockRequest("/login", "session=valid")
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ session: { user: { id: "u1", emailVerified: true } }, onboardingStatus: "ACTIVE" }),
      } as any)

      const response = await middleware(req)
      expect(response.status).toBe(307)
      expect(response.headers.get("location")).toBe("https://app.example.com/dashboard")
    })
  })

  describe("root path /", () => {
    it("redirects unauthenticated users to /login", async () => {
      const req = createMockRequest("/")
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(null),
      } as any)

      const response = await middleware(req)
      expect(response.status).toBe(307)
      expect(response.headers.get("location")).toBe("https://app.example.com/login")
    })

    it("redirects authenticated users to /dashboard", async () => {
      const req = createMockRequest("/")
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ session: { user: { id: "u1", emailVerified: true } }, onboardingStatus: "ACTIVE" }),
      } as any)

      const response = await middleware(req)
      expect(response.status).toBe(307)
      expect(response.headers.get("location")).toBe("https://app.example.com/dashboard")
    })
  })

  describe("protected routes (/dashboard, /admin, /onboarding)", () => {
    it("redirects unauthenticated users to /login with redirect param", async () => {
      const req = createMockRequest("/dashboard/signals")
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(null),
      } as any)

      const response = await middleware(req)
      expect(response.status).toBe(307)
      expect(response.headers.get("location")).toContain("/login")
      expect(response.headers.get("location")).toContain("redirect=%2Fdashboard%2Fsignals")
    })

    it("allows authenticated users with ACTIVE onboarding to access /dashboard", async () => {
      const req = createMockRequest("/dashboard", "session=valid")
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ session: { user: { id: "u1", emailVerified: true } }, onboardingStatus: "ACTIVE" }),
      } as any)

      const response = await middleware(req)
      expect(response.status).toBe(200)
      expect(response.redirected).toBe(false)
    })

    it("redirects non-ACTIVE users away from /dashboard to /onboarding", async () => {
      const req = createMockRequest("/dashboard", "session=valid")
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ session: { user: { id: "u1", emailVerified: true } }, onboardingStatus: "KYC_PENDING" }),
      } as any)

      const response = await middleware(req)
      expect(response.status).toBe(307)
      expect(response.headers.get("location")).toBe("https://app.example.com/onboarding")
    })

    it("redirects ACTIVE users from /onboarding to /dashboard", async () => {
      const req = createMockRequest("/onboarding", "session=valid")
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ session: { user: { id: "u1", emailVerified: true } }, onboardingStatus: "ACTIVE" }),
      } as any)

      const response = await middleware(req)
      expect(response.status).toBe(307)
      expect(response.headers.get("location")).toBe("https://app.example.com/dashboard")
    })

    it("allows non-ACTIVE users to access /onboarding", async () => {
      const req = createMockRequest("/onboarding", "session=valid")
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ session: { user: { id: "u1", emailVerified: true } }, onboardingStatus: "PENDING_EMAIL" }),
      } as any)

      const response = await middleware(req)
      expect(response.status).toBe(200)
      expect(response.redirected).toBe(false)
    })

    it("allows authenticated ADMIN users to access /admin", async () => {
      const req = createMockRequest("/admin", "session=valid")
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ session: { user: { id: "u1", emailVerified: true } }, onboardingStatus: "ACTIVE" }),
      } as any)

      const response = await middleware(req)
      expect(response.status).toBe(200)
      expect(response.redirected).toBe(false)
    })
  })

  describe("bypass routes (/api/auth, /api/public, /api/onboarding)", () => {
    it("passes through /api/auth/* without session check", async () => {
      const req = createMockRequest("/api/auth/login")
      const response = await middleware(req)
      expect(response.status).toBe(200)
      expect(response.redirected).toBe(false)
    })

    it("passes through /api/public/* without session check", async () => {
      const req = createMockRequest("/api/public/plans")
      const response = await middleware(req)
      expect(response.status).toBe(200)
      expect(response.redirected).toBe(false)
    })

    it("passes through /api/onboarding/* without session check", async () => {
      const req = createMockRequest("/api/onboarding/state")
      const response = await middleware(req)
      expect(response.status).toBe(200)
      expect(response.redirected).toBe(false)
    })
  })

  describe("edge cases", () => {
    it("handles fetch failure gracefully and redirects to login", async () => {
      const req = createMockRequest("/dashboard")
      vi.mocked(fetch).mockRejectedValue(new Error("Network error"))

      const response = await middleware(req)
      expect(response.status).toBe(307)
      expect(response.headers.get("location")).toContain("/login")
    })

    it("handles fetch failure on onboarding state check and redirects", async () => {
      const req = createMockRequest("/dashboard", "session=valid")
      vi.mocked(fetch).mockRejectedValue(new Error("Network error"))

      const response = await middleware(req)
      expect(response.status).toBe(307)
      expect(response.headers.get("location")).toBe("https://app.example.com/login?redirect=%2Fdashboard")
    })

    it("returns next for unknown paths", async () => {
      const req = createMockRequest("/some-unknown-path")
      const response = await middleware(req)
      expect(response.status).toBe(200)
      expect(response.redirected).toBe(false)
    })
  })
})
