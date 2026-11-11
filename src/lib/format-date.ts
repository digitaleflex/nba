/**
 * Helpers de formatage de dates « jour » (YYYY-MM-DD) renvoyées par l'API
 * journal. `new Date("2026-01-05")` est interprété en UTC minuit : dans un
 * fuseau négatif (UTC-5), il s'affiche la veille. On force donc midi local
 * pour éviter le décalage d'un jour.
 */

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/

export function parseDay(day: string): Date {
  if (DAY_RE.test(day)) return new Date(`${day}T12:00:00`)
  return new Date(day)
}

export function formatDayLabel(day: string): string {
  const date = parseDay(day)
  if (Number.isNaN(date.getTime())) return day
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })
}
