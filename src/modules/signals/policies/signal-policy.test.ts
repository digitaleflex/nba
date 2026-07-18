import { describe, it, expect, vi, beforeEach } from "vitest"
import { SignalPolicy } from "./signal-policy"
import { prisma } from "@nba/lib/db"

vi.mock("@nba/lib/db", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
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
    it("allows active users", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "user-member",
        isActive: true,
      } as any)

      const allowed = await SignalPolicy.canView("user-member", "signal-1")
      expect(allowed).toBe(true)
    })

    it("denies inactive users", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "user-member",
        isActive: false,
      } as any)

      const allowed = await SignalPolicy.canView("user-member", "signal-1")
      expect(allowed).toBe(false)
    })

    it("denies non-existent users", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

      const allowed = await SignalPolicy.canView("unknown", "signal-1")
      expect(allowed).toBe(false)
    })
  })
})
