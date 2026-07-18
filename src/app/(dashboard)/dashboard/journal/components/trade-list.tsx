"use client"

import { useEffect, useState, useCallback } from "react"
import { Plus, Filter, Loader2 } from "lucide-react"
import { Button } from "@nba/design-system"
import { TradeCard } from "./trade-card"

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

interface TradeListProps {
  onNewTrade: (signalId?: string) => void
}

export function TradeList({ onNewTrade }: TradeListProps) {
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [pairFilter, setPairFilter] = useState("")
  const [resultFilter, setResultFilter] = useState("")
  const [availablePairs, setAvailablePairs] = useState<string[]>([])

  const fetchTrades = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("page", String(page))
      params.set("limit", "20")
      if (pairFilter) params.set("pair", pairFilter)
      if (resultFilter) params.set("result", resultFilter)

      const res = await fetch(`/api/dashboard/journal/trades?${params}`)
      if (res.ok) {
        const data = await res.json()
        setTrades(data.trades ?? [])
        setTotalPages(data.pagination?.totalPages ?? 1)
        setAvailablePairs(data.filters?.pairs ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [page, pairFilter, resultFilter])

  useEffect(() => { fetchTrades() }, [fetchTrades])

  return (
    <div className="space-y-4">
      {/* Barre d'actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button onClick={() => onNewTrade()} size="sm" className="gap-1.5">
          <Plus className="size-4" /> Nouveau trade
        </Button>

        {/* Filtres rapides */}
        {availablePairs.length > 0 && (
          <select
            value={pairFilter}
            onChange={(e) => { setPairFilter(e.target.value); setPage(1) }}
            className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs"
          >
            <option value="">Toutes paires</option>
            {availablePairs.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        )}
        <select
          value={resultFilter}
          onChange={(e) => { setResultFilter(e.target.value); setPage(1) }}
          className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs"
        >
          <option value="">Tous résultats</option>
          <option value="WIN">Gagnés</option>
          <option value="LOSS">Perdus</option>
          <option value="BREAKEVEN">Breakeven</option>
        </select>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      ) : trades.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
          <div className="size-16 rounded-full bg-muted/30 flex items-center justify-center">
            <span className="text-3xl">📓</span>
          </div>
          <p className="text-sm font-medium">Aucun trade enregistré</p>
          <p className="text-xs max-w-xs">
            Ouvre un signal et clique sur "J'ai tradé ce signal" pour journaliser automatiquement.
          </p>
          <Button variant="outline" size="sm" onClick={() => onNewTrade()}>
            <Plus className="size-4 mr-1.5" /> Premier trade
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {trades.map((trade) => (
            <TradeCard key={trade.id} trade={trade} onDelete={fetchTrades} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
            ← Précédent
          </Button>
          <span className="text-xs text-muted-foreground">{page}/{totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
            Suivant →
          </Button>
        </div>
      )}
    </div>
  )
}
