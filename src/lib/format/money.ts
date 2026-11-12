/**
 * Formateur monétaire robuste.
 *
 * `Intl.NumberFormat` lève une `RangeError` pour tout code devise invalide
 * (ex. l'ancienne valeur `"F CFA"` stockée en base). On normalise donc les
 * alias courants (dont `"F CFA"` → `"XOF"`) avant formatage, et on rattrape
 * toute erreur pour ne jamais faire planter l'interface.
 */

const CURRENCY_ALIASES: Record<string, string> = {
  "F CFA": "XOF",
  "FCFA": "XOF",
  "F.CFA": "XOF",
  "F CFA (XOF)": "XOF",
  "CFA": "XOF",
  "F XOF": "XOF",
  "XOF": "XOF",
}

function normalizeCurrency(currency: string): string {
  const key = String(currency ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase()
  return CURRENCY_ALIASES[key] ?? key
}

export function formatMoney(amount: number, currency: string): string {
  const code = normalizeCurrency(currency)
  try {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: code }).format(amount)
  } catch {
    return `${amount} ${currency}`.trim()
  }
}
