import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@nba/lib/db", () => ({
  prisma: {
    notification: { findMany: vi.fn() },
    accessRequest: { findMany: vi.fn() },
  },
}))

const { getLatestEventMap, getResendStatusMap, classifyByEventType, classifyResendStatus } =
  vi.hoisted(() => ({
    getLatestEventMap: vi.fn(),
    getResendStatusMap: vi.fn(),
    classifyByEventType: vi.fn(),
    classifyResendStatus: vi.fn(),
  }))

vi.mock("@nba/lib/services/resend-delivery", () => ({
  getLatestEventMap,
  getResendStatusMap,
  classifyByEventType,
  classifyResendStatus,
}))

import { loadRecipients } from "./tracker-data"
import { prisma } from "@nba/lib/db"

function notification(overrides: {
  signalId: string
  userId: string
  email?: string
  name?: string
  read?: boolean
  emailStatus?: string | null
  externalId?: string | null
  pushStatus?: string | null
}) {
  const deliveries: any[] = []
  if (overrides.emailStatus !== null) {
    deliveries.push({
      channel: "EMAIL",
      status: overrides.emailStatus ?? "SENT",
      externalId: overrides.externalId ?? null,
    })
  }
  if (overrides.pushStatus) {
    deliveries.push({ channel: "PUSH", status: overrides.pushStatus, externalId: null })
  }
  return {
    isRead: overrides.read ?? false,
    userId: overrides.userId,
    data: { signalId: overrides.signalId },
    user: { id: overrides.userId, email: overrides.email ?? "u@example.com", name: overrides.name ?? "User" },
    deliveries,
  }
}

const SIGNALS = [
  { id: "sig-1", planIds: ["p1"], planNames: ["Gold"] },
  { id: "sig-2", planIds: ["p2"], planNames: ["Silver"] },
]

describe("loadRecipients", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getLatestEventMap.mockResolvedValue(new Map())
    getResendStatusMap.mockResolvedValue(new Map())
    classifyByEventType.mockImplementation((evt: string) =>
      evt === "email.opened" ? "opened" : "delivered",
    )
    classifyResendStatus.mockReturnValue("unknown")
    ;(prisma.accessRequest.findMany as any).mockResolvedValue([])
  })

  it("ne fait qu'une seule requête notifications pour tous les signaux", async () => {
    ;(prisma.notification.findMany as any).mockResolvedValue([])

    await loadRecipients(SIGNALS)

    expect(prisma.notification.findMany).toHaveBeenCalledTimes(1)
    const where = (prisma.notification.findMany as any).mock.calls[0][0].where
    expect(where.type).toBe("SIGNAL")
    expect(where.OR).toHaveLength(2)
    expect(where.OR[0]).toEqual({ data: { path: ["signalId"], equals: "sig-1" } })
  })

  it("ne requête pas les demandes d'accès sans destinataire", async () => {
    ;(prisma.notification.findMany as any).mockResolvedValue([])

    await loadRecipients(SIGNALS)

    expect(prisma.accessRequest.findMany).not.toHaveBeenCalled()
  })

  it("regroupe les destinataires par signal", async () => {
    ;(prisma.notification.findMany as any).mockResolvedValue([
      notification({ signalId: "sig-1", userId: "u1" }),
      notification({ signalId: "sig-2", userId: "u2" }),
      notification({ signalId: "sig-1", userId: "u3" }),
    ])

    const map = await loadRecipients(SIGNALS)

    expect(map.get("sig-1")?.map((u) => u.email)).toEqual(["u@example.com", "u@example.com"])
    expect(map.get("sig-2")).toHaveLength(1)
  })

  it("attribue le plan du signal quand l'accès est approuvé", async () => {
    ;(prisma.notification.findMany as any).mockResolvedValue([
      notification({ signalId: "sig-1", userId: "u1" }),
      notification({ signalId: "sig-1", userId: "u2" }),
      notification({ signalId: "sig-1", userId: "u3" }),
    ])
    ;(prisma.accessRequest.findMany as any).mockResolvedValue([
      { userId: "u1", planId: "p1", plan: { name: "Gold" } },
      { userId: "u2", planId: "p2", plan: { name: "Silver" } },
    ])

    const map = await loadRecipients(SIGNALS)
    const perUser = map.get("sig-1")!

    expect(perUser.map((u) => u.plan)).toEqual(["Gold", "Silver", "Gold"])
  })

  it("classe les statuts email et push", async () => {
    ;(prisma.notification.findMany as any).mockResolvedValue([
      notification({
        signalId: "sig-1",
        userId: "u1",
        externalId: "ex-1",
        pushStatus: "SENT",
        read: true,
      }),
      notification({ signalId: "sig-1", userId: "u2", emailStatus: "FAILED", pushStatus: "FAILED" }),
      notification({ signalId: "sig-1", userId: "u3", emailStatus: null }),
    ])
    getLatestEventMap.mockResolvedValue(new Map([["ex-1", "email.opened"]]))

    const map = await loadRecipients(SIGNALS)
    const perUser = map.get("sig-1")!

    expect(perUser[0]).toMatchObject({
      emailBucket: "opened",
      emailEvent: "email.opened",
      pushStatus: "envoyé",
      inAppRead: true,
    })
    expect(perUser[1]).toMatchObject({
      emailBucket: "failed",
      emailEvent: "échec d'envoi",
      pushStatus: "échoué",
    })
    expect(perUser[2]).toMatchObject({ emailBucket: "unknown", emailEvent: "pas d'email", pushStatus: null })
  })

  it("retourne une map vide sans signal", async () => {
    const map = await loadRecipients([])
    expect(map.size).toBe(0)
    expect(prisma.notification.findMany).not.toHaveBeenCalled()
  })
})
