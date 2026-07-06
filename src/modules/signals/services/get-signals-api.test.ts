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
    kycDocument: {
      findFirst: vi.fn(),
    },
    brokerVerification: {
      findFirst: vi.fn(),
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

    await expect(getSignalsApi({})).rejects.toThrowError(
      new AuthError("Non autorisé", 401)
    )
  })

  it("throws 403 if user profile is incomplete", async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: "user-123", email: "test@example.com" },
    } as any)

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-123",
      role: { name: "MEMBER" },
      country: "France",
      phone: "", // Incomplete
      whatsapp: "12345",
    } as any)

    await expect(getSignalsApi({})).rejects.toThrowError(
      new AuthError("Veuillez compléter votre profil à 100% pour accéder aux signaux", 403)
    )
  })

  it("throws 403 if KYC or Broker is not approved", async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: "user-123", email: "test@example.com" },
    } as any)

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-123",
      role: { name: "MEMBER" },
      country: "France",
      phone: "12345",
      whatsapp: "12345",
    } as any)

    // KYC pending, Broker not submitted
    vi.mocked(prisma.kycDocument.findFirst).mockResolvedValue({
      status: "PENDING",
    } as any)
    vi.mocked(prisma.brokerVerification.findFirst).mockResolvedValue(null)

    await expect(getSignalsApi({})).rejects.toThrowError(
      new AuthError("Votre compte est en attente d'activation. KYC ou vérification Broker non validés.", 403)
    )
  })

  it("allows access and returns signals if user is admin (even with incomplete profile/onboarding)", async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: "admin-123", email: "admin@example.com" },
    } as any)

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "admin-123",
      role: { name: "ADMIN" },
      country: null,
      phone: null,
      whatsapp: null,
    } as any)

    vi.mocked(prisma.signal.count).mockResolvedValue(0)
    vi.mocked(prisma.signal.findMany).mockResolvedValue([])
    vi.mocked(prisma.signalRead.findMany).mockResolvedValue([])
    vi.mocked(prisma.signalRead.count).mockResolvedValue(0)
    vi.mocked(prisma.signalFavorite.findMany).mockResolvedValue([])
    vi.mocked(prisma.signalArchive.findMany).mockResolvedValue([])

    const result = await getSignalsApi({})
    expect(result.signals).toEqual([])
  })

  it("allows access and returns signals if onboarding is fully complete", async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: "user-123", email: "test@example.com" },
    } as any)

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-123",
      role: { name: "MEMBER" },
      country: "France",
      phone: "12345",
      whatsapp: "12345",
    } as any)

    vi.mocked(prisma.kycDocument.findFirst).mockResolvedValue({
      status: "APPROVED",
    } as any)
    vi.mocked(prisma.brokerVerification.findFirst).mockResolvedValue({
      status: "APPROVED",
    } as any)

    vi.mocked(prisma.accessRequest.findMany).mockResolvedValue([
      { planId: "plan-1" },
    ] as any)

    vi.mocked(prisma.signal.count).mockResolvedValue(0)
    vi.mocked(prisma.signal.findMany).mockResolvedValue([])
    vi.mocked(prisma.signalRead.findMany).mockResolvedValue([])
    vi.mocked(prisma.signalRead.count).mockResolvedValue(0)
    vi.mocked(prisma.signalFavorite.findMany).mockResolvedValue([])
    vi.mocked(prisma.signalArchive.findMany).mockResolvedValue([])
    vi.mocked(prisma.subscriptionPlan.findMany).mockResolvedValue([
      { name: "Forex Plan" },
    ] as any)

    const result = await getSignalsApi({})
    expect(result.signals).toEqual([])
  })
})
