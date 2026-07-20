"use client"

import { useEffect, useState, useCallback } from "react"
import { Plus, Search, Loader2, BookOpen } from "lucide-react"
import { Button, Input, EmptyState } from "@nba/design-system"
import { TradeCard } from "./trade-card"

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
  const [search, setSearch] = useState("")
  const [availablePairs, setAvailablePairs] = useState<string[]>([])

  const fetchTrades = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("page", String(page))
      params.set("limit", "20")
      if (pairFilter) params.set("pair", pairFilter)
      if (resultFilter) params.set("result", resultFilter)
      if (search.trim()) params.set("search", search.trim())

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
  }, [page, pairFilter, resultFilter, search])

  useEffect(() => { fetchTrades() }, [fetchTrades])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Button onClick={() => onNewTrade()} size="sm" className="gap-1.5">
          <Plus className="size-4" /> Nouveau trade
        </Button>

        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher paire, note, tag..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-9 h-11 text-sm"
          />
        </div>

        {availablePairs.length > 0 && (
          <select
            value={pairFilter}
            onChange={(e) => { setPairFilter(e.target.value); setPage(1) }}
            className="rounded-lg border border-input bg-background px-3 py-2.5 text-xs min-h-[44px]"
          >
            <option value="">Toutes paires</option>
            {availablePairs.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        )}
        <select
          value={resultFilter}
          onChange={(e) => { setResultFilter(e.target.value); setPage(1) }}
          className="rounded-lg border border-input bg-background px-3 py-2.5 text-xs min-h-[44px]"
        >
          <option value="">Tous résultats</option>
          <option value="WIN">Gagnés</option>
          <option value="LOSS">Perdus</option>
          <option value="BREAKEVEN">Breakeven</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      ) : trades.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={search ? "Aucun résultat" : "Aucun trade"}
          description={search ? "Essaie d'autres termes de recherche." : "Enregistre ton premier trade pour suivre ta progression. Chaque trade est une opportunité d'apprendre."}
          action={search ? undefined : { label: "Premier trade", onClick: () => onNewTrade() }}
        />
      ) : (
        <div className="space-y-2">
          {trades.map((trade) => (
            <TradeCard key={trade.id} trade={trade} onDelete={fetchTrades} />
          ))}
        </div>
      )}

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
