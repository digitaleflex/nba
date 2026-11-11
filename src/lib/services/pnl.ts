export interface ContractInfo {
  size: number
  known: boolean
  category: "forex" | "crypto" | "metal" | "deriv" | "unknown"
}

const FOREX_PAIRS = [
  "AUDCAD", "AUDCHF", "AUDJPY", "AUDNZD", "AUDUSD",
  "CADCHF", "CADJPY",
  "CHFJPY",
  "EURAUD", "EURCAD", "EURCHF", "EURGBP", "EURJPY", "EURNZD", "EURUSD",
  "GBPAUD", "GBPCAD", "GBPCHF", "GBPJPY", "GBPNZD", "GBPUSD",
  "NZDCAD", "NZDCHF", "NZDJPY", "NZDUSD",
  "USDCAD", "USDCHF", "USDJPY", "USDMXN", "USDCNH",
  "XAUUSD", "XAGUSD",
]

const CRYPTO_PAIRS = ["BTCUSD", "ETHUSD", "XRPUSD", "LTCUSD", "ADAUSD", "DOTUSD", "SOLUSD"]

// Synthétiques Deriv : la taille de contrat réelle dépend du symbole et du
// broker ; on ne la connaît pas ici, donc on marque `known: false` pour que
// l'UI affiche un avertissement visible (cf. TECH-09).
const DERIV_PAIRS = [
  "V75", "V100", "V25", "V50", "V10", "V75 1S", "V100 1S",
  "BOOM1000", "BOOM500", "BOOM300",
  "CRASH1000", "CRASH500", "CRASH300",
  "R_10", "R_25", "R_50", "R_75", "R_100",
  "1HZ10V", "1HZ25V", "1HZ50V", "1HZ75V", "1HZ100V",
]

export const KNOWN_PAIRS: string[] = [...FOREX_PAIRS, ...CRYPTO_PAIRS, ...DERIV_PAIRS]

export function getContractInfo(pair: string): ContractInfo {
  const p = pair.toUpperCase().replace(/\s+/g, "")
  if (CRYPTO_PAIRS.includes(p)) return { size: 1, known: true, category: "crypto" }
  if (DERIV_PAIRS.includes(p)) return { size: 1, known: false, category: "deriv" }
  if (FOREX_PAIRS.includes(p)) return { size: 100000, known: true, category: "forex" }
  return { size: 1, known: false, category: "unknown" }
}

export function getContractSize(pair: string): number {
  return getContractInfo(pair).size
}

export function calculatePnl(params: {
  pair: string
  entryPrice: number
  exitPrice: number
  lotSize: number
  direction: "BUY" | "SELL"
  result: "WIN" | "LOSS" | "BREAKEVEN"
  spread?: number
  commission?: number
  swap?: number
}): number {
  if (params.result === "BREAKEVEN") return 0

  const dir = params.direction === "BUY" ? 1 : -1
  const contractSize = getContractSize(params.pair)
  const grossPnl = (params.exitPrice - params.entryPrice) * params.lotSize * contractSize * dir
  const spread = params.spread ?? 0
  const commission = params.commission ?? 0
  const swap = params.swap ?? 0

  return Math.round((grossPnl - spread - commission - swap) * 100) / 100
}

export function calculateRR(params: {
  entryPrice: number
  stopLoss?: number | null
  takeProfit?: number | null
  direction: "BUY" | "SELL"
}): number | null {
  if (!params.stopLoss || !params.takeProfit) return null

  const dir = params.direction === "BUY" ? 1 : -1
  const risk = Math.abs(params.entryPrice - params.stopLoss)
  const reward = Math.abs(params.takeProfit - params.entryPrice)

  if (risk === 0) return null

  return Math.round((reward / risk) * 10) / 10
}
