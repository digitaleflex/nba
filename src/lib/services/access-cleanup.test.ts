import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@nba/lib/db", () => ({
  prisma: {
    user: { findMany: vi.fn() },
    accessRequest: { updateMany: vi.fn() },
  },
}))
vi.mock("@nba/lib/services/audit", () => ({
  logAuditEvent: vi.fn(async () => {}),
}))
vi.mock("@nba/lib/cache", () => ({
  invalidatePrefix: vi.fn(async () => {}),
}))

import { cleanupGhostAccess } from "./access-cleanup"
import { logAuditEvent } from "@nba/lib/services/audit"
import { invalidatePrefix } from "@nba/lib/cache"
import { prisma } from "@nba/lib/db"

describe("cleanupGhostAccess", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("retourne 0 si aucun fantome", async () => {
    ;(prisma.user.findMany as any).mockResolvedValue([])
    const r = await cleanupGhostAccess({})
    expect(r).toEqual({
      usersAffected: 0,
      accessRequestsRevoked: 0,
      byPlan: [],
      ghostUsers: [],
    })
    expect(prisma.accessRequest.updateMany).not.toHaveBeenCalled()
    expect(logAuditEvent).not.toHaveBeenCalled()
  })

  it("revoke les acces APPROVED des users inactifs/supprimes et journalise", async () => {
    ;(prisma.user.findMany as any).mockResolvedValue([
      {
        id: "u1",
        email: "g1@x.com",
        name: "G1",
        isActive: false,
        deletedAt: null,
        accessRequests: [{ id: "ar1", planId: "p1", plan: { name: "Forex" } }],
      },
      {
        id: "u2",
        email: "g2@x.com",
        name: "G2",
        isActive: true,
        deletedAt: new Date("2026-07-07"),
        accessRequests: [
          { id: "ar2", planId: "p2", plan: { name: "Deriv" } },
          { id: "ar3", planId: "p1", plan: { name: "Forex" } },
        ],
      },
    ])
    ;(prisma.accessRequest.updateMany as any).mockResolvedValue({ count: 3 })

    const r = await cleanupGhostAccess({ triggeredBy: "admin-1" })

    expect(r.usersAffected).toBe(2)
    expect(r.accessRequestsRevoked).toBe(3)
    expect(r.byPlan).toEqual(
      expect.arrayContaining([
        { planId: "p1", planName: "Forex", revoked: 2 },
        { planId: "p2", planName: "Deriv", revoked: 1 },
      ]),
    )
    expect(prisma.accessRequest.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: { in: ["ar1", "ar2", "ar3"] } },
        data: expect.objectContaining({ status: "REVOKED" }),
      }),
    )
    expect(logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "access.cleanup_ghosts",
        userId: "admin-1",
      }),
    )
    expect(invalidatePrefix).toHaveBeenCalledWith("plans")
    expect(invalidatePrefix).toHaveBeenCalledWith("ops")
    expect(invalidatePrefix).toHaveBeenCalledWith("control-room")
  })

  it("dryRun ne modifie pas la base mais retourne le resultat", async () => {
    ;(prisma.user.findMany as any).mockResolvedValue([
      {
        id: "u1",
        email: "g@x.com",
        name: "G",
        isActive: false,
        deletedAt: null,
        accessRequests: [{ id: "ar1", planId: "p1", plan: { name: "P" } }],
      },
    ])

    const r = await cleanupGhostAccess({ dryRun: true })

    expect(r.usersAffected).toBe(1)
    expect(r.accessRequestsRevoked).toBe(1)
    expect(prisma.accessRequest.updateMany).not.toHaveBeenCalled()
    expect(logAuditEvent).not.toHaveBeenCalled()
  })
})
