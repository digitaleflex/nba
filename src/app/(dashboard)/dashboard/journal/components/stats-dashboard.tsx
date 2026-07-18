"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { Chart } from "@nba/design-system"
import type { ChartDatum } from "@nba/design-system"

interface Stats {
  winRate: number
  totalTrades: number
  wins: number
  losses: number
  breakevens: number
  totalPnl: number
  bestTrade: { pair: string; pnl: number; date: string } | null
  worstTrade: { pair: string; pnl: number; date: string } | null
  byPair: Array<{ pair: string; count: number; winRate: number; pnl: number }>
  byMood: Array<{ mood: string; count: number; winRate: number }>
  byDay: Array<{ date: string; count: number; wins: number; pnl: number }>
  streaks: { currentWinStreak: number; bestWinStreak: number; currentLossStreak: number; bestLossStreak: number }
}

const MOOD_EMOJI: Record<string, string> = {
  CONFIDENT: "😊", NEUTRAL: "😐", ANXIOUS: "😰", FEARFUL: "😨", GREEDY: "🤑", REVENGE: "😡",
}

const PERIODS = [
  { value: "all", label: "Tout" },
  { value: "30d", label: "30j" },
  { value: "7d", label: "7j" },
]

export function StatsDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState("all")

  useEffect(() => {
    setLoading(true)
    fetch(`/api/dashboard/journal/stats?period=${period}`)
      .then(r => r.json())
      .then(d => setStats(d))
      .finally(() => setLoading(false))
  }, [period])

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="size-6 animate-spin text-primary" /></div>
  if (!stats) return <p className="text-sm text-muted-foreground text-center py-16">Aucune donnée.</p>

  return (
    <div className="space-y-6">
      {/* Filtres période */}
      <div className="flex gap-1">
        {PERIODS.map(p => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              period === p.value ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:text-foreground"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI label="Win Rate" value={`${stats.winRate}%`} color="emerald" />
        <KPI label="Trades" value={String(stats.totalTrades)} sub={`${stats.wins}W ${stats.losses}L`} />
        <KPI label="PnL" value={`${stats.totalPnl >= 0 ? "+" : ""}${stats.totalPnl.toFixed(0)}€`} color={stats.totalPnl >= 0 ? "emerald" : "rose"} />
        <KPI label="Streak" value={`🔥 ${stats.streaks.currentWinStreak}`} sub={`Record: ${stats.streaks.bestWinStreak}`} />
      </div>

      {/* Graphique PnL cumulé */}
      {stats.byDay.length > 1 && (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="text-sm font-semibold mb-3">📈 PnL cumulé</h3>
          <Chart
            type="line"
            data={stats.byDay.slice().reverse().map(d => ({
              label: new Date(d.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
              value: d.pnl,
              color: d.pnl >= 0 ? "emerald" as const : "rose" as const,
            }))}
            height={180}
          />
        </div>
      )}

      {/* Barres Win/Loss par jour */}
      {stats.byDay.filter(d => d.count > 0).length > 0 && (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="text-sm font-semibold mb-3">📊 Win/Loss par jour</h3>
          <div className="grid grid-cols-2 gap-4">
            <Chart
              type="bar"
              data={stats.byDay.slice(0, 14).reverse().map(d => ({
                label: new Date(d.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
                value: d.wins,
                color: "emerald" as const,
              }))}
              height={140}
              emptyText="Pas de données"
            />
            <Chart
              type="bar"
              data={stats.byDay.slice(0, 14).reverse().map(d => ({
                label: new Date(d.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
                value: d.count - d.wins,
                color: "rose" as const,
              }))}
              height={140}
              emptyText="Pas de données"
            />
          </div>
        </div>
      )}

      {/* Par paire + Par mood */}
      <div className="grid md:grid-cols-2 gap-4">
        {stats.byPair.length > 0 && (
          <div className="rounded-lg border bg-card p-4">
            <h3 className="text-sm font-semibold mb-3">Par paire</h3>
            <div className="space-y-2">
              {stats.byPair.map(p => (
                <div key={p.pair} className="flex items-center gap-3 text-sm">
                  <span className="font-mono font-medium w-16">{p.pair}</span>
                  <div className="flex-1 h-2 rounded-full bg-muted/50 overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${p.winRate}%` }} />
                  </div>
                  <span className="w-10 text-right text-xs tabular-nums">{p.winRate}%</span>
                  <span className={`w-16 text-right text-xs font-mono tabular-nums ${p.pnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {p.pnl >= 0 ? "+" : ""}{p.pnl.toFixed(0)}€
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        {stats.byMood.length > 0 && (
          <div className="rounded-lg border bg-card p-4">
            <h3 className="text-sm font-semibold mb-3">Par émotion</h3>
            <div className="space-y-2">
              {stats.byMood.map(m => (
                <div key={m.mood} className="flex items-center gap-3 text-sm">
                  <span className="w-8">{MOOD_EMOJI[m.mood] ?? "—"}</span>
                  <div className="flex-1 h-2 rounded-full bg-muted/50 overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${Math.min(m.winRate, 100)}%` }} />
                  </div>
                  <span className="w-10 text-right text-xs tabular-nums">{m.winRate}%</span>
                  <span className="w-8 text-right text-xs text-muted-foreground">{m.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Meilleur / Pire trade */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        {stats.bestTrade && (
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
            <span className="text-xs text-muted-foreground">Meilleur trade</span>
            <p className="font-mono font-bold text-emerald-400">+{stats.bestTrade.pnl.toFixed(2)}€</p>
            <p className="text-xs text-muted-foreground">{stats.bestTrade.pair}</p>
          </div>
        )}
        {stats.worstTrade && (
          <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3">
            <span className="text-xs text-muted-foreground">Pire trade</span>
            <p className="font-mono font-bold text-rose-400">{stats.worstTrade.pnl.toFixed(2)}€</p>
            <p className="text-xs text-muted-foreground">{stats.worstTrade.pair}</p>
          </div>
        )}
      </div>
    </div>
  )
}

function KPI({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  const colorClass = color === "emerald" ? "text-emerald-400" : color === "rose" ? "text-rose-400" : "text-foreground"
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-2xl font-bold tracking-tight ${colorClass}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  )
}
