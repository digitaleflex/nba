"use client"

import { useState, useMemo, useEffect } from "react"
import { X, ArrowUp, ArrowDown, Plus, Tag, FileText } from "lucide-react"
import { Button, Input, Dialog, DialogContent, DialogHeader, DialogTitle, cn } from "@nba/design-system"
import { toast } from "sonner"
import { useFormDraft } from "@nba/hooks/use-form-draft"

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

interface TradeFormProps {
  signalId: string | null
  onClose: () => void
  onSaved: () => void
}

export function TradeForm({ signalId, onClose, onSaved }: TradeFormProps) {
  const [pair, setPair] = useState("")
  const [direction, setDirection] = useState<"BUY" | "SELL">("BUY")
  const [result, setResult] = useState<"WIN" | "LOSS" | "BREAKEVEN">("WIN")
  const [entryPrice, setEntryPrice] = useState("")
  const [exitPrice, setExitPrice] = useState("")
  const [stopLoss, setStopLoss] = useState("")
  const [takeProfit, setTakeProfit] = useState("")
  const [strategy, setStrategy] = useState<string>("")
  const [setupType, setSetupType] = useState<string>("")
  const [lotSize, setLotSize] = useState("0.01")
  const [spread, setSpread] = useState("")
  const [mood, setMood] = useState<string | null>(null)
  const [confidence, setConfidence] = useState(0)
  const [note, setNote] = useState("")
  const [tagInput, setTagInput] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  const { restore, clear, savedAt } = useFormDraft("trade", {
    pair, direction, result, entryPrice, exitPrice, stopLoss, takeProfit,
    strategy, setupType, lotSize, spread, mood, confidence, note, tags,
  })

  useEffect(() => {
    const draft = restore()
    if (draft) {
      if (typeof draft.pair === "string") setPair(draft.pair)
      if (draft.direction === "BUY" || draft.direction === "SELL") setDirection(draft.direction)
      if (draft.result === "WIN" || draft.result === "LOSS" || draft.result === "BREAKEVEN") setResult(draft.result)
      if (typeof draft.entryPrice === "string") setEntryPrice(draft.entryPrice)
      if (typeof draft.exitPrice === "string") setExitPrice(draft.exitPrice)
      if (typeof draft.stopLoss === "string") setStopLoss(draft.stopLoss)
      if (typeof draft.takeProfit === "string") setTakeProfit(draft.takeProfit)
      if (typeof draft.strategy === "string") setStrategy(draft.strategy)
      if (typeof draft.setupType === "string") setSetupType(draft.setupType)
      if (typeof draft.lotSize === "string") setLotSize(draft.lotSize)
      if (typeof draft.spread === "string") setSpread(draft.spread)
      if (typeof draft.mood === "string") setMood(draft.mood)
      if (typeof draft.confidence === "number") setConfidence(draft.confidence)
      if (typeof draft.note === "string") setNote(draft.note)
      if (Array.isArray(draft.tags)) setTags(draft.tags)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const entry = parseFloat(entryPrice) || 0
  const exit = parseFloat(exitPrice) || 0
  const lot = parseFloat(lotSize) || 0
  const spreadVal = parseFloat(spread) || 0
  const dir = direction === "BUY" ? 1 : -1
  const contractSize = getContractSize(pair)

  const pnl = useMemo(() => {
    if (result === "BREAKEVEN" || !entry || !exit || !lot) return 0
    return Math.round(((exit - entry) * lot * contractSize * dir - spreadVal) * 100) / 100
  }, [entry, exit, lot, contractSize, dir, spreadVal, result])

  const rr = useMemo(() => {
    const sl = parseFloat(stopLoss)
    const tp = parseFloat(takeProfit)
    if (!sl || !tp || !entry) return null
    const risk = Math.abs(entry - sl)
    const reward = Math.abs(tp - entry)
    return risk > 0 ? Math.round((reward / risk) * 10) / 10 : null
  }, [entry, stopLoss, takeProfit])

  const disablePrice = result === "BREAKEVEN"

  function addTag() {
    const t = tagInput.trim().toUpperCase()
    if (t && !tags.includes(t) && tags.length < 10) {
      setTags([...tags, t])
      setTagInput("")
    }
  }

  function removeTag(t: string) {
    setTags(tags.filter(x => x !== t))
  }

  async function handleSubmit() {
    if (!pair.trim()) return toast.error("La paire est requise")
    if (!entry && !disablePrice) return toast.error("Prix d'entrée requis")
    if (!exit && !disablePrice) return toast.error("Prix de sortie requis")
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
          entryPrice: entry,
          exitPrice: exit,
          stopLoss: parseFloat(stopLoss) || undefined,
          takeProfit: parseFloat(takeProfit) || undefined,
          strategy: strategy || undefined,
          setupType: setupType || undefined,
          lotSize: lot,
          spread: spreadVal || undefined,
          mood: mood || undefined,
          confidence: confidence || undefined,
          note: note || undefined,
          tags: tags.length > 0 ? tags : undefined,
        }),
      })
      if (!res.ok) throw new Error("Erreur")
      clear()
      toast.success("Trade enregistré")
      onSaved()
    } catch {
      toast.error("Impossible d'enregistrer le trade")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {signalId ? "Trade depuis un signal" : "Nouveau trade"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Paire</label>
            <Input
              placeholder="EURUSD"
              value={pair}
              onChange={(e) => setPair(e.target.value.toUpperCase())}
              className="font-mono uppercase"
              maxLength={20}
            />
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
                  onClick={() => setResult(r)}
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
          </div>

          <div className={`grid grid-cols-2 gap-3 ${disablePrice ? "opacity-40 pointer-events-none" : ""}`}>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Prix entrée</label>
              <Input
                placeholder="1.08500"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                className="font-mono"
                inputMode="decimal"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Prix sortie</label>
              <Input
                placeholder="1.09000"
                value={exitPrice}
                onChange={(e) => setExitPrice(e.target.value)}
                className="font-mono"
                inputMode="decimal"
              />
            </div>
          </div>

          {result !== "BREAKEVEN" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Stop Loss</label>
                <Input
                  placeholder="1.08200"
                  value={stopLoss}
                  onChange={(e) => setStopLoss(e.target.value)}
                  className="font-mono"
                  inputMode="decimal"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Take Profit</label>
                <Input
                  placeholder="1.09500"
                  value={takeProfit}
                  onChange={(e) => setTakeProfit(e.target.value)}
                  className="font-mono"
                  inputMode="decimal"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Stratégie</label>
              <select
                value={strategy}
                onChange={(e) => setStrategy(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
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
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Lot</label>
              <Input
                value={lotSize}
                onChange={(e) => setLotSize(e.target.value)}
                className="font-mono"
                inputMode="decimal"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Spread (coût)</label>
              <Input
                placeholder="0"
                value={spread}
                onChange={(e) => setSpread(e.target.value)}
                className="font-mono"
                inputMode="decimal"
              />
            </div>
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
                <span className="text-[10px] text-muted-foreground uppercase">R:R</span>
                <span className="text-sm font-mono font-bold">{rr ?? "—"}</span>
              </div>
              <div className="flex flex-col items-center justify-center rounded-lg bg-muted/30 p-2">
                <span className="text-[10px] text-muted-foreground uppercase">Contract</span>
                <span className="text-sm font-mono font-bold">{contractSize.toLocaleString()}</span>
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Émotion</label>
            <div className="flex gap-1 justify-between">
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
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Confiance</label>
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
            <div className="flex gap-1">
              <Input
                placeholder="Ajouter un tag"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag() } }}
                className="font-mono text-xs flex-1"
                maxLength={30}
              />
              <Button size="icon" variant="outline" onClick={addTag} disabled={!tagInput.trim()}>
                <Plus className="size-4" />
              </Button>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Note (optionnel)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Tes observations..."
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground resize-none h-16"
              maxLength={500}
            />
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
      </DialogContent>
    </Dialog>
  )
}
