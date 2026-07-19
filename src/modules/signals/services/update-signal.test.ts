import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@nba/lib/db", () => ({
  prisma: {
    signal: { findUnique: vi.fn(), update: vi.fn() },
    signalVersion: { create: vi.fn() },
    $transaction: vi.fn(),
  },
}))
vi.mock("@nba/lib/auth-utils", () => ({
  AuthError: class AuthError extends Error {
    status: number
    constructor(msg: string, status = 403) {
      super(msg)
      this.status = status
    }
  },
}))
const { canUpdateSignal } = vi.hoisted(() => ({ canUpdateSignal: vi.fn() }))
vi.mock("../policies/signal-policy", () => ({ canUpdateSignal }))
vi.mock("@nba/lib/services/audit", () => ({
  logAuditEvent: vi.fn(async () => {}),
}))
vi.mock("@nba/lib/queue", () => ({
  signalDistributionQueue: { add: vi.fn(async () => ({ id: "job-1" })), getJob: vi.fn(async () => null) },
}))

import { updateSignal } from "./update-signal"
import { prisma } from "@nba/lib/db"
import { signalDistributionQueue } from "@nba/lib/queue"

const ADMIN_ID = "admin-1"
const PLAN_ID = "550e8400-e29b-41d4-a716-446655440000"

function baseSignal(overrides: any = {}) {
  return {
    id: "sig-1",
    content: "Ancien contenu",
    imageUrl: null,
    imageUrls: [],
    status: "DRAFT",
    currentVersion: 1,
    publishedAt: null,
    scheduledAt: null,
    jobId: null,
    audience: [{ planId: PLAN_ID }],
    ...overrides,
  }
}

describe("updateSignal", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    canUpdateSignal.mockResolvedValue(true)
    ;(prisma.$transaction as any).mockImplementation(async (fn: any) => {
      ;(prisma.signal.update as any).mockResolvedValue({
        id: "sig-1",
        content: "Nouveau contenu",
        audience: [{ planId: PLAN_ID, plan: { name: "Forex" } }],
      })
      ;(prisma.signalVersion.create as any).mockResolvedValue({})
      return await fn(prisma)
    })
  })

  it("publie un signal DRAFT et enqueue la distribution", async () => {
    ;(prisma.signal.findUnique as any).mockResolvedValue(baseSignal({ status: "DRAFT" }))

    const result = await updateSignal("sig-1", ADMIN_ID, { status: "PUBLISHED" })

    expect(result.queueFailed).toBe(false)
    expect(signalDistributionQueue.add).toHaveBeenCalledWith("distribute-sig-1", { signalId: "sig-1" })
  })

  it("incrémente la version uniquement si le contenu change", async () => {
    ;(prisma.signal.findUnique as any).mockResolvedValue(baseSignal())

    await updateSignal("sig-1", ADMIN_ID, { status: "PUBLISHED" })

    const data = (prisma.signal.update as any).mock.calls[0][0].data
    expect(data.currentVersion).toBeUndefined()
    expect(prisma.signalVersion.create).not.toHaveBeenCalled()
  })

  it("crée une nouvelle version si le contenu change", async () => {
    ;(prisma.signal.findUnique as any).mockResolvedValue(baseSignal())

    await updateSignal("sig-1", ADMIN_ID, { content: "Nouveau contenu" })

    const data = (prisma.signal.update as any).mock.calls[0][0].data
    expect(data.currentVersion).toBe(2)
    expect(prisma.signalVersion.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ version: 2, content: "Nouveau contenu" }),
      }),
    )
  })

  it("programme un signal futur et annule l'ancien job", async () => {
    ;(prisma.signal.findUnique as any).mockResolvedValue(baseSignal({ jobId: "old-job" }))
    const jobRemove = vi.fn()
    ;(signalDistributionQueue.getJob as any).mockResolvedValue({ remove: jobRemove })

    const future = new Date(Date.now() + 3600_000).toISOString()
    await updateSignal("sig-1", ADMIN_ID, { scheduledAt: future })

    expect(jobRemove).toHaveBeenCalled()
    expect(signalDistributionQueue.add).toHaveBeenCalledWith(
      "distribute-sig-1",
      { signalId: "sig-1" },
      expect.objectContaining({ delay: expect.any(Number) }),
    )
  })

  it("retourne queueFailed=true si BullMQ est indisponible", async () => {
    ;(prisma.signal.findUnique as any).mockResolvedValue(baseSignal({ status: "DRAFT" }))
    ;(signalDistributionQueue.add as any).mockRejectedValue(new Error("Redis down"))

    const result = await updateSignal("sig-1", ADMIN_ID, { status: "PUBLISHED" })

    expect(result.queueFailed).toBe(true)
  })

  it("lève AuthError si l'utilisateur n'a pas le droit", async () => {
    canUpdateSignal.mockResolvedValue(false)
    ;(prisma.signal.findUnique as any).mockResolvedValue(baseSignal())

    await expect(updateSignal("sig-1", ADMIN_ID, {})).rejects.toMatchObject({ status: 403 })
  })
})
