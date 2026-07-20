export type CoachSeverity = "tip" | "insight" | "warning" | "achievement"

export interface CoachMessage {
  id: string
  title: string
  body: string
  severity: CoachSeverity
  rule?: string
  category?: "psychology" | "risk" | "performance" | "streak" | "milestone"
  createdAt: Date
  expiresAt?: Date
}

export interface TradeEvent {
  pair: string
  direction: "BUY" | "SELL"
  result: "WIN" | "LOSS" | "BREAKEVEN"
  pnl: number
  lotSize: number
  spread: number | null
  stopLoss: number | null
  takeProfit: number | null
  mood: string | null
  confidence: number | null
  tags: string[]
  tradedAt: string
}
