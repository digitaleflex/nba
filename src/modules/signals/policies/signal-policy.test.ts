import { describe, it, expect, vi, beforeEach } from "vitest"
import { SignalPolicy } from "./signal-policy"
import { prisma } from "@nba/lib/db"

vi.mock("@nba/lib/db", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    signalAudience: {
      findMany: vi.fn(),
    },
    accessRequest: {
      findFirst: vi.fn(),
    },
  },
}))

describe("SignalPolicy", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("canCreate", () => {
    it("allows ADMIN users", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "user-admin",
        role: { name: "ADMIN", permissions: [] }
      } as any)

      const allowed = await SignalPolicy.canCreate("user-admin")
      expect(allowed).toBe(true)
    })

    it("allows users with signals.create permission", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "user-editor",
        role: {
          name: "MEMBER",
          permissions: [{ permission: { name: "signals.create" } }]
        }
      } as any)

      const allowed = await SignalPolicy.canCreate("user-editor")
      expect(allowed).toBe(true)
    })

    it("denies regular users without permission", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "user-member",
        role: {
          name: "MEMBER",
          permissions: []
        }
      } as any)

      const allowed = await SignalPolicy.canCreate("user-member")
      expect(allowed).toBe(false)
    })
  })

  describe("canView", () => {
    it("allows users with approved access to a targeted plan", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "user-member",
        role: { name: "MEMBER" },
        isActive: true,
        signalsAccessOverride: false,
      } as any)
      vi.mocked(prisma.signalAudience.findMany).mockResolvedValue([
        { planId: "plan-forex" }
      ] as any)
      vi.mocked(prisma.accessRequest.findFirst).mockResolvedValue({
        id: "req-1",
        status: "APPROVED"
      } as any)

      const allowed = await SignalPolicy.canView("user-member", "signal-1")
      expect(allowed).toBe(true)
    })

    it("allows admin users unconditionally", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "admin-1",
        role: { name: "ADMIN" },
        isActive: true,
        signalsAccessOverride: false,
      } as any)

      const allowed = await SignalPolicy.canView("admin-1", "signal-1")
      expect(allowed).toBe(true)
    })

    it("allows users with signalsAccessOverride", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "override-user",
        role: { name: "MEMBER" },
        isActive: true,
        signalsAccessOverride: true,
      } as any)

      const allowed = await SignalPolicy.canView("override-user", "signal-1")
      expect(allowed).toBe(true)
    })

    it("denies inactive users", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "user-member",
        role: { name: "MEMBER" },
        isActive: false,
        signalsAccessOverride: false,
      } as any)

      const allowed = await SignalPolicy.canView("user-member", "signal-1")
      expect(allowed).toBe(false)
    })

    it("denies users without approved access request", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "user-member",
        role: { name: "MEMBER" },
        isActive: true,
        signalsAccessOverride: false,
      } as any)
      vi.mocked(prisma.signalAudience.findMany).mockResolvedValue([
        { planId: "plan-forex" }
      ] as any)
      vi.mocked(prisma.accessRequest.findFirst).mockResolvedValue(null)

      const allowed = await SignalPolicy.canView("user-member", "signal-1")
      expect(allowed).toBe(false)
    })
  })
})
