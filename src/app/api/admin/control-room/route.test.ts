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

vi.mock("ioredis", () => ({
  default: vi.fn().mockImplementation(() => ({
    connect: vi.fn().mockResolvedValue(undefined),
    ping: vi.fn().mockResolvedValue("PONG"),
    quit: vi.fn().mockResolvedValue("OK"),
  })),
}))

vi.mock("@nba/lib/cache", () => ({
  getCached: vi.fn(async (_k: string, fetcher: any) => fetcher()),
}))

import { GET } from "./route"
import { getServerSession } from "@nba/lib/get-session"

describe("admin/control-room route", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrisma.user = { findUnique: vi.fn(), count: vi.fn() }
    mockPrisma.signal = { count: vi.fn(), findMany: vi.fn(), findFirst: vi.fn() }
    mockPrisma.kycDocument = { count: vi.fn() }
    mockPrisma.brokerVerification = { count: vi.fn() }
    mockPrisma.accessRequest = { count: vi.fn() }
    mockPrisma.notification = { count: vi.fn() }
    mockPrisma.notificationDelivery = { count: vi.fn() }
    mockPrisma.emailEvent = { count: vi.fn(), findMany: vi.fn() }
    mockPrisma.pushSubscription = { count: vi.fn() }
    mockPrisma.auditLog = { findMany: vi.fn() }
  })

  it("retourne 401 si non authentifié", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null as any)
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it("retourne 403 si l'utilisateur n'est pas admin", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: "u1" } } as any)
    mockPrisma.user.findUnique.mockResolvedValue({ role: { name: "USER" } })
    const res = await GET()
    expect(res.status).toBe(403)
  })
})
