"use client"

import { useState } from "react"
import { Trash2, Pencil, Tag } from "lucide-react"
import { cn } from "@nba/design-system"
import { toast } from "sonner"

interface Trade {
  id: string
  pair: string
  direction: string
  result: string
  entryPrice: string
  exitPrice: string
  stopLoss: string | null
  takeProfit: string | null
  lotSize: string
  pnl: string
  spread: string | null
  rrRatio: string | null
  mood: string | null
  confidence: number | null
  note: string | null
  tags: string[]
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
  const pnl = Number(trade.pnl) || 0
  const hasSL = trade.stopLoss && Number(trade.stopLoss) > 0
  const hasTP = trade.takeProfit && Number(trade.takeProfit) > 0

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
        <div className="min-w-0 space-y-1.5 flex-1">
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

          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
            <span>E {trade.entryPrice}</span>
            <span>S {trade.exitPrice}</span>
            {hasSL && <span className="text-rose-400/70">SL {trade.stopLoss}</span>}
            {hasTP && <span className="text-emerald-400/70">TP {trade.takeProfit}</span>}
            <span>Lot {trade.lotSize}</span>
            {trade.rrRatio && <span>R:R {trade.rrRatio}</span>}
            {Number(trade.spread) > 0 && <span>Spread {trade.spread}€</span>}
          </div>

          <div className="flex items-center gap-2 text-xs flex-wrap">
            {trade.signal && (
              <span className="text-primary/70 truncate max-w-[200px]" title={trade.signal.content}>
                📡 {trade.signal.content.slice(0, 60)}
              </span>
            )}
            {trade.mood && (
              <span className="flex items-center gap-1">
                {MOOD_EMOJI[trade.mood] ?? trade.mood}
                {trade.confidence ? (
                  <span className="text-[10px]">{'★'.repeat(trade.confidence)}{'☆'.repeat(5 - trade.confidence)}</span>
                ) : null}
              </span>
            )}
            {trade.tags && trade.tags.length > 0 && (
              <span className="flex items-center gap-1">
                {trade.tags.slice(0, 3).map(t => (
                  <span key={t} className="inline-flex items-center gap-0.5 rounded-full bg-primary/5 px-1.5 py-0.5 text-[10px] text-primary/70">
                    <Tag className="size-2.5" />
                    {t}
                  </span>
                ))}
                {trade.tags.length > 3 && <span className="text-[10px] text-muted-foreground/60">+{trade.tags.length - 3}</span>}
              </span>
            )}
            <span className="text-muted-foreground/60 ml-auto shrink-0">{formatDate(trade.tradedAt)}</span>
          </div>

          {trade.note && (
            <p className="text-xs text-muted-foreground italic line-clamp-2">{trade.note}</p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <button onClick={handleDelete} className="size-8 flex items-center justify-center rounded-lg text-muted-foreground/40 hover:text-rose-500 hover:bg-rose-500/10 transition-colors">
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
