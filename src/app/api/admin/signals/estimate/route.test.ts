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
    mockPrisma.user = { findMany: vi.fn(), count: vi.fn() }
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

  it("calcule le total avec breakdown par plan + override", async () => {
    const fakeReq = {
      url: "https://x/api/admin/signals/estimate?planIds=p1,p2",
    } as any

    mockPrisma.subscriptionPlan.findMany.mockResolvedValue([
      { id: "p1", name: "Signals X Forex" },
      { id: "p2", name: "Signals X Deriv" },
    ])

    mockPrisma.user.findMany.mockResolvedValue([
      { id: "u1", signalsAccessOverride: false, accessRequests: [{ planId: "p1" }] },
      { id: "u2", signalsAccessOverride: false, accessRequests: [{ planId: "p1" }, { planId: "p2" }] },
      { id: "u3", signalsAccessOverride: true, accessRequests: [] },
      { id: "u4", signalsAccessOverride: false, accessRequests: [{ planId: "p2" }] },
    ])

    const res = await GET(fakeReq)
    const json = await res.json()

    expect(json.total).toBe(4)
    expect(json.overrideCount).toBe(1)
    const p1 = json.breakdown.find((b: any) => b.planId === "p1")
    const p2 = json.breakdown.find((b: any) => b.planId === "p2")
    expect(p1.count).toBe(2)
    expect(p2.count).toBe(2)
  })

  it("exclut l'expediteur et filtre par accès APPROVED + override", async () => {
    requirePermissionMock.mockResolvedValue({ user: { id: "self" } })
    mockPrisma.subscriptionPlan.findMany.mockResolvedValue([{ id: "p1", name: "P1" }])
    mockPrisma.user.findMany.mockResolvedValue([])

    const fakeReq = { url: "https://x/api/admin/signals/estimate?planIds=p1" } as any
    await GET(fakeReq)

    const whereArg = mockPrisma.user.findMany.mock.calls[0][0].where
    expect(whereArg.id).toEqual({ not: "self" })
    expect(whereArg.OR).toEqual([
      { accessRequests: { some: { planId: { in: ["p1"] }, status: "APPROVED" } } },
      { signalsAccessOverride: true },
    ])
  })
})
