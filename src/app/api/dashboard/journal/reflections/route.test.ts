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
            findMany: vi.fn(),
            findUnique: vi.fn(),
            upsert: vi.fn(),
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

const { rateLimitNext } = vi.hoisted(() => ({ rateLimitNext: { value: null as any } }))

vi.mock("@nba/lib/rate-limit", () => ({
  rateLimitMiddleware: vi.fn(() => vi.fn(async () => rateLimitNext.value)),
}))

vi.mock("@nba/lib/services/journal-discipline", () => ({
  updateDisciplineStreak: vi.fn().mockResolvedValue(undefined),
}))

import { GET, POST } from "./route"
import { getServerSession } from "@nba/lib/get-session"

const USER_ID = "user-1"

function authSession() { (getServerSession as any).mockResolvedValue({ user: { id: USER_ID } }) }
function noSession() { (getServerSession as any).mockResolvedValue(null) }
function mockReq(body?: any) { return { json: async () => body } as any }

describe("GET /api/dashboard/journal/reflections", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authSession()
    prismaMock.dailyReflection = { findMany: vi.fn(), findUnique: vi.fn(), upsert: vi.fn() }
    prismaMock.trade = { findMany: vi.fn() }
  })

  it("retourne 401 si non authentifié", async () => {
    noSession()
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it("retourne les réflexions de l'utilisateur", async () => {
    prismaMock.dailyReflection.findMany.mockResolvedValue([
      { id: "r1", rating: 8, tradeCount: 3 },
    ])

    const res = await GET()
    const json = await res.json()

    expect(json.reflections).toHaveLength(1)
    expect(prismaMock.dailyReflection.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: USER_ID }, orderBy: { date: "desc" } }),
    )
  })
})

describe("POST /api/dashboard/journal/reflections", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authSession()
    prismaMock.dailyReflection = { findMany: vi.fn(), findUnique: vi.fn(), upsert: vi.fn() }
    prismaMock.trade = { findMany: vi.fn() }
  })

  it("retourne 400 si rating manquant", async () => {
    const res = await POST(mockReq({ date: "2026-07-19" }))
    expect(res.status).toBe(400)
  })

  it("crée ou met à jour la réflexion du jour", async () => {
    prismaMock.dailyReflection.findUnique.mockResolvedValue(null)
    prismaMock.trade.findMany.mockResolvedValue([
      { id: "t1", result: "WIN", pnl: 20 },
      { id: "t2", result: "LOSS", pnl: -10 },
    ])
    prismaMock.dailyReflection.upsert.mockResolvedValue({
      id: "r1",
      rating: 8,
      tradeCount: 2,
      wins: 1,
      losses: 1,
      totalPnl: 10,
    })

    const res = await POST(mockReq({ date: "2026-07-19", rating: 8, mood: "CONFIDENT", note: "Bonne journée" }))
    const json = await res.json()

    expect(json.reflection.tradeCount).toBe(2)
    expect(json.reflection.wins).toBe(1)
    expect(json.reflection.totalPnl).toBe(10)
  })

  it("retourne 400 si rating hors borne (0)", async () => {
    const res = await POST(mockReq({ date: "2026-07-19", rating: 0 }))
    expect(res.status).toBe(400)
  })

  it("retourne 400 si rating hors borne (11)", async () => {
    const res = await POST(mockReq({ date: "2026-07-19", rating: 11 }))
    expect(res.status).toBe(400)
  })

  it("retourne 400 si mood invalide", async () => {
    const res = await POST(mockReq({ date: "2026-07-19", rating: 7, mood: "JOYEUX" }))
    expect(res.status).toBe(400)
  })

  it("retourne 400 si note trop longue (>1000)", async () => {
    const res = await POST(mockReq({ date: "2026-07-19", rating: 7, note: "x".repeat(1001) }))
    expect(res.status).toBe(400)
  })

  it("retourne 400 si date absente", async () => {
    const res = await POST(mockReq({ rating: 7 }))
    expect(res.status).toBe(400)
  })

  it("ne recalcule pas les stats si une réflexion existante a déjà des trades", async () => {
    prismaMock.dailyReflection.findUnique.mockResolvedValue({ tradeCount: 3, wins: 2, losses: 1, totalPnl: 42 })
    prismaMock.dailyReflection.upsert.mockResolvedValue({
      id: "r1",
      rating: 5,
      tradeCount: 3,
      wins: 2,
      losses: 1,
      totalPnl: 42,
    })

    const res = await POST(mockReq({ date: "2026-07-19", rating: 5 }))
    const json = await res.json()

    expect(json.reflection.tradeCount).toBe(3)
    const upsertCall = prismaMock.dailyReflection.upsert.mock.calls[0][0]
    expect(upsertCall.update.tradeCount).toBeUndefined()
    expect(upsertCall.update.totalPnl).toBeUndefined()
    expect(upsertCall.update.wins).toBeUndefined()
  })

  it("recalcul les stats si aucune réflexion existante (tradeCount=0)", async () => {
    prismaMock.dailyReflection.findUnique.mockResolvedValue({ tradeCount: 0 })
    prismaMock.trade.findMany.mockResolvedValue([
      { id: "t1", result: "WIN", pnl: 15 },
      { id: "t2", result: "WIN", pnl: 5 },
      { id: "t3", result: "LOSS", pnl: -8 },
    ])
    prismaMock.dailyReflection.upsert.mockResolvedValue({
      id: "r1",
      rating: 9,
      tradeCount: 3,
      wins: 2,
      losses: 1,
      totalPnl: 12,
    })

    const res = await POST(mockReq({ date: "2026-07-19", rating: 9 }))
    const json = await res.json()

    expect(json.reflection.tradeCount).toBe(3)
    expect(json.reflection.wins).toBe(2)
    expect(json.reflection.losses).toBe(1)
    expect(json.reflection.totalPnl).toBe(12)
  })
})

describe("POST /api/dashboard/journal/reflections — rate limit", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    rateLimitNext.value = null
    authSession()
    prismaMock.dailyReflection = { findMany: vi.fn(), findUnique: vi.fn(), upsert: vi.fn() }
    prismaMock.trade = { findMany: vi.fn() }
  })

  it("retourne 429 si le rate limit bloque la requête", async () => {
    rateLimitNext.value = new Response(JSON.stringify({ error: "Trop de requêtes" }), { status: 429 })

    const res = await POST(mockReq({ date: "2026-07-19", rating: 8 }))
    expect(res.status).toBe(429)
  })
})
