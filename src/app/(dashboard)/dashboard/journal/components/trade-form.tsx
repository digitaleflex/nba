"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { X, ArrowUp, ArrowDown, Plus, Tag, FileText, AlertTriangle, HelpCircle } from "lucide-react"
import { Button, Input, Dialog, DialogContent, DialogHeader, DialogTitle, BottomSheet, BottomSheetContent, BottomSheetHeader, cn, useMediaQuery, Tooltip, TooltipTrigger, TooltipContent } from "@nba/design-system"
import { toast } from "sonner"
import { useFormDraft, getDraft } from "@nba/hooks/use-form-draft"

const MOODS = [
  { value: "CONFIDENT", emoji: "😊", label: "Confiant", color: "bg-emerald-500/20 hover:bg-emerald-500/30" },
  { value: "NEUTRAL", emoji: "😐", label: "Neutre", color: "bg-muted hover:bg-muted/80" },
  { value: "ANXIOUS", emoji: "😰", label: "Anxieux", color: "bg-amber-500/20 hover:bg-amber-500/30" },
  { value: "FEARFUL", emoji: "😨", label: "Peur", color: "bg-rose-500/20 hover:bg-rose-500/30" },
  { value: "GREEDY", emoji: "🤑", label: "Gourmand", color: "bg-purple-500/20 hover:bg-purple-500/30" },
  { value: "REVENGE", emoji: "😡", label: "Revenge", color: "bg-red-500/20 hover:bg-red-500/30" },
]

function getContractSize(pair: string): number {
  const forex = ["AUDCAD","AUDCHF","AUDJPY","AUDNZD","AUDUSD","CADCHF","CADJPY","CHFJPY","EURAUD","EURCAD","EURCHF","EURGBP","EURJPY","EURNZD","EURUSD","GBPAUD","GBPCAD","GBPCHF","GBPJPY","GBPNZD","GBPUSD","NZDCAD","NZDCHF","NZDJPY","NZDUSD","USDCAD","USDCHF","USDJPY","USDMXN","USDCNH","XAUUSD","XAGUSD"]
  return forex.includes(pair.toUpperCase()) ? 100000 : 1
}

interface FieldErrors {
  pair?: string
  entryPrice?: string
  exitPrice?: string
  stopLoss?: string
  takeProfit?: string
  lotSize?: string
  spread?: string
  result?: string
  general?: string
}

interface TradeFormProps {
  signalId: string | null
  onClose: () => void
  onSaved: () => void
}

export function TradeForm({ signalId, onClose, onSaved }: TradeFormProps) {
  const [pair, setPair] = useState(() => getDraft<{ pair: string }>("trade")?.pair ?? "")
  const [direction, setDirection] = useState<"BUY" | "SELL">(() => {
    const d = getDraft<{ direction: "BUY" | "SELL" }>("trade")
    return d?.direction === "SELL" ? "SELL" : "BUY"
  })
  const [result, setResult] = useState<"WIN" | "LOSS" | "BREAKEVEN">(() => {
    const d = getDraft<{ result: "WIN" | "LOSS" | "BREAKEVEN" }>("trade")
    return d?.result ?? "WIN"
  })
  const [entryPrice, setEntryPrice] = useState(() => getDraft<{ entryPrice: string }>("trade")?.entryPrice ?? "")
  const [exitPrice, setExitPrice] = useState(() => getDraft<{ exitPrice: string }>("trade")?.exitPrice ?? "")
  const [stopLoss, setStopLoss] = useState(() => getDraft<{ stopLoss: string }>("trade")?.stopLoss ?? "")
  const [takeProfit, setTakeProfit] = useState(() => getDraft<{ takeProfit: string }>("trade")?.takeProfit ?? "")
  const [strategy, setStrategy] = useState(() => getDraft<{ strategy: string }>("trade")?.strategy ?? "")
  const [setupType, setSetupType] = useState(() => getDraft<{ setupType: string }>("trade")?.setupType ?? "")
  const [lotSize, setLotSize] = useState(() => getDraft<{ lotSize: string }>("trade")?.lotSize ?? "0.01")
  const [spread, setSpread] = useState(() => getDraft<{ spread: string }>("trade")?.spread ?? "")
  const [commission, setCommission] = useState(() => getDraft<{ commission: string }>("trade")?.commission ?? "")
  const [swap, setSwap] = useState(() => getDraft<{ swap: string }>("trade")?.swap ?? "")
  const [tradedAt, setTradedAt] = useState(() => {
    const d = getDraft<{ tradedAt: string }>("trade")?.tradedAt
    if (d) return d
    const now = new Date()
    return now.toISOString().slice(0, 16)
  })
  const [mood, setMood] = useState<string | null>(() => getDraft<{ mood: string | null }>("trade")?.mood ?? null)
  const [confidence, setConfidence] = useState(() => getDraft<{ confidence: number }>("trade")?.confidence ?? 0)
  const [note, setNote] = useState(() => getDraft<{ note: string }>("trade")?.note ?? "")
  const [tagInput, setTagInput] = useState("")
  const [tags, setTags] = useState<string[]>(() => getDraft<{ tags: string[] }>("trade")?.tags ?? [])
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [showTagSuggestions, setShowTagSuggestions] = useState(false)
  const [availablePairs, setAvailablePairs] = useState<string[]>([])

  const isMobile = useMediaQuery("(max-width: 767px)")

  const { clear, savedAt } = useFormDraft("trade", {
    pair, direction, result, entryPrice, exitPrice, stopLoss, takeProfit,
    strategy, setupType, lotSize, spread, commission, swap, tradedAt, mood, confidence, note, tags,
  })

  useEffect(() => {
    fetch("/api/dashboard/journal/tags").then(r => r.ok ? r.json() : []).then(d => setAvailableTags(d.tags ?? [])).catch(() => {})
    fetch("/api/dashboard/journal/pairs").then(r => r.ok ? r.json() : []).then(d => setAvailablePairs(d.pairs?.map((p: { pair: string }) => p.pair) ?? [])).catch(() => {})
  }, [])

  const entry = parseFloat(entryPrice) || 0
  const exit = parseFloat(exitPrice) || 0
  const lot = parseFloat(lotSize) || 0
  const spreadVal = parseFloat(spread) || 0
  const commissionVal = parseFloat(commission) || 0
  const swapVal = parseFloat(swap) || 0
  const sl = parseFloat(stopLoss)
  const tp = parseFloat(takeProfit)
  const dir = direction === "BUY" ? 1 : -1
  const contractSize = getContractSize(pair)

  const pnl = useMemo(() => {
    if (result === "BREAKEVEN" || !entry || !exit || !lot) return 0
    return Math.round(((exit - entry) * lot * contractSize * dir - spreadVal - commissionVal - swapVal) * 100) / 100
  }, [entry, exit, lot, contractSize, dir, spreadVal, commissionVal, swapVal, result])

  const rr = useMemo(() => {
    if (!sl || !tp || !entry) return null
    const risk = Math.abs(entry - sl)
    const reward = Math.abs(tp - entry)
    return risk > 0 ? Math.round((reward / risk) * 10) / 10 : null
  }, [entry, sl, tp])

  const disablePrice = result === "BREAKEVEN"

  const validate = useCallback((): FieldErrors => {
    const e: FieldErrors = {}

    if (!pair.trim()) {
      e.pair = "La paire est requise"
    } else if (pair.trim().length > 20) {
      e.pair = "La paire est trop longue (max 20 caractères)"
    }

    if (!disablePrice) {
      if (!entry) {
        e.entryPrice = "Le prix d'entrée est requis"
      } else if (entry <= 0) {
        e.entryPrice = "Le prix d'entrée doit être positif"
      }
      if (!exit) {
        e.exitPrice = "Le prix de sortie est requis"
      } else if (exit <= 0) {
        e.exitPrice = "Le prix de sortie doit être positif"
      }
    }

    if (lot <= 0) {
      e.lotSize = "Le lot minimum est 0.01"
    } else if (lot > 100) {
      e.lotSize = "Le lot maximum est 100"
    }

    if (spreadVal < 0) {
      e.spread = "Le spread ne peut pas être négatif"
    }

    if (sl && entry && !disablePrice) {
      if (direction === "BUY" && sl >= entry) {
        e.stopLoss = "Le Stop Loss doit être inférieur au prix d'entrée en position ACHETER"
      } else if (direction === "SELL" && sl <= entry) {
        e.stopLoss = "Le Stop Loss doit être supérieur au prix d'entrée en position VENDRE"
      }
    }

    if (tp && entry && !disablePrice) {
      if (direction === "BUY" && tp <= entry) {
        e.takeProfit = "Le Take Profit doit être supérieur au prix d'entrée en position ACHETER"
      } else if (direction === "SELL" && tp >= entry) {
        e.takeProfit = "Le Take Profit doit être inférieur au prix d'entrée en position VENDRE"
      }
    }

    if (sl && tp && entry && !disablePrice) {
      if (direction === "BUY" && sl >= tp) {
        e.general = "Le Stop Loss doit être inférieur au Take Profit en position ACHETER"
      } else if (direction === "SELL" && sl <= tp) {
        e.general = "Le Stop Loss doit être supérieur au Take Profit en position VENDRE"
      }
    }

    if (result !== "BREAKEVEN" && entry && exit && pnl !== 0) {
      if (result === "WIN" && pnl < 0) {
        e.result = "Attention : le résultat est Gagné mais le PnL est négatif"
      } else if (result === "LOSS" && pnl > 0) {
        e.result = "Attention : le résultat est Perdu mais le PnL est positif"
      }
    }

    return e
  }, [pair, direction, entryPrice, exitPrice, stopLoss, takeProfit, lotSize, spread, result, pnl, disablePrice])

  useEffect(() => {
    if (Object.keys(touched).length > 0) {
      setErrors(validate())
    }
  }, [validate, touched])

  function markTouched(field: string) {
    setTouched(prev => ({ ...prev, [field]: true }))
  }

  function addTag() {
    const t = tagInput.trim().toUpperCase()
    if (t && !tags.includes(t) && tags.length < 10) {
      setTags([...tags, t])
      setTagInput("")
      setShowTagSuggestions(false)
    }
  }

  function removeTag(t: string) {
    setTags(tags.filter(x => x !== t))
  }

  function selectTagSuggestion(tag: string) {
    if (!tags.includes(tag) && tags.length < 10) {
      setTags([...tags, tag])
    }
    setTagInput("")
    setShowTagSuggestions(false)
  }

  async function handleSubmit() {
    setTouched({ pair: true, entryPrice: true, exitPrice: true, lotSize: true, spread: true, stopLoss: true, takeProfit: true, result: true })
    const validationErrors = validate()
    setErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) {
      if (validationErrors.general) {
        toast.error(validationErrors.general)
      }
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/dashboard/journal/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signalId,
          pair: pair.toUpperCase(),
          direction,
          result,
          entryPrice: entry || undefined,
          exitPrice: exit || undefined,
          stopLoss: sl || undefined,
          takeProfit: tp || undefined,
          strategy: strategy || undefined,
          setupType: setupType || undefined,
          lotSize: lot,
          spread: spreadVal || undefined,
          commission: commissionVal || undefined,
          swap: swapVal || undefined,
          tradedAt: tradedAt ? new Date(tradedAt).toISOString() : undefined,
          mood: mood || undefined,
          confidence: confidence || undefined,
          note: note || undefined,
          tags: tags.length > 0 ? tags : undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? "Erreur")
      }
      clear()
      toast.success("Trade enregistré")
      onSaved()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Impossible d'enregistrer le trade")
    } finally {
      setSaving(false)
    }
  }

  function selectPairSuggestion(pairValue: string) {
    setPair(pairValue)
    markTouched("pair")
  }

  const filteredTagSuggestions = availableTags.filter(t => tagInput && t.includes(tagInput.toUpperCase()) && !tags.includes(t)).slice(0, 8)

  const filteredPairSuggestions = availablePairs.filter(p => pair && p.toUpperCase().includes(pair.toUpperCase()) && p.toUpperCase() !== pair.toUpperCase()).slice(0, 5)

  function FieldError({ error }: { error?: string }) {
    if (!error) return null
    return (
      <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
        <AlertTriangle className="size-3 shrink-0" />
        {error}
      </p>
    )
  }

  const formContent = (
    <div className="space-y-4 mt-2">
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Paire</label>
        <div className="relative">
          <Input
            placeholder="EURUSD"
            value={pair}
            onChange={(e) => { setPair(e.target.value.toUpperCase()); markTouched("pair") }}
            onBlur={() => markTouched("pair")}
            className={cn("font-mono uppercase", errors.pair && touched.pair && "border-rose-500/50 focus-visible:ring-rose-500/20")}
            maxLength={20}
          />
          {filteredPairSuggestions.length > 0 && (
            <div className="absolute z-50 top-full mt-1 w-full rounded-lg border bg-card shadow-lg overflow-hidden">
              {filteredPairSuggestions.map(p => (
                <button key={p} onMouseDown={(e) => { e.preventDefault(); selectPairSuggestion(p) }} className="w-full px-3 py-2 text-left text-sm hover:bg-muted/50 flex items-center justify-between">
                  <span className="font-mono">{p}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <FieldError error={errors.pair} />
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Direction</label>
        <div className="flex gap-2">
          <button
            onClick={() => setDirection("BUY")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium border transition-colors",
              direction === "BUY" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500" : "border-border text-muted-foreground hover:border-emerald-500/30",
            )}
          >
            <ArrowUp className="size-4" /> BUY
          </button>
          <button
            onClick={() => setDirection("SELL")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium border transition-colors",
              direction === "SELL" ? "bg-rose-500/10 border-rose-500/30 text-rose-500" : "border-border text-muted-foreground hover:border-rose-500/30",
            )}
          >
            <ArrowDown className="size-4" /> SELL
          </button>
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Résultat</label>
        <div className="flex gap-2">
          {(["WIN", "LOSS", "BREAKEVEN"] as const).map((r) => (
            <button
              key={r}
              onClick={() => { setResult(r); markTouched("result") }}
              className={cn(
                "flex-1 py-2 rounded-lg text-sm font-medium border transition-colors",
                result === r
                  ? r === "WIN" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                    : r === "LOSS" ? "bg-rose-500/10 border-rose-500/30 text-rose-500"
                    : "bg-amber-500/10 border-amber-500/30 text-amber-500"
                  : "border-border text-muted-foreground hover:border-primary/30",
              )}
            >
              {r === "WIN" ? "Gagné" : r === "LOSS" ? "Perdu" : "BE"}
            </button>
          ))}
        </div>
        <FieldError error={errors.result} />
      </div>

      <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 ${disablePrice ? "opacity-40 pointer-events-none" : ""}`}>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Prix entrée</label>
          <Input
            placeholder="1.08500"
            value={entryPrice}
            onChange={(e) => { setEntryPrice(e.target.value); markTouched("entryPrice") }}
            onBlur={() => markTouched("entryPrice")}
            className={cn("font-mono", errors.entryPrice && touched.entryPrice && "border-rose-500/50 focus-visible:ring-rose-500/20")}
            inputMode="decimal"
          />
          <FieldError error={errors.entryPrice} />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Prix sortie</label>
          <Input
            placeholder="1.09000"
            value={exitPrice}
            onChange={(e) => { setExitPrice(e.target.value); markTouched("exitPrice") }}
            onBlur={() => markTouched("exitPrice")}
            className={cn("font-mono", errors.exitPrice && touched.exitPrice && "border-rose-500/50 focus-visible:ring-rose-500/20")}
            inputMode="decimal"
          />
          <FieldError error={errors.exitPrice} />
        </div>
      </div>

      {result !== "BREAKEVEN" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Stop Loss</label>
            <Input
              placeholder="1.08200"
              value={stopLoss}
              onChange={(e) => { setStopLoss(e.target.value); markTouched("stopLoss") }}
              onBlur={() => markTouched("stopLoss")}
              className={cn("font-mono", errors.stopLoss && touched.stopLoss && "border-rose-500/50 focus-visible:ring-rose-500/20")}
              inputMode="decimal"
            />
            <FieldError error={errors.stopLoss} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Take Profit</label>
            <Input
              placeholder="1.09500"
              value={takeProfit}
              onChange={(e) => { setTakeProfit(e.target.value); markTouched("takeProfit") }}
              onBlur={() => markTouched("takeProfit")}
              className={cn("font-mono", errors.takeProfit && touched.takeProfit && "border-rose-500/50 focus-visible:ring-rose-500/20")}
              inputMode="decimal"
            />
            <FieldError error={errors.takeProfit} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Stratégie</label>
          <select
            value={strategy}
            onChange={(e) => setStrategy(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm min-h-[44px]"
          >
            <option value="">—</option>
            <option value="SCALPING">Scalping</option>
            <option value="DAY_TRADING">Day trading</option>
            <option value="SWING">Swing</option>
            <option value="POSITION">Position</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Setup</label>
          <select
            value={setupType}
            onChange={(e) => setSetupType(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm min-h-[44px]"
          >
            <option value="">—</option>
            <option value="BREAKOUT">Breakout</option>
            <option value="PULLBACK">Pullback</option>
            <option value="REVERSAL">Reversal</option>
            <option value="RANGE">Range</option>
            <option value="TREND">Trend</option>
            <option value="OTHER">Autre</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
            Lot
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="size-3 cursor-help text-muted-foreground/50 hover:text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-48">Taille de votre position. 0.01 = micro lot (1000 unites).</TooltipContent>
            </Tooltip>
          </label>
          <Input
            value={lotSize}
            onChange={(e) => { setLotSize(e.target.value); markTouched("lotSize") }}
            onBlur={() => markTouched("lotSize")}
            className={cn("font-mono", errors.lotSize && touched.lotSize && "border-rose-500/50 focus-visible:ring-rose-500/20")}
            inputMode="decimal"
          />
          <FieldError error={errors.lotSize} />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
            Spread (coût)
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="size-3 cursor-help text-muted-foreground/50 hover:text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-48">Coût total du spread en pips ou en euros. Impact votre PnL final.</TooltipContent>
            </Tooltip>
          </label>
          <Input
            placeholder="0"
            value={spread}
            onChange={(e) => { setSpread(e.target.value); markTouched("spread") }}
            onBlur={() => markTouched("spread")}
            className={cn("font-mono", errors.spread && touched.spread && "border-rose-500/50 focus-visible:ring-rose-500/20")}
            inputMode="decimal"
          />
          <FieldError error={errors.spread} />
        </div>
      </div>

      {entry > 0 && sl > 0 && (
        <LotCalculator
          entry={entry}
          sl={sl}
          direction={direction}
          contractSize={contractSize}
          onApply={(lot) => setLotSize(lot)}
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            placeholder="0"
            value={commission}
            onChange={(e) => setCommission(e.target.value)}
            className="font-mono"
            inputMode="decimal"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Swap</label>
          <Input
            placeholder="0"
            value={swap}
            onChange={(e) => setSwap(e.target.value)}
            className="font-mono"
            inputMode="decimal"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Date du trade</label>
        <Input
          type="datetime-local"
          value={tradedAt}
          onChange={(e) => setTradedAt(e.target.value)}
          className="text-sm"
        />
      </div>

      {!disablePrice && (
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col items-center justify-center rounded-lg bg-muted/30 p-2">
            <span className="text-[10px] text-muted-foreground uppercase">PnL net</span>
            <span className={cn("text-sm font-mono font-bold", pnl >= 0 ? "text-emerald-400" : "text-rose-400")}>
              {pnl.toFixed(2)}€
            </span>
          </div>
          <div className="flex flex-col items-center justify-center rounded-lg bg-muted/30 p-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-[10px] text-muted-foreground uppercase cursor-help">R:R</span>
              </TooltipTrigger>
              <TooltipContent side="top">Risk/Reward : combien vous risquez vs combien vous esperez gagner.</TooltipContent>
            </Tooltip>
            <span className="text-sm font-mono font-bold">{rr ?? "—"}</span>
          </div>
          <div className="flex flex-col items-center justify-center rounded-lg bg-muted/30 p-2">
            <span className="text-[10px] text-muted-foreground uppercase">Contract</span>
            <span className="text-sm font-mono font-bold">{contractSize.toLocaleString()}</span>
          </div>
        </div>
      )}

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
          Émotion
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="size-3 cursor-help text-muted-foreground/50 hover:text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-48">L'émotion que vous ressentiez pendant le trade. L'honnêteté est la clé du progrès.</TooltipContent>
          </Tooltip>
        </label>
        <div className="flex gap-1 justify-between flex-wrap">
          {MOODS.map((m) => (
            <button
              key={m.value}
              onClick={() => setMood(mood === m.value ? null : m.value)}
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-lg transition-all",
                mood === m.value ? `${m.color} scale-110 ring-1 ring-border` : "hover:bg-muted/50",
              )}
            >
              <span className="text-xl">{m.emoji}</span>
              <span className="text-[9px] text-muted-foreground">{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
          Confiance
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="size-3 cursor-help text-muted-foreground/50 hover:text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-48">À quel point étiez-vous confiant ? Comparez avec le résultat pour apprendre.</TooltipContent>
          </Tooltip>
        </label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setConfidence(confidence === star ? 0 : star)}
              className={cn(
                "size-10 rounded-lg text-lg transition-colors",
                star <= confidence ? "text-amber-400" : "text-muted-foreground/30",
                "hover:text-amber-400",
              )}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Tags</label>
        <div className="flex gap-2 mb-2 flex-wrap">
          {tags.map(t => (
            <span key={t} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              <Tag className="size-3" />
              {t}
              <button onClick={() => removeTag(t)} className="hover:text-rose-400 ml-0.5">×</button>
            </span>
          ))}
        </div>
        <div className="relative">
          <div className="flex gap-1">
            <Input
              placeholder="Ajouter un tag"
              value={tagInput}
              onChange={(e) => { setTagInput(e.target.value.toUpperCase()); setShowTagSuggestions(true) }}
              onFocus={() => setShowTagSuggestions(true)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag() } }}
              className="font-mono text-xs flex-1"
              maxLength={30}
            />
            <Button size="icon" variant="outline" onClick={addTag} disabled={!tagInput.trim()}>
              <Plus className="size-4" />
            </Button>
          </div>
          {showTagSuggestions && filteredTagSuggestions.length > 0 && (
            <div className="absolute z-50 top-full mt-1 w-full rounded-lg border bg-card shadow-lg overflow-hidden">
              {filteredTagSuggestions.map(t => (
                <button key={t} onMouseDown={(e) => { e.preventDefault(); selectTagSuggestion(t) }} className="w-full px-3 py-2 text-left text-xs hover:bg-muted/50 flex items-center gap-2">
                  <Tag className="size-3 text-muted-foreground" />
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>
        {tags.length >= 10 && <p className="text-[11px] text-amber-400 mt-1">Maximum 10 tags atteint</p>}
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Note (optionnel)</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Tes observations..."
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground resize-none h-24"
          maxLength={500}
        />
        {note.length > 450 && <p className="text-[11px] text-muted-foreground mt-1">{note.length}/500</p>}
      </div>

      {savedAt && (
        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
          <FileText className="size-3" />
          Sauvegardé {new Date(savedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
        </p>
      )}
      <Button onClick={handleSubmit} disabled={saving} className="w-full">
        {saving ? "Enregistrement..." : "Enregistrer le trade"}
      </Button>
    </div>
  )

  if (isMobile) {
    return (
      <BottomSheet open onOpenChange={onClose}>
        <BottomSheetContent>
          <BottomSheetHeader
            title={signalId ? "Trade depuis un signal" : "Nouveau trade"}
            onClose={onClose}
          />
          {formContent}
        </BottomSheetContent>
      </BottomSheet>
    )
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {signalId ? "Trade depuis un signal" : "Nouveau trade"}
          </DialogTitle>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  )
}
