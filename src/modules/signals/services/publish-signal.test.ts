import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@nba/lib/db", () => ({
  prisma: {
    signal: { findUnique: vi.fn(), update: vi.fn() },
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
vi.mock("../policies/signal-policy", () => ({
  SignalPolicy: { canPublish: vi.fn(async () => true) },
}))
vi.mock("@nba/lib/services/audit", () => ({
  logAuditEvent: vi.fn(async () => {}),
}))
vi.mock("@nba/lib/queue", () => ({
  signalDistributionQueue: { add: vi.fn(async () => ({})), getJob: vi.fn(async () => null) },
}))

import { publishSignal } from "./publish-signal"
import { prisma } from "@nba/lib/db"
import { SignalPolicy } from "../policies/signal-policy"
import { signalDistributionQueue } from "@nba/lib/queue"

describe("publishSignal", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(prisma.signal.update as any).mockResolvedValue({})
    ;(signalDistributionQueue.add as any).mockResolvedValue({})
  })

  it("publie et enqueue la distribution quand l'utilisateur a le droit", async () => {
    ;(prisma.signal.findUnique as any).mockResolvedValue({
      id: "sig-1",
      jobId: null,
      audience: [{ plan: { name: "Plan1" } }],
    })

    const result = await publishSignal("sig-1", "admin-1")

    expect(SignalPolicy.canPublish).toHaveBeenCalled()
    expect(prisma.signal.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "PUBLISHED" }) }),
    )
    expect(signalDistributionQueue.add).toHaveBeenCalledWith(
      "distribute-sig-1",
      { signalId: "sig-1" },
    )
    expect(result.queueFailed).toBe(false)
  })

  it("lève AuthError si l'utilisateur n'a pas le droit de publier", async () => {
    ;(prisma.signal.findUnique as any).mockResolvedValue({ id: "sig-1", jobId: null })
    ;(SignalPolicy.canPublish as any).mockResolvedValue(false)

    await expect(publishSignal("sig-1", "admin-1")).rejects.toMatchObject({ status: 403 })
    expect(signalDistributionQueue.add).not.toHaveBeenCalled()
  })

  it("lève une erreur si le signal n'existe pas", async () => {
    ;(prisma.signal.findUnique as any).mockResolvedValue(null)
    await expect(publishSignal("sig-1", "admin-1")).rejects.toThrow(/introuvable/i)
  })
})
