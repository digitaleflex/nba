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
            findFirst: vi.fn(),
            findMany: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
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

import { GET, POST } from "./route"
import { getServerSession } from "@nba/lib/get-session"

const USER_ID = "user-1"

function authSession() { (getServerSession as any).mockResolvedValue({ user: { id: USER_ID } }) }
function noSession() { (getServerSession as any).mockResolvedValue(null) }
function mockReq(body?: any) { return { json: async () => body } as any }

describe("GET /api/dashboard/journal/sessions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authSession()
    prismaMock.journalSession = { findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn() }
  })

  it("retourne 401 si non authentifié", async () => {
    noSession()
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it("retourne session active et sessions récentes", async () => {
    prismaMock.journalSession.findFirst.mockResolvedValue({
      id: "s1",
      plan: { name: "Premium" },
      _count: { trades: 3 },
    })
    prismaMock.journalSession.findMany.mockResolvedValue([{ id: "s2", _count: { trades: 1 } }])

    const res = await GET()
    const json = await res.json()

    expect(json.active).toEqual(expect.objectContaining({ id: "s1" }))
    expect(json.recent).toHaveLength(1)
  })
})

describe("POST /api/dashboard/journal/sessions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authSession()
    prismaMock.journalSession = { findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn() }
  })

  it("retourne la session existante si déjà active", async () => {
    const existing = { id: "s1", isActive: true }
    prismaMock.journalSession.findFirst.mockResolvedValue(existing)

    const res = await POST(mockReq({}))
    const json = await res.json()

    expect(json.session).toEqual(existing)
    expect(prismaMock.journalSession.create).not.toHaveBeenCalled()
  })

  it("crée une nouvelle session si aucune active", async () => {
    prismaMock.journalSession.findFirst.mockResolvedValue(null)
    prismaMock.journalSession.create.mockResolvedValue({ id: "s2", isActive: true })

    const res = await POST(mockReq({ planId: "550e8400-e29b-41d4-a716-446655440000" }))
    const json = await res.json()

    expect(json.session.id).toBe("s2")
    expect(prismaMock.journalSession.create).toHaveBeenCalled()
  })
})
