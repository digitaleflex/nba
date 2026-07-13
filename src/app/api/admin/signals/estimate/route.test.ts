import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@nba/lib/get-session", () => ({
  getServerSession: vi.fn(),
}))

const { mockPrisma } = vi.hoisted(() => ({ mockPrisma: {} as any }))

vi.mock("@nba/lib/db", () => ({
  prisma: new Proxy(
    {},
    {
      get: (_t, prop) => {
        if (!(prop in mockPrisma)) mockPrisma[prop] = { findUnique: vi.fn(), count: vi.fn(), findMany: vi.fn() }
        return mockPrisma[prop]
      },
    },
  ),
}))

const { requirePermissionMock, handleAuthErrorMock } = vi.hoisted(() => ({
  requirePermissionMock: vi.fn(),
  handleAuthErrorMock: vi.fn((e: any) => ({ status: 500, body: { error: String(e) } })),
}))

vi.mock("@nba/lib/auth-utils", () => ({
  requirePermission: requirePermissionMock,
  handleAuthError: handleAuthErrorMock,
}))

import { GET } from "./route"

describe("admin/signals/estimate route", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrisma.user = { findMany: vi.fn() }
    mockPrisma.subscriptionPlan = { findMany: vi.fn() }
    requirePermissionMock.mockResolvedValue({ user: { id: "admin-1" } })
  })

  it("retourne total=0 et breakdown vide si aucun planId", async () => {
    const fakeReq = { url: "https://x/api/admin/signals/estimate" } as any
    const res = await GET(fakeReq)
    const json = await res.json()
    expect(json).toEqual({ breakdown: [], overrideCount: 0, total: 0 })
    expect(mockPrisma.user.findMany).not.toHaveBeenCalled()
  })

  it("calcule le total en MIRROIR de distributeSignal (override + exclusion expediteur)", async () => {
    const fakeReq = {
      url: "https://x/api/admin/signals/estimate?planIds=p1,p2",
    } as any

    mockPrisma.subscriptionPlan.findMany.mockResolvedValue([
      { id: "p1", name: "Signals X Forex" },
      { id: "p2", name: "Signals X Deriv" },
    ])

    // 4 users renvoyés par findMany = ensemble distribué (déjà filtré)
    //   - u1: accès p1
    //   - u2: accès p1 + p2 (compte 1 dans total, 1 dans p1, 1 dans p2)
    //   - u3: override pur (pas d'accès)
    //   - u4: accès p2
    mockPrisma.user.findMany.mockResolvedValue([
      { id: "u1", signalsAccessOverride: false, accessRequests: [{ planId: "p1" }] },
      { id: "u2", signalsAccessOverride: false, accessRequests: [{ planId: "p1" }, { planId: "p2" }] },
      { id: "u3", signalsAccessOverride: true, accessRequests: [] },
      { id: "u4", signalsAccessOverride: false, accessRequests: [{ planId: "p2" }] },
    ])

    const res = await GET(fakeReq)
    const json = await res.json()

    expect(json.total).toBe(4) // 4 destinataires uniques
    expect(json.overrideCount).toBe(1) // u3
    const p1 = json.breakdown.find((b: any) => b.planId === "p1")
    const p2 = json.breakdown.find((b: any) => b.planId === "p2")
    expect(p1.count).toBe(2) // u1 + u2
    expect(p2.count).toBe(2) // u2 + u4
  })

  it("passe bien l'id de l'expediteur (session) en exclusion a findMany", async () => {
    requirePermissionMock.mockResolvedValue({ user: { id: "self" } })
    mockPrisma.subscriptionPlan.findMany.mockResolvedValue([{ id: "p1", name: "P1" }])
    mockPrisma.user.findMany.mockResolvedValue([])

    const fakeReq = { url: "https://x/api/admin/signals/estimate?planIds=p1" } as any
    await GET(fakeReq)

    const whereArg = (mockPrisma.user.findMany as any).mock.calls[0][0].where
    expect(whereArg.id).toEqual({ not: "self" })
    // Override + accès doivent figurer dans le OR
    expect(whereArg.OR).toEqual([
      { accessRequests: { some: { planId: { in: ["p1"] }, status: "APPROVED" } } },
      { signalsAccessOverride: true },
    ])
  })

  it("utilise planId (pas plan.name) comme cle de breakdown", async () => {
    const fakeReq = { url: "https://x/api/admin/signals/estimate?planIds=p1" } as any
    mockPrisma.subscriptionPlan.findMany.mockResolvedValue([{ id: "p1", name: "Signals X Forex" }])
    mockPrisma.user.findMany.mockResolvedValue([
      { id: "u1", signalsAccessOverride: false, accessRequests: [{ planId: "p1" }] },
    ])

    const res = await GET(fakeReq)
    const json = await res.json()
    expect(json.breakdown[0].planId).toBe("p1")
    expect(json.breakdown[0].name).toBe("Signals X Forex")
  })
})
