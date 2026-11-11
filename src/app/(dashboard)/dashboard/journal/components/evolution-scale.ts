import type { EvolutionSeries } from "./evolution-chart"

export interface Scale {
  min: number
  max: number
}

/**
 * Échelle d'un panneau : uniquement les séries de **même unité**. Deux unités
 * différentes (%, €, /5) ne doivent jamais partager une échelle (cf. TECH-04).
 */
export function groupSeriesByUnit(series: EvolutionSeries[]): Map<string, EvolutionSeries[]> {
  const groups = new Map<string, EvolutionSeries[]>()
  for (const s of series) {
    const unit = s.unit ?? ""
    const list = groups.get(unit) ?? []
    list.push(s)
    groups.set(unit, list)
  }
  return groups
}

export function computeScale(points: number[]): Scale {
  let min = Infinity
  let max = -Infinity
  for (const v of points) {
    if (!Number.isFinite(v)) continue
    if (v < min) min = v
    if (v > max) max = v
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) return { min: 0, max: 1 }
  if (min === max) {
    // Série constante : on centre la valeur pour éviter une division par zéro.
    const pad = Math.abs(min) > 0 ? Math.abs(min) * 0.1 : 1
    return { min: min - pad, max: max + pad }
  }
  return { min, max }
}
