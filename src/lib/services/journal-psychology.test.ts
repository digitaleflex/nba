import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@nba/lib/db", () => ({
  prisma: new Proxy(
    {},
    {
      get: (_t, prop) => {
        if (!(prop in prismaMock)) {
          prismaMock[prop] = {
            findMany: vi.fn(),
            findUnique: vi.fn(),
            count: vi.fn(),
            findFirst: vi.fn(),
          }
        }
        return prismaMock[prop]
      },
    },
  ),
}))

const { prismaMock } = vi.hoisted(() => ({ prismaMock: {} as any }))

vi.mock("@nba/lib/services/notifications", () => ({
  notify: vi.fn(),
}))

import { checkPsychology } from "./journal-psychology"
import { prisma } from "@nba/lib/db"
import { notify } from "@nba/lib/services/notifications"

const USER_ID = "user-1"

function setTime(hours: number, minutes: number) {
  const now = new Date()
  now.setHours(hours, minutes, 0, 0)
  vi.setSystemTime(now)
}

describe("checkPsychology", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    setTime(12, 0)
    prismaMock.trade = { findMany: vi.fn(), count: vi.fn() }
    prismaMock.streak = { findUnique: vi.fn() }
    prismaMock.notification = { findFirst: vi.fn() }
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("détecte le revenge trading (3 pertes en 60 min)", async () => {
    prismaMock.trade.findMany.mockResolvedValue([
      { id: "t1", result: "LOSS", tradedAt: new Date() },
      { id: "t2", result: "LOSS", tradedAt: new Date() },
      { id: "t3", result: "LOSS", tradedAt: new Date() },
    ])
    prismaMock.trade.count.mockResolvedValue(0)
    prismaMock.streak.findUnique.mockResolvedValue(null)
    prismaMock.notification.findFirst.mockResolvedValue(null)

    const alerts = await checkPsychology(USER_ID)

    expect(alerts.some((a) => a.rule === "revenge_trading")).toBe(true)
    expect(notify).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: USER_ID,
        type: "JOURNAL_PSYCHOLOGY",
        data: expect.objectContaining({ rules: ["revenge_trading"] }),
      }),
    )
  })

  it("détecte l'overtrading (10+ trades aujourd'hui)", async () => {
    prismaMock.trade.findMany.mockResolvedValue([])
    prismaMock.trade.count.mockResolvedValue(12)
    prismaMock.streak.findUnique.mockResolvedValue(null)
    prismaMock.notification.findFirst.mockResolvedValue(null)

    const alerts = await checkPsychology(USER_ID)

    expect(alerts.some((a) => a.rule === "overtrading")).toBe(true)
  })

  it("détecte l'overconfidence (5+ wins d'affilée)", async () => {
    prismaMock.trade.findMany.mockResolvedValue([])
    prismaMock.trade.count.mockResolvedValue(0)
    prismaMock.streak.findUnique.mockImplementation(async (args: any) => {
      if (args.where.userId_type.type === "WIN_STREAK") return { count: 5 }
      return null
    })
    prismaMock.notification.findFirst.mockResolvedValue(null)

    const alerts = await checkPsychology(USER_ID)

    expect(alerts.some((a) => a.rule === "overconfidence")).toBe(true)
    expect(alerts.find((a) => a.rule === "overconfidence")?.severity).toBe("info")
  })

  it("détecte la loss streak (3+ pertes d'affilée)", async () => {
    prismaMock.trade.findMany.mockResolvedValue([])
    prismaMock.trade.count.mockResolvedValue(0)
    prismaMock.streak.findUnique.mockImplementation(async (args: any) => {
      if (args.where.userId_type.type === "LOSS_STREAK") return { count: 3 }
      return null
    })
    prismaMock.notification.findFirst.mockResolvedValue(null)

    const alerts = await checkPsychology(USER_ID)

    expect(alerts.some((a) => a.rule === "loss_streak")).toBe(true)
  })

  it("suggère de fermer la session après 5 pertes d'affilée", async () => {
    prismaMock.trade.findMany.mockResolvedValue([])
    prismaMock.trade.count.mockResolvedValue(0)
    prismaMock.streak.findUnique.mockImplementation(async (args: any) => {
      if (args.where.userId_type.type === "LOSS_STREAK") return { count: 5 }
      return null
    })
    prismaMock.notification.findFirst.mockResolvedValue(null)

    const alerts = await checkPsychology(USER_ID)

    expect(alerts.some((a) => a.rule === "loss_streak")).toBe(true)
    expect(notify).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: USER_ID,
        type: "JOURNAL_PSYCHOLOGY",
        data: expect.objectContaining({ rule: "suggest_close_session" }),
      }),
    )
  })

  it("respecte le cooldown de 15 minutes par règle", async () => {
    prismaMock.trade.findMany.mockResolvedValue([
      { id: "t1", result: "LOSS", tradedAt: new Date() },
      { id: "t2", result: "LOSS", tradedAt: new Date() },
      { id: "t3", result: "LOSS", tradedAt: new Date() },
    ])
    prismaMock.trade.count.mockResolvedValue(0)
    prismaMock.streak.findUnique.mockResolvedValue(null)
    prismaMock.notification.findFirst.mockResolvedValue({
      id: "existing",
      data: { rules: ["revenge_trading"] },
    })

    const alerts = await checkPsychology(USER_ID)

    expect(alerts.some((a) => a.rule === "revenge_trading")).toBe(true)
    expect(notify).not.toHaveBeenCalled()
  })

  it("ne logue pas d'alerte si aucun pattern", async () => {
    prismaMock.trade.findMany.mockResolvedValue([])
    prismaMock.trade.count.mockResolvedValue(0)
    prismaMock.streak.findUnique.mockResolvedValue(null)

    const alerts = await checkPsychology(USER_ID)

    expect(alerts.length).toBe(0)
    expect(notify).not.toHaveBeenCalled()
  })
})
