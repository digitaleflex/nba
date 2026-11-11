"use client"

import { useState, useMemo, useEffect } from "react"
import { Button, Input, cn } from "@nba/design-system"
import { getContractSize, getContractInfo, calculateRR, KNOWN_PAIRS } from "@nba/lib/services/pnl"

export interface LotCalculatorResult {
  lot: number
  riskAmount: number
  slDistance: number
  rr: number | null
  lossIfSl: number
  gainIfTp: number
  /** Lot après clamp éventuel (min/max broker). */
  clamped: boolean
  /** Messages d'erreur / avertissement pour l'utilisateur. */
  issues: string[]
  /** L'entrée est-elle valide pour produire un résultat ? */
  valid: boolean
}

const MIN_LOT = 0.01
const MAX_LOT = 100

export function computeLot(params: {
  balance: number
  riskPct: number
  entry: number
  sl: number
  tp?: number | null
  direction: "BUY" | "SELL"
  contractSize: number
  contractKnown?: boolean
  /** Taux de conversion : unités de compte par unité de cotation (défaut 1). */
  conversionRate?: number
}): LotCalculatorResult {
  const {
    balance, riskPct, entry, sl, tp, direction, contractSize,
    contractKnown = true, conversionRate = 1,
  } = params

  const issues: string[] = []
  const validInputs =
    Number.isFinite(balance) && balance > 0 &&
    Number.isFinite(riskPct) && riskPct > 0 && riskPct <= 100 &&
    Number.isFinite(entry) && entry > 0 &&
    Number.isFinite(sl) && sl > 0 &&
    Number.isFinite(contractSize) && contractSize > 0 &&
    Number.isFinite(conversionRate) && conversionRate > 0

  if (!Number.isFinite(balance) || balance <= 0) issues.push("Solde invalide (doit être > 0).")
  if (!Number.isFinite(riskPct) || riskPct <= 0 || riskPct > 100) issues.push("Risque invalide (entre 0 et 100 %).")
  if (!Number.isFinite(entry) || entry <= 0) issues.push("Prix d'entrée invalide (doit être > 0).")
  if (!Number.isFinite(sl) || sl <= 0) issues.push("Stop loss invalide (doit être > 0).")
  if (!contractKnown) issues.push("Taille de contrat inconnue (fallback 1) — vérifie la paire avant de copier le lot.")

  const slDistance = Math.abs(entry - sl)
  if (entry > 0 && sl > 0 && slDistance === 0) {
    issues.push("SL = entrée : distance nulle, impossible de calculer le lot.")
  }

  const riskAmount = validInputs ? balance * riskPct / 100 : 0
  const rate = conversionRate > 0 ? conversionRate : 1
  const rawLot = slDistance > 0 && contractSize > 0
    ? riskAmount / (slDistance * contractSize * rate)
    : 0
  let lot = 0
  let clamped = false

  if (rawLot > 0) {
    lot = Math.floor((rawLot + 1e-9) * 100) / 100
    if (lot < MIN_LOT) {
      issues.push(`Lot calculé (${rawLot.toFixed(6)}) inférieur au minimum broker (${MIN_LOT}) — ajusté à ${MIN_LOT}.`)
      lot = MIN_LOT
      clamped = true
    }
  }
  if (lot > MAX_LOT) {
    issues.push(`Lot calculé (${lot.toFixed(2)}) supérieur au maximum autorisé (${MAX_LOT}) — ajusté à ${MAX_LOT}.`)
    lot = MAX_LOT
    clamped = true
  }

  const rr = entry && sl && slDistance > 0
    ? calculateRR({ entryPrice: entry, stopLoss: sl, takeProfit: tp ?? null, direction })
    : null
  const lossIfSl = lot > 0 && slDistance > 0
    ? Math.round(lot * slDistance * contractSize * rate * 100) / 100
    : 0
  const tpDistance = tp && entry ? Math.abs(tp - entry) : 0
  const gainIfTp = lot > 0 && tpDistance > 0
    ? Math.round(lot * tpDistance * contractSize * rate * 100) / 100
    : 0

  const valid = validInputs && slDistance > 0 && issues.filter(i => !i.startsWith("Taille de contrat") && !i.startsWith("Lot calculé")).length === 0

  return { lot, riskAmount, slDistance, rr, lossIfSl, gainIfTp, clamped, issues, valid }
}

interface LotCalculatorProps {
  entry?: number
  sl?: number
  tp?: number | null
  direction?: "BUY" | "SELL"
  pair?: string
  contractSize?: number
  currency?: string
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
  currency = "$",
  onApply,
  compact = false,
}: LotCalculatorProps) {
  const [balance, setBalance] = useState(() => {
    if (typeof window === "undefined") return "1000"
    return localStorage.getItem("nba-lot-balance") || "1000"
  })
  const [riskPct, setRiskPct] = useState(() => {
    if (typeof window === "undefined") return "1"
    return localStorage.getItem("nba-lot-risk") || "1"
  })

  useEffect(() => {
    if (typeof window === "undefined") return
    localStorage.setItem("nba-lot-balance", balance)
    localStorage.setItem("nba-lot-risk", riskPct)
  }, [balance, riskPct])

  const contractInfo = pair ? getContractInfo(pair) : { size: 100000, known: true, category: "forex" as const }
  const size = contractSize ?? contractInfo.size
  const result = useMemo(() => computeLot({
    balance: parseFloat(balance) || 0,
    riskPct: parseFloat(riskPct) || 0,
    entry, sl, tp, direction, contractSize: size,
    contractKnown: contractSize !== undefined ? true : contractInfo.known,
  }), [balance, riskPct, entry, sl, tp, direction, size, contractSize, contractInfo.known])

  if (!compact && result.riskAmount <= 0) {
    return (
      <div className="rounded-lg border border-dashed border-primary/20 bg-primary/5 p-3">
        <p className="text-[11px] font-medium text-primary mb-2">Calculateur de lot</p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-muted-foreground block">Solde ({currency})</label>
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

  return (
    <div className="rounded-lg border border-dashed border-primary/20 bg-primary/5 p-3 space-y-2">
      {!compact && <p className="text-[11px] font-medium text-primary">Calculateur de lot</p>}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-muted-foreground block">Solde ({currency})</label>
          <Input value={balance} onChange={(e) => setBalance(e.target.value)} className="h-8 text-xs font-mono" inputMode="decimal" />
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground block">Risk (%)</label>
          <Input value={riskPct} onChange={(e) => setRiskPct(e.target.value)} className="h-8 text-xs font-mono" inputMode="decimal" />
        </div>
      </div>
      {result.issues.length > 0 && (
        <div className="space-y-1">
          {result.issues.map((msg, i) => (
            <p key={i} className="text-[10px] text-amber-600 dark:text-amber-400 leading-snug">⚠ {msg}</p>
          ))}
        </div>
      )}
      <p className="text-[9px] text-muted-foreground">
        Taille de contrat : {size.toLocaleString("fr-FR")} · {contractInfo.known ? contractInfo.category : "inconnue"}
      </p>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded bg-background/60 p-1.5">
          <div className="text-[9px] uppercase text-muted-foreground">Risk</div>
          <div className="text-xs font-mono font-bold">{result.riskAmount.toFixed(2)}{currency}</div>
        </div>
        <div className="rounded bg-background/60 p-1.5">
          <div className="text-[9px] uppercase text-muted-foreground">Perte SL</div>
          <div className="text-xs font-mono font-bold text-rose-500">-{result.lossIfSl.toFixed(2)}{currency}</div>
        </div>
        <div className="rounded bg-background/60 p-1.5">
          <div className="text-[9px] uppercase text-muted-foreground">R:R</div>
          <div className="text-xs font-mono font-bold">{result.rr ?? "—"}</div>
        </div>
      </div>
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-muted-foreground">
          {result.gainIfTp > 0 ? <>Gain TP : <span className="text-emerald-500 font-mono">+{result.gainIfTp.toFixed(2)}{currency}</span> · </> : null}
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

export function LotCalculatorFull({
  initialPair = "EURUSD",
  initialDirection = "BUY",
  initialEntry,
  initialSl,
  initialTp,
}: {
  initialPair?: string
  initialDirection?: "BUY" | "SELL"
  initialEntry?: number
  initialSl?: number
  initialTp?: number | null
} = {}) {
  const [pair, setPair] = useState(initialPair)
  const [direction, setDirection] = useState<"BUY" | "SELL">(initialDirection)
  const [entry, setEntry] = useState(initialEntry ? String(initialEntry) : "")
  const [sl, setSl] = useState(initialSl ? String(initialSl) : "")
  const [tp, setTp] = useState(initialTp ? String(initialTp) : "")

  const entryN = parseFloat(entry) || 0
  const slN = parseFloat(sl) || 0
  const tpN = parseFloat(tp) || null

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Paire</label>
        <Input list="lot-pairs" value={pair} onChange={(e) => setPair(e.target.value.toUpperCase())} className="font-mono uppercase" placeholder="EURUSD / XAUUSD / V75" />
        <datalist id="lot-pairs">
          {KNOWN_PAIRS.map((p) => <option key={p} value={p} />)}
        </datalist>
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
