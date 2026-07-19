function getContractSize(pair: string): number {
  const forexPairs = [
    "AUDCAD", "AUDCHF", "AUDJPY", "AUDNZD", "AUDUSD",
    "CADCHF", "CADJPY",
    "CHFJPY",
    "EURAUD", "EURCAD", "EURCHF", "EURGBP", "EURJPY", "EURNZD", "EURUSD",
    "GBPAUD", "GBPCAD", "GBPCHF", "GBPJPY", "GBPNZD", "GBPUSD",
    "NZDCAD", "NZDCHF", "NZDJPY", "NZDUSD",
    "USDCAD", "USDCHF", "USDJPY", "USDMXN", "USDCNH",
    "XAUUSD", "XAGUSD",
  ]
  if (forexPairs.includes(pair.toUpperCase())) return 100000
  if (["BTCUSD", "ETHUSD", "XRPUSD", "LTCUSD", "ADAUSD", "DOTUSD", "SOLUSD"].includes(pair.toUpperCase())) return 1
  return 1
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
