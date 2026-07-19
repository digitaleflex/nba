import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@nba/lib/db", () => ({
  prisma: {
    webhookDlq: {
      findMany: vi.fn(),
      count: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}))
vi.mock("@nba/lib/services/audit", () => ({
  logAuditEvent: vi.fn(async () => {}),
}))

import { enqueueDlq, listDlq, dlqStats, markDlqReplayed, abandonDlq } from "./webhook-dlq"
import { prisma } from "@nba/lib/db"
import { logAuditEvent } from "@nba/lib/services/audit"

describe("webhook-dlq service", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("enqueueDlq cree une nouvelle entree", async () => {
    ;(prisma.webhookDlq.findFirst as any).mockResolvedValue(null)
    ;(prisma.webhookDlq.create as any).mockResolvedValue({ id: "dlq-1" })
    const r = await enqueueDlq({
      eventType: "email.bounced",
      svixId: "evt-1",
      externalId: "ext-1",
      payload: { type: "email.bounced" },
      lastError: "boom",
    })
    expect(r).toEqual({ id: "dlq-1", deduped: false })
    expect(prisma.webhookDlq.create).toHaveBeenCalled()
  })

  it("enqueueDlq dedup sur svixId existant", async () => {
    ;(prisma.webhookDlq.findFirst as any).mockResolvedValue({ id: "dlq-existing" })
    const r = await enqueueDlq({
      eventType: "email.bounced",
      svixId: "evt-1",
      externalId: "ext-1",
      payload: {},
      lastError: "boom",
    })
    expect(r).toEqual({ id: "dlq-existing", deduped: true })
    expect(prisma.webhookDlq.create).not.toHaveBeenCalled()
  })

  it("listDlq avec status PENDING", async () => {
    ;(prisma.webhookDlq.findMany as any).mockResolvedValue([{ id: "d1" }])
    const r = await listDlq({ status: "PENDING" })
    expect(prisma.webhookDlq.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: "PENDING" } }),
    )
    expect(r).toEqual([{ id: "d1" }])
  })

  it("dlqStats agrege pending/replayed/abandoned + oldest", async () => {
    ;(prisma.webhookDlq.count as any).mockResolvedValueOnce(3).mockResolvedValueOnce(5).mockResolvedValueOnce(2)
    ;(prisma.webhookDlq.findFirst as any).mockResolvedValue({ createdAt: new Date("2026-01-01") })
    const r = await dlqStats()
    expect(r).toEqual({
      pending: 3,
      replayed: 5,
      abandoned: 2,
      oldestPendingAt: new Date("2026-01-01"),
    })
  })

  it("markDlqReplayed incremente attempts et set replayedAt si succes", async () => {
    ;(prisma.webhookDlq.update as any).mockResolvedValue({})
    await markDlqReplayed("d1", true)
    expect(prisma.webhookDlq.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "d1" },
        data: expect.objectContaining({ status: "REPLAYED", attempts: { increment: 1 } }),
      }),
    )
  })

  it("abandonDlq marque ABANDONED + audit", async () => {
    ;(prisma.webhookDlq.update as any).mockResolvedValue({})
    await abandonDlq("d1", "trop vieux")
    expect(prisma.webhookDlq.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "d1" },
        data: expect.objectContaining({ status: "ABANDONED" }),
      }),
    )
    expect(logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: "webhook.dlq.abandoned" }),
    )
  })
})
