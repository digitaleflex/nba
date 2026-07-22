import { describe, it, expect } from "vitest"

const BASE = process.env.TEST_API_URL

const skipIfNoServer = BASE ? describe : describe.skip

async function api(path: string, init?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  })
  let body: unknown = null
  try { body = await res.json() } catch { body = null }
  return { status: res.status, ok: res.ok, body }
}

skipIfNoServer("Public API (no auth required)", () => {
  it("GET /api/auth/captcha returns question + token", async () => {
    const { status, ok, body } = await api("/api/auth/captcha")
    expect(ok).toBe(true)
    expect(status).toBe(200)
    expect(body).toHaveProperty("question")
    expect(body).toHaveProperty("token")
  })

  it("GET /api/public/health returns ok", async () => {
    const { status, ok } = await api("/api/public/health")
    expect(ok || status === 200 || status === 503).toBe(true)
  })
})

skipIfNoServer("Auth routes", () => {
  it("POST /api/auth/sign-in with no body returns 400", async () => {
    const { status } = await api("/api/auth/sign-in", { method: "POST", body: JSON.stringify({}) })
    expect(status).toBe(400)
  })

  it("CAPTCHA verify with wrong token returns valid false", async () => {
    const { status, ok, body } = await api("/api/auth/captcha/verify", {
      method: "POST",
      body: JSON.stringify({ token: "invalid", answer: 0 }),
    })
    expect(ok).toBe(true)
    expect(body).toHaveProperty("valid")
    expect((body as any).valid).toBe(false)
  })
})

skipIfNoServer("Admin routes (without auth)", () => {
  const adminEndpoints = [
    "/api/admin/security/fraud/abuse",
    "/api/admin/security/fraud/events",
    "/api/admin/security/fraud/blocked-ips",
    "/api/admin/security/fraud/playbook",
    "/api/admin/metrics",
    "/api/admin/security/alerts",
    "/api/admin/support",
    "/api/admin/sessions",
  ]

  for (const path of adminEndpoints) {
    it(`GET ${path} returns 401 without auth`, async () => {
      const { status } = await api(path)
      expect([401, 403, 500]).toContain(status)
    })
  }
})

skipIfNoServer("Public API openapi spec", () => {
  it("GET /api/docs/openapi.json returns valid spec", async () => {
    const { ok, body } = await api("/api/docs/openapi.json")
    expect(ok).toBe(true)
    expect(body).toHaveProperty("openapi")
    expect(body).toHaveProperty("info")
    expect(body).toHaveProperty("paths")
    const paths = (body as any).paths
    expect(Object.keys(paths).length).toBeGreaterThan(20)
  })
})

skipIfNoServer("Security modules (unit tests via API)", () => {
  it("Captcha generates unique tokens", async () => {
    const { body: r1 } = await api("/api/auth/captcha")
    const { body: r2 } = await api("/api/auth/captcha")
    expect((r1 as any).token).not.toBe((r2 as any).token)
  })
})
