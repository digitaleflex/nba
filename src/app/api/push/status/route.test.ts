import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@nba/lib/get-session", () => ({ getServerSession: vi.fn() }))
vi.mock("@nba/lib/auth-utils", () => ({
  requireActiveUser: vi.fn(),
  handleAuthError: vi.fn((e: any) => ({ status: 401, json: async () => ({ error: String(e) }) })),
}))

const { prismaMock } = vi.hoisted(() => ({ prismaMock: {} as any }))
vi.mock("@nba/lib/db", () => ({
  prisma: new Proxy({}, {
    get: (_t, prop) => {
      if (!(prop in prismaMock)) prismaMock[prop] = { findFirst: vi.fn(), findUnique: vi.fn(), count: vi.fn() }
      return prismaMock[prop]
    },
  }),
}))

vi.mock("@nba/lib/rate-limit", () => ({
  rateLimitMiddleware: () => async () => null,
}))

import { GET } from "./route"
import { requireActiveUser } from "@nba/lib/auth-utils"

const USER_ID = "user-1"
beforeEach(() => {
  vi.clearAllMocks()
  ;(requireActiveUser as any).mockResolvedValue({ user: { id: USER_ID } })
  prismaMock.pushSubscription = { findFirst: vi.fn(), findUnique: vi.fn(), count: vi.fn() }
})

describe("GET /api/push/status", () => {
  it("400 si endpoint manquant", async () => {
    const res = await GET(new Request("http://localhost/api/push/status") as any)
    expect(res.status).toBe(400)
  })

  it("registered true si l'endpoint appartient à l'utilisateur", async () => {
    prismaMock.pushSubscription.findFirst.mockResolvedValue({ id: "sub-1" })
    const res = await GET(new Request("http://localhost/api/push/status?endpoint=https%3A%2F%2Fexample.com%2Fpush") as any)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.registered).toBe(true)
  })

  it("registered false si l'endpoint n'existe pas", async () => {
    prismaMock.pushSubscription.findFirst.mockResolvedValue(null)
    const res = await GET(new Request("http://localhost/api/push/status?endpoint=https%3A%2F%2Fexample.com%2Fpush") as any)
    const body = await res.json()
    expect(body.registered).toBe(false)
  })

  it("401 si non authentifié", async () => {
    ;(requireActiveUser as any).mockRejectedValue(new Error("unauth"))
    const res = await GET(new Request("http://localhost/api/push/status?endpoint=x") as any)
    expect(res.status).toBe(401) // handleAuthError -> 401 in mock
  })
})
