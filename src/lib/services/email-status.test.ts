import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@nba/lib/db", () => ({
  prisma: {
    user: { findUnique: vi.fn(), update: vi.fn(), findFirst: vi.fn() },
    notificationDelivery: { findFirst: vi.fn(), findMany: vi.fn() },
    emailEvent: { count: vi.fn() },
  },
}))
vi.mock("@nba/lib/services/audit", () => ({
  logAuditEvent: vi.fn(async () => {}),
}))

import { markUserBounced, markUserComplained, markUserSuppressed } from "./email-status"
import { prisma } from "@nba/lib/db"
import { logAuditEvent } from "@nba/lib/services/audit"

describe("markUserBounced", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("retourne null si pas de delivery associee", async () => {
    ;(prisma.notificationDelivery.findFirst as any).mockResolvedValue(null)
    const r = await markUserBounced("ext-1")
    expect(r).toBeNull()
  })

  it("1er bounce -> BOUNCED + audit", async () => {
    ;(prisma.notificationDelivery.findFirst as any).mockResolvedValue({
      id: "d1",
      notification: { userId: "u1", user: { email: "x@x.com", name: "X" } },
    })
    ;(prisma.notificationDelivery.findMany as any).mockResolvedValue([{ id: "d1" }])
    ;(prisma.emailEvent.count as any).mockResolvedValue(1) // ce bounce
    ;(prisma.user.findUnique as any).mockResolvedValue({ emailStatus: "OK" })
    ;(prisma.user.update as any).mockResolvedValue({})

    const r = await markUserBounced("ext-1", "admin-1")

    expect(r).toEqual({ userId: "u1", email: "x@x.com", newStatus: "BOUNCED", bounceCount: 1 })
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "u1" },
        data: expect.objectContaining({ emailStatus: "BOUNCED" }),
      }),
    )
    expect(logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "user.email_status_changed",
        userId: "admin-1",
      }),
    )
  })

  it("2e+ bounce -> INVALID", async () => {
    ;(prisma.notificationDelivery.findFirst as any).mockResolvedValue({
      id: "d1",
      notification: { userId: "u1", user: { email: "x@x.com", name: "X" } },
    })
    ;(prisma.notificationDelivery.findMany as any).mockResolvedValue([{ id: "d1" }])
    ;(prisma.emailEvent.count as any).mockResolvedValue(2)
    ;(prisma.user.findUnique as any).mockResolvedValue({ emailStatus: "BOUNCED" })
    ;(prisma.user.update as any).mockResolvedValue({})

    const r = await markUserBounced("ext-1")

    expect(r?.newStatus).toBe("INVALID")
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ emailStatus: "INVALID" }) }),
    )
  })

  it("idempotent : ne re-update pas si meme statut", async () => {
    ;(prisma.notificationDelivery.findFirst as any).mockResolvedValue({
      id: "d1",
      notification: { userId: "u1", user: { email: "x@x.com", name: "X" } },
    })
    ;(prisma.notificationDelivery.findMany as any).mockResolvedValue([{ id: "d1" }])
    ;(prisma.emailEvent.count as any).mockResolvedValue(1)
    ;(prisma.user.findUnique as any).mockResolvedValue({ emailStatus: "BOUNCED" })
    ;(prisma.user.update as any).mockResolvedValue({})

    const r = await markUserBounced("ext-1")
    expect(r?.newStatus).toBe("BOUNCED")
    expect(prisma.user.update).not.toHaveBeenCalled()
    expect(logAuditEvent).not.toHaveBeenCalled()
  })

  it("ne downgrade jamais depuis COMPLAINED/SUPPRESSED/INVALID", async () => {
    ;(prisma.notificationDelivery.findFirst as any).mockResolvedValue({
      id: "d1",
      notification: { userId: "u1", user: { email: "x@x.com", name: "X" } },
    })
    ;(prisma.notificationDelivery.findMany as any).mockResolvedValue([{ id: "d1" }])
    ;(prisma.emailEvent.count as any).mockResolvedValue(1)
    ;(prisma.user.findUnique as any).mockResolvedValue({ emailStatus: "COMPLAINED" })
    ;(prisma.user.update as any).mockResolvedValue({})

    const r = await markUserBounced("ext-1")
    expect(r?.newStatus).toBe("BOUNCED") // calcul
    expect(prisma.user.update).not.toHaveBeenCalled() // mais pas applique
  })
})

describe("markUserComplained", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("retourne null si pas de delivery", async () => {
    ;(prisma.notificationDelivery.findFirst as any).mockResolvedValue(null)
    const r = await markUserComplained("ext-1")
    expect(r).toBeNull()
  })

  it("1ere plainte -> COMPLAINED + isActive=false + audit", async () => {
    ;(prisma.notificationDelivery.findFirst as any).mockResolvedValue({
      id: "d1",
      notification: {
        userId: "u1",
        user: { email: "x@x.com", name: "X", isActive: true, emailStatus: "OK" },
      },
    })
    ;(prisma.user.update as any).mockResolvedValue({})

    const r = await markUserComplained("ext-1", "admin-1")

    expect(r).toEqual({ userId: "u1", email: "x@x.com", wasActive: true })
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "u1" },
        data: expect.objectContaining({
          emailStatus: "COMPLAINED",
          isActive: false,
        }),
      }),
    )
    expect(logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "user.email_status_changed",
        details: expect.objectContaining({
          from: "OK",
          to: "COMPLAINED",
          suspended: true,
        }),
      }),
    )
  })

  it("idempotent : si deja COMPLAINED, ne re-suspend pas", async () => {
    ;(prisma.notificationDelivery.findFirst as any).mockResolvedValue({
      id: "d1",
      notification: {
        userId: "u1",
        user: { email: "x@x.com", name: "X", isActive: false, emailStatus: "COMPLAINED" },
      },
    })

    await markUserComplained("ext-1")
    expect(prisma.user.update).not.toHaveBeenCalled()
    expect(logAuditEvent).not.toHaveBeenCalled()
  })

  it("ne downgrade jamais depuis INVALID ou SUPPRESSED", async () => {
    ;(prisma.notificationDelivery.findFirst as any).mockResolvedValue({
      id: "d1",
      notification: {
        userId: "u1",
        user: { email: "x@x.com", name: "X", isActive: false, emailStatus: "INVALID" },
      },
    })

    await markUserComplained("ext-1")
    expect(prisma.user.update).not.toHaveBeenCalled()
  })
})

describe("markUserSuppressed", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("retourne null si pas de delivery", async () => {
    ;(prisma.notificationDelivery.findFirst as any).mockResolvedValue(null)
    const r = await markUserSuppressed("ext-1")
    expect(r).toBeNull()
  })

  it("OK -> SUPPRESSED + audit (Bonus #74)", async () => {
    ;(prisma.notificationDelivery.findFirst as any).mockResolvedValue({
      id: "d1",
      notification: {
        userId: "u1",
        user: { email: "x@x.com", name: "X", isActive: true, emailStatus: "OK" },
      },
    })
    ;(prisma.user.update as any).mockResolvedValue({})

    const r = await markUserSuppressed("ext-1", "admin-1")

    expect(r).toEqual({ userId: "u1", email: "x@x.com", wasActive: true })
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "u1" },
        data: expect.objectContaining({ emailStatus: "SUPPRESSED" }),
      }),
    )
    expect(logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        details: expect.objectContaining({ from: "OK", to: "SUPPRESSED", reason: "email.suppressed" }),
      }),
    )
  })

  it("idempotent : deja SUPPRESSED -> pas d'update", async () => {
    ;(prisma.notificationDelivery.findFirst as any).mockResolvedValue({
      id: "d1",
      notification: {
        userId: "u1",
        user: { email: "x@x.com", name: "X", isActive: true, emailStatus: "SUPPRESSED" },
      },
    })
    await markUserSuppressed("ext-1")
    expect(prisma.user.update).not.toHaveBeenCalled()
  })

  it("ne downgrade jamais depuis COMPLAINED ou INVALID", async () => {
    for (const severe of ["COMPLAINED", "INVALID"]) {
      vi.clearAllMocks()
      ;(prisma.notificationDelivery.findFirst as any).mockResolvedValue({
        id: "d1",
        notification: {
          userId: "u1",
          user: { email: "x@x.com", name: "X", isActive: true, emailStatus: severe },
        },
      })
      await markUserSuppressed("ext-1")
      expect(prisma.user.update).not.toHaveBeenCalled()
    }
  })
})
