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
      if (!(prop in prismaMock)) prismaMock[prop] = { findUnique: vi.fn(), count: vi.fn() }
      return prismaMock[prop]
    },
  }),
}))

vi.mock("@nba/lib/rate-limit", () => ({
  rateLimitMiddleware: () => async () => null,
}))

vi.mock("@nba/lib/services/push", () => ({
  sendPushToUser: vi.fn(async () => ({ sent: 0, failed: 0, skipped: "NO_SUBSCRIPTION" })),
}))

import { POST } from "./route"
import { requireActiveUser } from "@nba/lib/auth-utils"
import { sendPushToUser } from "@nba/lib/services/push"

const USER_ID = "user-1"
beforeEach(() => {
  vi.clearAllMocks()
  ;(requireActiveUser as any).mockResolvedValue({ user: { id: USER_ID } })
  prismaMock.user = { findUnique: vi.fn().mockResolvedValue({ isActive: true }) }
  prismaMock.pushSubscription = { count: vi.fn().mockResolvedValue(0) }
  ;(sendPushToUser as any).mockResolvedValue({ sent: 0, failed: 0, skipped: "NO_SUBSCRIPTION" })
})

describe("POST /api/push/test", () => {
  it("sans abonnement → 200 avec sent 0 et reason", async () => {
    const res = await POST(new Request("http://localhost/api/push/test", { method: "POST" }) as any)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.sent).toBe(0)
    expect(body.reason).toBe("NO_SUBSCRIPTION")
    expect(body.devices).toBe(0)
  })

  it("avec abonnement → sent reflété", async () => {
    prismaMock.pushSubscription.count.mockResolvedValue(2)
    ;(sendPushToUser as any).mockResolvedValue({ sent: 2, failed: 0 })
    const res = await POST(new Request("http://localhost/api/push/test", { method: "POST" }) as any)
    const body = await res.json()
    expect(body.sent).toBe(2)
    expect(body.devices).toBe(2)
    expect(body.reason).toBeUndefined()
  })

  it("utilisateur inactif → reason INACTIVE", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ isActive: false })
    const res = await POST(new Request("http://localhost/api/push/test", { method: "POST" }) as any)
    const body = await res.json()
    expect(body.reason).toBe("INACTIVE")
  })

  it("401 si non authentifié", async () => {
    ;(requireActiveUser as any).mockRejectedValue(new Error("unauth"))
    const res = await POST(new Request("http://localhost/api/push/test", { method: "POST" }) as any)
    expect(res.status).toBe(401)
  })
})
