import { describe, it, expect } from "vitest"
import { computeScale, groupSeriesByUnit } from "./evolution-scale"
import type { EvolutionSeries } from "./evolution-chart"

const series = (key: string, unit: string, values: number[]): EvolutionSeries => ({
  key,
  label: key,
  color: "#000",
  unit,
  values,
})

describe("groupSeriesByUnit", () => {
  it("sépare les séries par unité (jamais une échelle partagée %/€)", () => {
    const groups = groupSeriesByUnit([
      series("pnlCum", "€", [0, 120]),
      series("winRate", "%", [40, 60]),
      series("confidence", "/5", [3, 4]),
    ])

    expect([...groups.keys()].sort()).toEqual(["%", "/5", "€"])
    expect(groups.get("€")).toHaveLength(1)
    expect(groups.get("%")?.[0].key).toBe("winRate")
  })

  it("regroupe les séries de même unité", () => {
    const groups = groupSeriesByUnit([
      series("a", "%", [1]),
      series("b", "%", [2]),
    ])
    expect(groups.get("%")).toHaveLength(2)
  })
})

describe("computeScale", () => {
  it("utilise les bornes réelles", () => {
    expect(computeScale([10, -5, 20])).toEqual({ min: -5, max: 20 })
  })

  it("ignore les valeurs non finies", () => {
    expect(computeScale([NaN, 3, Infinity, 7])).toEqual({ min: 3, max: 7 })
  })

  it("centre une série constante sans diviser par zéro", () => {
    const scale = computeScale([50, 50])
    expect(scale.min).toBeLessThan(50)
    expect(scale.max).toBeGreaterThan(50)
  })

  it("gère une série vide", () => {
    expect(computeScale([])).toEqual({ min: 0, max: 1 })
  })

  it("ne mélange pas des unités différentes : échelles distinctes", () => {
    const pnl = computeScale([0, 120])
    const rate = computeScale([40, 60])
    expect(pnl.max - pnl.min).toBe(120)
    expect(rate.max - rate.min).toBe(20)
  })
})
