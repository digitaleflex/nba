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
    mockPrisma.user = { count: vi.fn(), findMany: vi.fn() }
    requirePermissionMock.mockResolvedValue({ user: { id: "admin-1" } })
  })

  it("retourne total=0 et breakdown vide si aucun planId", async () => {
    const fakeReq = { url: "https://x/api/admin/signals/estimate" } as any
    const res = await GET(fakeReq)
    const json = await res.json()
    expect(json).toEqual({ breakdown: [], overrideCount: 0, total: 0 })
    expect(mockPrisma.user.count).not.toHaveBeenCalled()
  })

  it("compte tous les utilisateurs actifs", async () => {
    mockPrisma.user.count.mockResolvedValue(10)
    const fakeReq = { url: "https://x/api/admin/signals/estimate?planIds=p1" } as any

    const res = await GET(fakeReq)
    const json = await res.json()

    expect(json.total).toBe(10)
    expect(json.breakdown).toEqual([])
    expect(json.overrideCount).toBe(0)

    const whereArg = mockPrisma.user.count.mock.calls[0][0].where
    expect(whereArg.isActive).toBe(true)
    expect(whereArg.deletedAt).toBe(null)
  })

  it("exclut l'expediteur du comptage", async () => {
    requirePermissionMock.mockResolvedValue({ user: { id: "self" } })
    mockPrisma.user.count.mockResolvedValue(0)

    const fakeReq = { url: "https://x/api/admin/signals/estimate?planIds=p1" } as any
    await GET(fakeReq)

    const whereArg = mockPrisma.user.count.mock.calls[0][0].where
    expect(whereArg.id).toEqual({ not: "self" })
  })
})
