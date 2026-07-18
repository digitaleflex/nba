"use client"

import { Trash2 } from "lucide-react"
import { cn } from "@nba/design-system"
import { toast } from "sonner"

interface Trade {
  id: string
  pair: string
  direction: string
  result: string
  entryPrice: string
  exitPrice: string
  lotSize: string
  pnl: string | null
  rrRatio: string | null
  mood: string | null
  confidence: number | null
  note: string | null
  tradedAt: string
  signal: { id: string; content: string; createdAt: string } | null
}

const RESULT_COLORS: Record<string, { dot: string; border: string; pnl: string }> = {
  WIN: { dot: "bg-emerald-500", border: "border-l-emerald-500", pnl: "text-emerald-400" },
  LOSS: { dot: "bg-rose-500", border: "border-l-rose-500", pnl: "text-rose-400" },
  BREAKEVEN: { dot: "bg-amber-500", border: "border-l-amber-500", pnl: "text-amber-400" },
}

const MOOD_EMOJI: Record<string, string> = {
  CONFIDENT: "😊", NEUTRAL: "😐", ANXIOUS: "😰", FEARFUL: "😨", GREEDY: "🤑", REVENGE: "😡",
}

function formatDate(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 86400000 && d.getDate() === now.getDate()) {
    return `Auj. ${d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`
  }
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }) + " " +
    d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
}

export function TradeCard({ trade, onDelete }: { trade: Trade; onDelete: () => void }) {
  const colors = RESULT_COLORS[trade.result] ?? RESULT_COLORS.BREAKEVEN
  const pnl = trade.pnl ? Number(trade.pnl) : 0

  async function handleDelete() {
    if (!confirm("Supprimer ce trade ?")) return
    try {
      await fetch(`/api/dashboard/journal/trades/${trade.id}`, { method: "DELETE" })
      toast.success("Trade supprimé")
      onDelete()
    } catch {
      toast.error("Erreur")
    }
  }

  return (
    <div className={cn(
      "rounded-lg border bg-card p-4 border-l-[3px] transition-colors hover:border-l-opacity-80",
      colors.border,
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 space-y-1.5">
          {/* Ligne 1 : résultat + paire + PnL */}
          <div className="flex items-center gap-2">
            <span className={cn("size-3 rounded-full shrink-0", colors.dot)} />
            <span className="text-sm font-semibold">
              {trade.result === "WIN" ? "Gagné" : trade.result === "LOSS" ? "Perdu" : "BE"}
            </span>
            <span className="text-xs text-muted-foreground">
              {trade.direction} {trade.pair}
            </span>
            <span className={cn("ml-auto text-sm font-mono font-bold tabular-nums shrink-0", colors.pnl)}>
              {pnl >= 0 ? "+" : ""}{pnl.toFixed(2)}€
            </span>
          </div>

          {/* Ligne 2 : prix + lot + R:R */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
            <span>Entrée {trade.entryPrice}</span>
            <span>Sortie {trade.exitPrice}</span>
            <span>Lot {trade.lotSize}</span>
            {trade.rrRatio && <span>R:R {trade.rrRatio}</span>}
          </div>

          {/* Ligne 3 : signal + mood + date */}
          <div className="flex items-center gap-3 text-xs flex-wrap">
            {trade.signal && (
              <span className="text-primary/70 truncate max-w-[200px]" title={trade.signal.content}>
                📡 {trade.signal.content.slice(0, 60)}
              </span>
            )}
            {trade.mood && (
              <span className="flex items-center gap-1">
                {MOOD_EMOJI[trade.mood] ?? trade.mood}
                {trade.confidence && (
                  <span className="text-[10px]">{'★'.repeat(trade.confidence)}{'☆'.repeat(5 - trade.confidence)}</span>
                )}
              </span>
            )}
            <span className="text-muted-foreground/60 ml-auto shrink-0">{formatDate(trade.tradedAt)}</span>
          </div>

          {/* Note */}
          {trade.note && (
            <p className="text-xs text-muted-foreground italic line-clamp-2">{trade.note}</p>
          )}
        </div>

        <button onClick={handleDelete} className="shrink-0 size-8 flex items-center justify-center rounded-lg text-muted-foreground/40 hover:text-rose-500 hover:bg-rose-500/10 transition-colors">
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </div>
  )
}
