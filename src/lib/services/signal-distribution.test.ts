import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("../db", () => ({
  prisma: {
    signal: { findUnique: vi.fn(), update: vi.fn() },
    user: { findMany: vi.fn() },
    notification: { create: vi.fn() },
    notificationDelivery: { create: vi.fn() },
  },
}))
vi.mock("../email", () => ({
  tradingSignalEmail: vi.fn(() => ({ subject: "Sujet signal", html: "<p>contenu</p>" })),
}))
vi.mock("./audit", () => ({
  logAuditEvent: vi.fn(async () => {}),
}))

import { distributeSignal } from "./signal-distribution"
import { prisma } from "../db"

const SENDER = "sender-id"

function publishedSignal(overrides: any = {}) {
  return {
    id: "sig-1",
    status: "PUBLISHED",
    createdBy: SENDER,
    content: "Acheter EURUSD",
    imageUrl: null,
    imageUrls: [],
    scheduledAt: null,
    audience: [{ planId: "plan-1", plan: { name: "Signals X Forex" } }],
    ...overrides,
  }
}

describe("distributeSignal", () => {
  let publish: ReturnType<typeof vi.fn>
  let enqueueEmail: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    publish = vi.fn(async () => {})
    enqueueEmail = vi.fn(async () => {})
    ;(prisma.notification.create as any).mockImplementation(async (a: any) => ({
      id: "notif-" + Math.random().toString(36).slice(2),
      createdAt: new Date(),
      ...a.data,
    }))
    ;(prisma.notificationDelivery.create as any).mockImplementation(async (a: any) => ({
      id: "deliv-" + Math.random().toString(36).slice(2),
      ...a.data,
    }))
    ;(prisma.signal.update as any).mockResolvedValue({})
  })

  it("distribue aux membres approuvés actifs (hors expéditeur) et crée notification + livraison + push WS + email", async () => {
    const signal = publishedSignal()
    ;(prisma.signal.findUnique as any).mockResolvedValue(signal)
    ;(prisma.user.findMany as any).mockImplementation(async (args: any) => {
      let res = [
        { id: SENDER, email: "sender@x.com" }, // expéditeur => exclu
        { id: "m1", email: "m1@x.com" },
        { id: "m2", email: "m2@x.com" },
      ]
      const notId = args?.where?.id?.not
      if (notId) res = res.filter((m) => m.id !== notId)
      return res
    })

    const result = await distributeSignal("sig-1", { publish: publish as any, enqueueEmail: enqueueEmail as any })

    expect(result.skipped).toBeNull()
    expect(result.recipientCount).toBe(2)

    // 2 notifications créées (pas pour l'expéditeur)
    expect(prisma.notification.create).toHaveBeenCalledTimes(2)
    const notifUsers = (prisma.notification.create as any).mock.calls.map(
      (c: any) => c[0].data.userId,
    )
    expect(notifUsers).not.toContain(SENDER)
    expect(notifUsers).toEqual(expect.arrayContaining(["m1", "m2"]))

    // 2 push WS sur les bonnes channels
    expect(publish).toHaveBeenCalledTimes(2)
    const channels = publish.mock.calls.map((c: any) => c[0])
    expect(channels).toEqual(["nba:notif:user:m1", "nba:notif:user:m2"])

    // 2 livraisons email PENDING créées
    expect(prisma.notificationDelivery.create).toHaveBeenCalledTimes(2)
    const deliveries = (prisma.notificationDelivery.create as any).mock.calls.map(
      (c: any) => c[0].data,
    )
    expect(deliveries.every((d: any) => d.channel === "EMAIL" && d.status === "PENDING")).toBe(true)

    // 2 jobs email enqueue avec le bon destinataire
    expect(enqueueEmail).toHaveBeenCalledTimes(2)
    const emails = enqueueEmail.mock.calls.map((c: any) => c[1])
    expect(emails.map((e: any) => e.to).sort()).toEqual(["m1@x.com", "m2@x.com"])
    expect(emails.every((e: any) => e.subject === "Sujet signal")).toBe(true)
  })

  it("exclut l'expéditeur (pas d'echo de son propre signal)", async () => {
    ;(prisma.signal.findUnique as any).mockResolvedValue(publishedSignal())
    // seul l'expéditeur est membre approuvé
    ;(prisma.user.findMany as any).mockImplementation(async (args: any) => {
      let res = [{ id: SENDER, email: "sender@x.com" }]
      const notId = args?.where?.id?.not
      if (notId) res = res.filter((m) => m.id !== notId)
      return res
    })

    const result = await distributeSignal("sig-1", { publish: publish as any, enqueueEmail: enqueueEmail as any })

    expect(result.recipientCount).toBe(0)
    expect(prisma.notification.create).not.toHaveBeenCalled()
    expect(publish).not.toHaveBeenCalled()
    expect(enqueueEmail).not.toHaveBeenCalled()
  })

  it("ignore un signal non publié", async () => {
    ;(prisma.signal.findUnique as any).mockResolvedValue(publishedSignal({ status: "DRAFT" }))
    const result = await distributeSignal("sig-1", { publish: publish as any, enqueueEmail: enqueueEmail as any })
    expect(result.skipped).toBe("not_published")
    expect(prisma.user.findMany).not.toHaveBeenCalled()
  })

  it("ignore un signal sans audience", async () => {
    ;(prisma.signal.findUnique as any).mockResolvedValue(
      publishedSignal({ audience: [] }),
    )
    const result = await distributeSignal("sig-1", { publish: publish as any, enqueueEmail: enqueueEmail as any })
    expect(result.skipped).toBe("no_audience")
  })

  it("retourne not_found si le signal n'existe pas", async () => {
    ;(prisma.signal.findUnique as any).mockResolvedValue(null)
    const result = await distributeSignal("sig-1", { publish: publish as any, enqueueEmail: enqueueEmail as any })
    expect(result.skipped).toBe("not_found")
  })

  it("publie automatiquement un brouillon planifié dont l'heure est arrivée", async () => {
    const past = new Date(Date.now() - 60_000)
    ;(prisma.signal.findUnique as any).mockResolvedValue(
      publishedSignal({ status: "DRAFT", scheduledAt: past }),
    )
    ;(prisma.user.findMany as any).mockResolvedValue([{ id: "m1", email: "m1@x.com" }])

    const result = await distributeSignal("sig-1", { publish: publish as any, enqueueEmail: enqueueEmail as any })

    expect(prisma.signal.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "PUBLISHED" }) }),
    )
    expect(result.recipientCount).toBe(1)
  })
})
