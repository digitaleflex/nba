import { describe, it, expect, vi, beforeEach } from "vitest"

const count = vi.fn()
const groupBy = vi.fn()
const findMany = vi.fn()
vi.mock("@nba/lib/db", () => ({
  prisma: { user: { count: (...a: unknown[]) => count(...a), findMany: (...a: unknown[]) => findMany(...a) }, pushSubscription: { groupBy: (...a: unknown[]) => groupBy(...a) } },
}))

import { getPushReach, listMembersWithoutPush } from "./push-reach"

describe("getPushReach (#366)", () => {
  beforeEach(() => vi.clearAllMocks())

  it("calcule le taux de membres joignables et la ventilation par plateforme", async () => {
    count.mockResolvedValueOnce(10).mockResolvedValueOnce(4)
    groupBy.mockResolvedValue([
      { platform: "ios", _count: { _all: 2 } },
      { platform: "android", _count: { _all: 1 } },
      { platform: "desktop", _count: { _all: 1 } },
      { platform: null, _count: { _all: 3 } }, // anciens abonnements sans plateforme => bureau
    ])
    const r = await getPushReach()
    expect(r).toMatchObject({ reachable: 4, total: 10, rate: 40, byPlatform: { ios: 2, android: 1, desktop: 4 } })
  })

  it("renvoie 0 % sans membre (pas de division par zéro)", async () => {
    count.mockResolvedValue(0)
    groupBy.mockResolvedValue([])
    expect((await getPushReach()).rate).toBe(0)
  })

  it("liste les membres actifs sans appareil abonné", async () => {
    findMany.mockResolvedValue([{ id: "u1", name: "A", email: "a@x.test", createdAt: new Date() }])
    const rows = await listMembersWithoutPush(10)
    expect(rows).toHaveLength(1)
    expect(findMany.mock.calls[0][0].where).toMatchObject({ isActive: true, pushSubscriptions: { none: {} } })
  })
})
