import { describe, it, expect, vi, beforeEach } from "vitest"

const { prismaMock } = vi.hoisted(() => ({ prismaMock: {} as any }))

vi.mock("@nba/lib/db", () => ({
  prisma: new Proxy(
    {},
    {
      get: (_t, prop) => {
        if (!(prop in prismaMock)) {
          prismaMock[prop] = {
            count: vi.fn(),
            findFirst: vi.fn(),
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
          }
        }
        return prismaMock[prop]
      },
    },
  ),
}))

import { updateDisciplineStreak } from "./journal-discipline"

const USER_ID = "user-1"

function day(offsetDays: number): Date {
  const d = new Date("2026-07-20T12:00:00Z")
  d.setDate(d.getDate() + offsetDays)
  return d
}

describe("updateDisciplineStreak", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.trade = { count: vi.fn() }
    prismaMock.dailyReflection = { findFirst: vi.fn() }
    prismaMock.streak = { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() }
  })

  it("ne fait rien si aucun trade ou aucune réflexion (jour non discipliné)", async () => {
    prismaMock.trade.count.mockResolvedValue(0)
    prismaMock.dailyReflection.findFirst.mockResolvedValue(null)

    await updateDisciplineStreak(USER_ID, day(0))

    expect(prismaMock.streak.create).not.toHaveBeenCalled()
    expect(prismaMock.streak.update).not.toHaveBeenCalled()
  })

  it("crée un streak à 1 quand le jour est discipliné et qu'aucun streak n'existe", async () => {
    prismaMock.trade.count.mockResolvedValue(2)
    prismaMock.dailyReflection.findFirst.mockResolvedValue({ id: "r1" })
    prismaMock.streak.findUnique.mockResolvedValue(null)

    await updateDisciplineStreak(USER_ID, day(0))

    expect(prismaMock.streak.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: USER_ID, type: "DISCIPLINE_STREAK", count: 1, bestCount: 1 }),
      }),
    )
  })

  it("incrémente le streak de 1 si le jour précédent était discipliné (consécutif)", async () => {
    prismaMock.trade.count.mockResolvedValue(1)
    prismaMock.dailyReflection.findFirst.mockResolvedValue({ id: "r1" })
    prismaMock.streak.findUnique.mockResolvedValue({
      id: "s1",
      count: 3,
      bestCount: 5,
      lastDisciplineDay: day(-1),
    })

    await updateDisciplineStreak(USER_ID, day(0))

    expect(prismaMock.streak.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "s1" },
        data: expect.objectContaining({ count: 4, bestCount: 5 }),
      }),
    )
  })

  it("reset le streak à 1 si un jour non discipliné sépare les deux (trou > 1 jour)", async () => {
    prismaMock.trade.count.mockResolvedValue(1)
    prismaMock.dailyReflection.findFirst.mockResolvedValue({ id: "r1" })
    prismaMock.streak.findUnique.mockResolvedValue({
      id: "s1",
      count: 3,
      bestCount: 3,
      lastDisciplineDay: day(-3),
    })

    await updateDisciplineStreak(USER_ID, day(0))

    expect(prismaMock.streak.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "s1" },
        data: expect.objectContaining({ count: 1, bestCount: 3 }),
      }),
    )
  })
})
