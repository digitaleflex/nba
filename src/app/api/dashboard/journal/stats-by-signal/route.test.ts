import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@nba/lib/get-session", () => ({ getServerSession: vi.fn() }))

const { prismaMock } = vi.hoisted(() => ({ prismaMock: {} as any }))

vi.mock("@nba/lib/db", () => ({
  prisma: new Proxy(
    {},
    {
      get: (_t, prop) => {
        if (!(prop in prismaMock)) {
          prismaMock[prop] = {
            groupBy: vi.fn(),
            findMany: vi.fn(),
            findUnique: vi.fn(),
          }
        }
        return prismaMock[prop]
      },
    },
  ),
}))

vi.mock("@nba/lib/auth-utils", () => ({
  handleAuthError: vi.fn((e: any) => ({ status: 500, json: async () => ({ error: String(e) }) })),
}))

import { GET } from "./route"
import { getServerSession } from "@nba/lib/get-session"

const USER_ID = "user-1"

function authSession() { (getServerSession as any).mockResolvedValue({ user: { id: USER_ID } }) }
function noSession() { (getServerSession as any).mockResolvedValue(null) }
function mockReq() { return { url: "https://x/api/dashboard/journal/stats-by-signal" } as any }

describe("GET /api/dashboard/journal/stats-by-signal", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authSession()
    prismaMock.trade = { groupBy: vi.fn(), findMany: vi.fn() }
    prismaMock.signal = { findMany: vi.fn() }
  })

  it("retourne 401 si non authentifié", async () => {
    noSession()
    const res = await GET(mockReq())
    expect(res.status).toBe(401)
  })

  it("retourne les stats agrégées par signal", async () => {
    prismaMock.trade.groupBy.mockResolvedValue([
      { signalId: "sig-1", _count: { id: 3 }, _sum: { pnl: 50 } },
    ])
    prismaMock.signal.findMany.mockResolvedValue([
      { id: "sig-1", content: "Acheter EURUSD", publishedAt: new Date("2026-07-19") },
    ])

    const res = await GET(mockReq())
    const json = await res.json()

    expect(json.signals).toHaveLength(1)
    expect(json.signals[0].content).toBe("Acheter EURUSD")
  })
})
