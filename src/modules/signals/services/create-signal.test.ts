import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@nba/lib/db", () => ({
  prisma: {
    signal: { create: vi.fn(), update: vi.fn() },
    signalVersion: { create: vi.fn() },
    $transaction: vi.fn(),
  },
}))
vi.mock("@nba/lib/auth-utils", () => ({
  requirePermission: vi.fn(),
}))
vi.mock("@nba/lib/services/audit", () => ({
  logAuditEvent: vi.fn(async () => {}),
}))
vi.mock("@nba/lib/queue", () => ({
  signalDistributionQueue: { add: vi.fn(async () => ({ id: "job-1" })) },
}))

import { createSignal } from "./create-signal"
import { prisma } from "@nba/lib/db"
import { requirePermission } from "@nba/lib/auth-utils"
import { signalDistributionQueue } from "@nba/lib/queue"

const ADMIN_ID = "admin-1"
const PLAN_ID = "550e8400-e29b-41d4-a716-446655440000"

describe("createSignal", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(requirePermission as any).mockResolvedValue({ user: { id: ADMIN_ID } })
    ;(prisma.$transaction as any).mockImplementation(async (fn: any) => {
      ;(prisma.signal.create as any).mockResolvedValue({
        id: "sig-1",
        content: "Acheter EURUSD",
        imageUrl: null,
        imageUrls: [],
        status: "PUBLISHED",
        audience: [{ planId: PLAN_ID, plan: { name: "Forex" } }],
      })
      ;(prisma.signalVersion.create as any).mockResolvedValue({})
      return await fn(prisma)
    })
  })

  it("crée un signal publié et enqueue la distribution", async () => {
    const result = await createSignal({
      content: "Acheter EURUSD",
      planIds: [PLAN_ID],
      status: "PUBLISHED",
    })

    expect(result.queueFailed).toBe(false)
    expect(prisma.signal.create).toHaveBeenCalled()
    expect(prisma.signalVersion.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ signalId: "sig-1", version: 1 }),
      }),
    )
    expect(signalDistributionQueue.add).toHaveBeenCalledWith(
      "distribute-sig-1",
      { signalId: "sig-1" },
    )
  })

  it("stocke suggestedStopLoss et suggestedTakeProfit", async () => {
    await createSignal({
      content: "Acheter EURUSD @ 1.08500",
      planIds: [PLAN_ID],
      status: "PUBLISHED",
      suggestedStopLoss: 1.08200,
      suggestedTakeProfit: 1.09000,
    })

    const data = (prisma.signal.create as any).mock.calls[0][0].data
    expect(data.suggestedStopLoss).toBe(1.08200)
    expect(data.suggestedTakeProfit).toBe(1.09000)
  })

  it("programme un signal futur en DRAFT avec job BullMQ", async () => {
    const future = new Date(Date.now() + 3600_000).toISOString()

    const result = await createSignal({
      content: "Signal planifié",
      planIds: [PLAN_ID],
      status: "PUBLISHED",
      scheduledAt: future,
    })

    expect(result.queueFailed).toBe(false)
    const data = (prisma.signal.create as any).mock.calls[0][0].data
    expect(data.status).toBe("DRAFT")
    expect(signalDistributionQueue.add).toHaveBeenCalledWith(
      "distribute-sig-1",
      { signalId: "sig-1" },
      expect.objectContaining({ delay: expect.any(Number) }),
    )
  })

  it("retourne queueFailed=true si BullMQ est indisponible", async () => {
    ;(signalDistributionQueue.add as any).mockRejectedValue(new Error("Redis down"))

    const result = await createSignal({
      content: "Acheter EURUSD",
      planIds: [PLAN_ID],
      status: "PUBLISHED",
    })

    expect(result.queueFailed).toBe(true)
  })
})
