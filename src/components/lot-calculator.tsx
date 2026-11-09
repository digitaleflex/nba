"use client"

import { useState, useMemo } from "react"
import { Button, Input, cn } from "@nba/design-system"
import { getContractSize, calculateRR } from "@nba/lib/services/pnl"

export interface LotCalculatorResult {
  lot: number
  riskAmount: number
  slDistance: number
  rr: number | null
  lossIfSl: number
  gainIfTp: number
}

export function computeLot(params: {
  balance: number
  riskPct: number
  entry: number
  sl: number
  tp?: number | null
  direction: "BUY" | "SELL"
  contractSize: number
}): LotCalculatorResult {
  const { balance, riskPct, entry, sl, tp, direction, contractSize } = params
  const riskAmount = balance * riskPct / 100
  const slDistance = Math.abs(entry - sl)
  const lot = slDistance > 0 && contractSize > 0
    ? Math.floor((riskAmount / (slDistance * contractSize)) * 100) / 100
    : 0
  const rr = entry && sl
    ? calculateRR({ entryPrice: entry, stopLoss: sl, takeProfit: tp ?? null, direction })
    : null
  const lossIfSl = lot > 0 && slDistance > 0 ? Math.round(lot * slDistance * contractSize * 100) / 100 : 0
  const tpDistance = tp && entry ? Math.abs(tp - entry) : 0
  const gainIfTp = lot > 0 && tpDistance > 0 ? Math.round(lot * tpDistance * contractSize * 100) / 100 : 0
  return { lot, riskAmount, slDistance, rr, lossIfSl, gainIfTp }
}

interface LotCalculatorProps {
  entry?: number
  sl?: number
  tp?: number | null
  direction?: "BUY" | "SELL"
  pair?: string
  contractSize?: number
  onApply?: (lot: string) => void
  compact?: boolean
}

export function LotCalculator({
  entry = 0,
  sl = 0,
  tp = null,
  direction = "BUY",
  pair = "",
  contractSize,
  onApply,
  compact = false,
}: LotCalculatorProps) {
  const [balance, setBalance] = useState("1000")
  const [riskPct, setRiskPct] = useState("1")

  const size = contractSize ?? (pair ? getContractSize(pair) : 100000)
  const result = useMemo(() => computeLot({
    balance: parseFloat(balance) || 0,
    riskPct: parseFloat(riskPct) || 0,
    entry, sl, tp, direction, contractSize: size,
  }), [balance, riskPct, entry, sl, tp, direction, size])

  if (!compact && result.riskAmount <= 0) {
    return (
      <div className="rounded-lg border border-dashed border-primary/20 bg-primary/5 p-3">
        <p className="text-[11px] font-medium text-primary mb-2">Calculateur de lot</p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-muted-foreground block">Solde ($)</label>
            <Input value={balance} onChange={(e) => setBalance(e.target.value)} className="h-8 text-xs font-mono" inputMode="decimal" />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground block">Risk (%)</label>
            <Input value={riskPct} onChange={(e) => setRiskPct(e.target.value)} className="h-8 text-xs font-mono" inputMode="decimal" />
          </div>
        </div>
      </div>
    )
  }

  if (result.lot <= 0) return null

  return (
    <div className="rounded-lg border border-dashed border-primary/20 bg-primary/5 p-3 space-y-2">
      {!compact && <p className="text-[11px] font-medium text-primary">Calculateur de lot</p>}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-muted-foreground block">Solde ($)</label>
          <Input value={balance} onChange={(e) => setBalance(e.target.value)} className="h-8 text-xs font-mono" inputMode="decimal" />
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground block">Risk (%)</label>
          <Input value={riskPct} onChange={(e) => setRiskPct(e.target.value)} className="h-8 text-xs font-mono" inputMode="decimal" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded bg-background/60 p-1.5">
          <div className="text-[9px] uppercase text-muted-foreground">Risk</div>
          <div className="text-xs font-mono font-bold">{result.riskAmount.toFixed(2)}€</div>
        </div>
        <div className="rounded bg-background/60 p-1.5">
          <div className="text-[9px] uppercase text-muted-foreground">Perte SL</div>
          <div className="text-xs font-mono font-bold text-rose-500">-{result.lossIfSl.toFixed(2)}€</div>
        </div>
        <div className="rounded bg-background/60 p-1.5">
          <div className="text-[9px] uppercase text-muted-foreground">R:R</div>
          <div className="text-xs font-mono font-bold">{result.rr ?? "—"}</div>
        </div>
      </div>
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-muted-foreground">
          {result.gainIfTp > 0 ? <>Gain TP : <span className="text-emerald-500 font-mono">+{result.gainIfTp.toFixed(2)}€</span> · </> : null}
          Lot suggéré
        </span>
        <span className="font-mono font-bold text-primary">→ {result.lot.toFixed(2)}</span>
      </div>
      {onApply && (
        <Button size="sm" variant="outline" className="w-full h-7 text-[11px]" onClick={() => onApply(result.lot.toFixed(2))}>
          Appliquer {result.lot.toFixed(2)} lots
        </Button>
      )}
    </div>
  )
}

export function LotCalculatorFull() {
  const [pair, setPair] = useState("EURUSD")
  const [direction, setDirection] = useState<"BUY" | "SELL">("BUY")
  const [entry, setEntry] = useState("")
  const [sl, setSl] = useState("")
  const [tp, setTp] = useState("")

  const entryN = parseFloat(entry) || 0
  const slN = parseFloat(sl) || 0
  const tpN = parseFloat(tp) || null

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Paire</label>
        <Input value={pair} onChange={(e) => setPair(e.target.value.toUpperCase())} className="font-mono uppercase" placeholder="EURUSD / XAUUSD / BTCUSD" />
      </div>
      <div className="flex gap-2">
        {(["BUY", "SELL"] as const).map((d) => (
          <button
            key={d}
            onClick={() => setDirection(d)}
            className={cn(
              "flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors",
              direction === d
                ? d === "BUY" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500" : "bg-rose-500/10 border-rose-500/30 text-rose-500"
                : "border-border text-muted-foreground"
            )}
          >
            {d}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Entrée</label>
          <Input value={entry} onChange={(e) => setEntry(e.target.value)} className="font-mono" inputMode="decimal" placeholder="1.08500" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Stop Loss</label>
          <Input value={sl} onChange={(e) => setSl(e.target.value)} className="font-mono" inputMode="decimal" placeholder="1.08200" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Take Profit (optionnel)</label>
          <Input value={tp} onChange={(e) => setTp(e.target.value)} className="font-mono" inputMode="decimal" placeholder="1.09500" />
        </div>
      </div>
      {entryN > 0 && slN > 0 ? (
        <LotCalculator entry={entryN} sl={slN} tp={tpN} direction={direction} pair={pair} />
      ) : (
        <p className="text-xs text-muted-foreground text-center py-4">Renseigne entrée + SL pour calculer le lot.</p>
      )}
    </div>
  )
}
