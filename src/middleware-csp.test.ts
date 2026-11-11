import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { buildCsp } from "./middleware"

describe("buildCsp", () => {
  const originalNodeEnv = process.env.NODE_ENV

  afterEach(() => {
    (process.env as any).NODE_ENV = originalNodeEnv
  })

  it("inclut le nonce dans script-src", () => {
    const csp = buildCsp("abc123")
    expect(csp).toContain("script-src 'self' 'nonce-abc123'")
  })

  it("n'inclut pas strict-dynamic", () => {
    const csp = buildCsp("abc123")
    expect(csp).not.toContain("strict-dynamic")
  })

  it("style-src utilise unsafe-inline sans nonce", () => {
    const csp = buildCsp("abc123")
    const style = csp.split(";").map((s) => s.trim()).find((s) => s.startsWith("style-src"))
    expect(style).toBe("style-src 'self' 'unsafe-inline'")
  })

  it("n'inclut pas le nonce dans style-src", () => {
    const csp = buildCsp("abc123")
    const style = csp.split(";").map((s) => s.trim()).find((s) => s.startsWith("style-src"))!
    expect(style).not.toContain("nonce-abc123")
  })

  it("ajoute unsafe-eval en développement", () => {
    (process.env as any).NODE_ENV = "development"
    const csp = buildCsp("abc123")
    expect(csp).toContain("'unsafe-eval'")
  })

  it("n'ajoute pas unsafe-eval en production", () => {
    (process.env as any).NODE_ENV = "production"
    const csp = buildCsp("abc123")
    expect(csp).not.toContain("unsafe-eval")
  })
})
