import { describe, it, expect, vi, beforeEach } from "vitest"
import { getSignalsApi } from "./get-signals-api"
import { prisma } from "@nba/lib/db"
import { getServerSession } from "@nba/lib/get-session"
import { AuthError } from "@nba/lib/auth-utils"

vi.mock("@nba/lib/db", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
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

    await expect(getSignalsApi({})).rejects.toThrowError(
      new AuthError("Non autorisé", 401)
    )
  })

  it("throws 404 if user is not found", async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: "user-123", email: "test@example.com" },
    } as any)

    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

    await expect(getSignalsApi({})).rejects.toThrowError(
      new AuthError("Utilisateur non trouvé", 404)
    )
  })

  it("throws 403 if user is inactive", async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: "user-123", email: "test@example.com" },
    } as any)

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-123",
      isActive: false,
    } as any)

    await expect(getSignalsApi({})).rejects.toThrowError(
      new AuthError("Votre compte a été suspendu. Contactez le support.", 403)
    )
  })

  it("allows access and returns signals for any active user", async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: "user-123", email: "test@example.com" },
    } as any)

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-123",
      isActive: true,
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
    expect(result.signals[0].content).toBe("Test signal")
  })
})
