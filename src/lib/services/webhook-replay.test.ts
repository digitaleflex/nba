import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@nba/lib/db", () => ({
  prisma: {
    notificationDelivery: { findFirst: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    emailEvent: { create: vi.fn() },
  },
}))
vi.mock("./email-webhooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./email-webhooks")>()
  return {
    ...actual,
    markUserBounced: vi.fn(async () => null),
    markUserComplained: vi.fn(async () => null),
  }
})
vi.mock("@nba/lib/email", () => ({
  sendEmail: vi.fn(async () => "id"),
}))

import { replayEmailEvent } from "./email-webhooks"
import { prisma } from "@nba/lib/db"

describe("replayEmailEvent", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("retourne erreur si pas de delivery", async () => {
    ;(prisma.emailEvent.create as any).mockResolvedValue({})
    ;(prisma.notificationDelivery.findFirst as any).mockResolvedValue(null)
    const r = await replayEmailEvent({
      event: { type: "email.delivered" },
      externalId: "ext-1",
      svixId: "evt-1",
    })
    expect(r.ok).toBe(false)
    expect(r.message).toContain("No matching")
  })

  it("email.delivered -> SENT", async () => {
    ;(prisma.emailEvent.create as any).mockResolvedValue({})
    ;(prisma.notificationDelivery.findFirst as any).mockResolvedValue({
      id: "d1",
      status: "PENDING",
      lastEventAt: null,
    })
    const r = await replayEmailEvent({
      event: { type: "email.delivered", created_at: "2026-07-13T10:00:00Z" },
      externalId: "ext-1",
      svixId: "evt-1",
    })
    expect(r.ok).toBe(true)
    expect(r.deliveryStatus).toBe("SENT")
    expect(prisma.notificationDelivery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "d1" },
        data: expect.objectContaining({ status: "SENT" }),
      }),
    )
  })

  it("email.bounced -> BOUNCED (markUserBounced appele)", async () => {
    ;(prisma.emailEvent.create as any).mockResolvedValue({})
    ;(prisma.notificationDelivery.findFirst as any).mockResolvedValue({
      id: "d1",
      status: "PENDING",
      lastEventAt: null,
    })
    const { markUserBounced } = await import("./email-webhooks")
    const r = await replayEmailEvent({
      event: {
        type: "email.bounced",
        created_at: "2026-07-13T10:00:00Z",
        data: { bounce: { message: "Mailbox full" } },
      },
      externalId: "ext-bounce",
      svixId: "evt-bounce",
    })
    expect(r.deliveryStatus).toBe("BOUNCED")
    expect(prisma.notificationDelivery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "d1" },
        data: expect.objectContaining({ status: "BOUNCED" }),
      }),
    )
  })

  it("email.failed -> FAILED avec reason", async () => {
    ;(prisma.emailEvent.create as any).mockResolvedValue({})
    ;(prisma.notificationDelivery.findFirst as any).mockResolvedValue({
      id: "d1",
      status: "PENDING",
      lastEventAt: null,
    })
    const r = await replayEmailEvent({
      event: {
        type: "email.failed",
        data: { reason: "API Key Invalid" },
      },
      externalId: "ext-fail",
      svixId: "evt-fail",
    })
    expect(r.deliveryStatus).toBe("FAILED")
    expect(prisma.notificationDelivery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ errorMessage: "email.failed: API Key Invalid" }),
      }),
    )
  })

  it("P2002 sur emailEvent.create est ignore (idempotent)", async () => {
    ;(prisma.emailEvent.create as any).mockRejectedValue({ code: "P2002" })
    ;(prisma.notificationDelivery.findFirst as any).mockResolvedValue({
      id: "d1",
      status: "PENDING",
      lastEventAt: null,
    })
    const r = await replayEmailEvent({
      event: { type: "email.delivered" },
      externalId: "ext-1",
      svixId: "evt-existing",
    })
    expect(r.ok).toBe(true)
  })
})
