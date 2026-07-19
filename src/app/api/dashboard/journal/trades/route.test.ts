import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@nba/lib/get-session", () => ({
  getServerSession: vi.fn(),
}))

const { prismaMock } = vi.hoisted(() => ({ prismaMock: {} as any }))

vi.mock("@nba/lib/db", () => ({
  prisma: new Proxy(
    {},
    {
      get: (_t, prop) => {
        if (!(prop in prismaMock)) {
          prismaMock[prop] = {
            findMany: vi.fn(),
            findUnique: vi.fn(),
            findFirst: vi.fn(),
            count: vi.fn(),
            groupBy: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            upsert: vi.fn(),
            delete: vi.fn(),
            $transaction: vi.fn(),
          }
        }
        return prismaMock[prop]
      },
    },
  ),
}))

vi.mock("@nba/lib/services/journal-psychology", () => ({
  checkPsychology: vi.fn().mockResolvedValue([]),
}))

vi.mock("@nba/lib/auth-utils", () => ({
  handleAuthError: vi.fn((e: any) => ({ status: 500, json: async () => ({ error: String(e) }) })),
}))

import { GET, POST } from "./route"
import { getServerSession } from "@nba/lib/get-session"
import { NextResponse } from "next/server"

const USER_ID = "user-1"

function authSession() {
  ;(getServerSession as any).mockResolvedValue({ user: { id: USER_ID } })
}

function noSession() {
  ;(getServerSession as any).mockResolvedValue(null)
}

function mockReq(url: string, body?: any) {
  return {
    url,
    json: async () => body,
  } as any
}

describe("GET /api/dashboard/journal/trades", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authSession()
    prismaMock.trade = { findMany: vi.fn(), count: vi.fn(), groupBy: vi.fn(), create: vi.fn() }
    prismaMock.journalSession = { findFirst: vi.fn() }
  })

  it("retourne 401 si non authentifié", async () => {
    noSession()
    const res = await GET(mockReq("https://x/api/dashboard/journal/trades"))
    expect(res.status).toBe(401)
  })

  it("retourne les trades paginés avec filtres", async () => {
    prismaMock.trade.findMany.mockResolvedValue([
      { id: "t1", pair: "EURUSD", result: "WIN", pnl: 20 },
    ])
    prismaMock.trade.count.mockResolvedValue(1)
    prismaMock.journalSession.findFirst.mockResolvedValue(null)
    prismaMock.trade.groupBy.mockResolvedValue([{ pair: "EURUSD" }])

    const res = await GET(mockReq("https://x/api/dashboard/journal/trades?page=1&limit=10"))
    const json = await res.json()

    expect(json.trades).toHaveLength(1)
    expect(json.pagination.totalCount).toBe(1)
    expect(json.filters.pairs).toEqual(["EURUSD"])
  })

  it("filtre par recherche (paire, note, tag)", async () => {
    prismaMock.trade.findMany.mockResolvedValue([])
    prismaMock.trade.count.mockResolvedValue(0)
    prismaMock.journalSession.findFirst.mockResolvedValue(null)
    prismaMock.trade.groupBy.mockResolvedValue([])

    await GET(mockReq("https://x/api/dashboard/journal/trades?search=EURUSD"))

    const where = prismaMock.trade.findMany.mock.calls[0][0].where
    expect(where.OR).toEqual([
      { pair: { contains: "EURUSD" } },
      { note: { contains: "EURUSD", mode: "insensitive" } },
      { tags: { has: "EURUSD" } },
    ])
  })
})

describe("POST /api/dashboard/journal/trades", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authSession()
    prismaMock.trade = { findMany: vi.fn(), count: vi.fn(), groupBy: vi.fn(), create: vi.fn() }
    prismaMock.journalSession = { findFirst: vi.fn() }
    prismaMock.streak = { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() }
    prismaMock.$transaction = vi.fn()
  })

  it("retourne 401 si non authentifié", async () => {
    noSession()
    const res = await POST(mockReq("https://x/api/dashboard/journal/trades", {}))
    expect(res.status).toBe(401)
  })

  it("crée un trade WIN Forex avec PnL correct et streak", async () => {
    const body = {
      pair: "EURUSD",
      direction: "BUY",
      result: "WIN",
      entryPrice: 1.08500,
      exitPrice: 1.08700,
      lotSize: 0.01,
    }

    prismaMock.$transaction.mockImplementation(async (fn: any) => {
      prismaMock.journalSession.findFirst.mockResolvedValue(null)
      prismaMock.trade.create.mockResolvedValue({
        id: "t1",
        userId: USER_ID,
        pair: "EURUSD",
        pnl: 20,
      })
      prismaMock.streak.findUnique.mockResolvedValue(null)
      prismaMock.streak.create.mockResolvedValue({})
      return await fn(prismaMock)
    })

    const res = await POST(mockReq("https://x/api/dashboard/journal/trades", body))
    const json = await res.json()

    expect(res.status).toBe(201)
    expect(json.trade.pnl).toBe(20)
    expect(prismaMock.streak.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: USER_ID, type: "WIN_STREAK", count: 1 }),
      }),
    )
  })

  it("retourne 400 si validation Zod échoue", async () => {
    const res = await POST(mockReq("https://x/api/dashboard/journal/trades", { pair: "" }))
    expect(res.status).toBe(400)
  })
})
