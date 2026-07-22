import { describe, it, expect, vi, beforeEach } from "vitest"
import { getSignalsApi } from "./get-signals-api"
import { prisma } from "@nba/lib/db"
import { getServerSession } from "@nba/lib/get-session"

vi.mock("@nba/lib/db", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    accessRequest: {
      findMany: vi.fn(),
    },
    signal: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    signalRead: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    signalFavorite: {
      findMany: vi.fn(),
    },
    signalArchive: {
      findMany: vi.fn(),
    },
    subscriptionPlan: {
      findMany: vi.fn(),
    },
  },
}))

vi.mock("@nba/lib/get-session", () => ({
  getServerSession: vi.fn(),
}))

describe("getSignalsApi", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("throws 401 if user is not authenticated", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null)

    await expect(getSignalsApi({})).rejects.toThrow("Non autorisé")
  })

  it("throws 404 if user is not found", async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: "user-123", email: "test@example.com" },
    } as any)

    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

    await expect(getSignalsApi({})).rejects.toThrow("Utilisateur non trouvé")
  })

  it("throws 403 if user is inactive", async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: "user-123", email: "test@example.com" },
    } as any)

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-123",
      role: { name: "MEMBER" },
      isActive: false,
      signalsAccessOverride: false,
    } as any)

    await expect(getSignalsApi({})).rejects.toThrow(
      "Votre compte a été suspendu. Contactez le support."
    )
  })

  it("allows access and returns signals for user with approved plan", async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: "user-123", email: "test@example.com" },
    } as any)

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-123",
      role: { name: "MEMBER" },
      isActive: true,
      signalsAccessOverride: false,
    } as any)

    vi.mocked(prisma.accessRequest.findMany).mockResolvedValue([
      { planId: "plan-1" },
    ] as any)
    vi.mocked(prisma.subscriptionPlan.findMany).mockResolvedValue([
      { name: "Forex Plan" },
    ] as any)

    vi.mocked(prisma.signal.count).mockResolvedValue(1)
    vi.mocked(prisma.signal.findMany).mockResolvedValue([
      {
        id: "sig-1",
        content: "Test signal",
        imageUrl: null,
        imageUrls: [],
        publishedAt: new Date(),
        createdAt: new Date(),
        creator: { name: "Admin" },
        audience: [{ plan: { name: "Forex" } }],
      },
    ] as any)
    vi.mocked(prisma.signalRead.findMany).mockResolvedValue([])
    vi.mocked(prisma.signalRead.count).mockResolvedValue(0)
    vi.mocked(prisma.signalFavorite.findMany).mockResolvedValue([])
    vi.mocked(prisma.signalArchive.findMany).mockResolvedValue([])

    const result = await getSignalsApi({})
    expect(result.signals).toHaveLength(1)
    expect(result.signals[0].content).toBe("Test signal")
  })

  it("allows access and returns signals for users with signalsAccessOverride", async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: "user-123", email: "test@example.com" },
    } as any)

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-123",
      role: { name: "MEMBER" },
      isActive: true,
      signalsAccessOverride: true,
    } as any)

    vi.mocked(prisma.signal.count).mockResolvedValue(1)
    vi.mocked(prisma.signal.findMany).mockResolvedValue([
      {
        id: "sig-1",
        content: "Test signal",
        imageUrl: null,
        imageUrls: [],
        publishedAt: new Date(),
        createdAt: new Date(),
        creator: { name: "Admin" },
        audience: [{ plan: { name: "Forex" } }],
      },
    ] as any)
    vi.mocked(prisma.signalRead.findMany).mockResolvedValue([])
    vi.mocked(prisma.signalRead.count).mockResolvedValue(0)
    vi.mocked(prisma.signalFavorite.findMany).mockResolvedValue([])
    vi.mocked(prisma.signalArchive.findMany).mockResolvedValue([])

    const result = await getSignalsApi({})
    expect(result.signals).toHaveLength(1)
  })

  it("returns empty for user without approved plan", async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: "user-123", email: "test@example.com" },
    } as any)

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-123",
      role: { name: "MEMBER" },
      isActive: true,
      signalsAccessOverride: false,
    } as any)

    vi.mocked(prisma.accessRequest.findMany).mockResolvedValue([])

    const result = await getSignalsApi({})
    expect(result.signals).toHaveLength(0)
    expect(result.pagination.total).toBe(0)
  })
})
