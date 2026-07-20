"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { Chart } from "@nba/design-system"
import type { ChartDatum } from "@nba/design-system"
import { EvolutionChart, type EvolutionSeries } from "./evolution-chart"

interface EvolutionData {
  labels: string[]
  series: EvolutionSeries[]
}

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
  riskMetrics: {
    maxDrawdown: number
    expectancy: number
    profitFactor: number
    avgWinner: number
    avgLoser: number
    riskRewardRatio: number
  }
  evolution?: EvolutionData
}

const MOOD_EMOJI: Record<string, string> = {
  CONFIDENT: "😊", NEUTRAL: "😐", ANXIOUS: "😰", FEARFUL: "😨", GREEDY: "🤑", REVENGE: "😡",
}

const PERIODS = [
  { value: "all", label: "Tout" },
  { value: "30d", label: "30j" },
  { value: "7d", label: "7j" },
]

export function StatsDashboard({ refreshKey = 0 }: { refreshKey?: number }) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState("all")

  useEffect(() => {
    setLoading(true)
    fetch(`/api/dashboard/journal/stats?period=${period}`)
      .then(r => r.json())
      .then(d => setStats(d))
      .finally(() => setLoading(false))
  }, [period, refreshKey])

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="size-6 animate-spin text-primary" /></div>
  if (!stats) return <p className="text-sm text-muted-foreground text-center py-16">Aucune donnée.</p>

  return (
    <div className="space-y-6">
      {/* Évolution du trader (multi-paramètres) */}
      {stats.evolution && stats.evolution.labels.length > 0 && (
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">📈 Évolution du trader</h3>
            <span className="text-[10px] text-muted-foreground">mis à jour en temps réel</span>
          </div>
          <EvolutionChart labels={stats.evolution.labels} series={stats.evolution.series} height={220} />
        </div>
      )}

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

      {/* Métriques de risque */}
      <div className="rounded-lg border bg-card p-4">
        <h3 className="text-sm font-semibold mb-3">📐 Métriques de risque</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <RiskMetric label="Drawdown max" value={`${stats.riskMetrics.maxDrawdown.toFixed(0)}€`} tone={stats.riskMetrics.maxDrawdown > 0 ? "rose" : "neutral"} />
          <RiskMetric label="Expectancy" value={`${stats.riskMetrics.expectancy.toFixed(2)}R`} tone={stats.riskMetrics.expectancy >= 0 ? "emerald" : "rose"} />
          <RiskMetric label="Profit factor" value={stats.riskMetrics.profitFactor === Infinity ? "∞" : stats.riskMetrics.profitFactor.toFixed(2)} tone={stats.riskMetrics.profitFactor >= 1 ? "emerald" : "rose"} />
          <RiskMetric label="Gain moyen" value={`${stats.riskMetrics.avgWinner.toFixed(0)}€`} tone="emerald" />
          <RiskMetric label="Perte moyenne" value={`${stats.riskMetrics.avgLoser.toFixed(0)}€`} tone="rose" />
          <RiskMetric label="R:R moyen" value={`1:${stats.riskMetrics.riskRewardRatio.toFixed(2)}`} tone="neutral" />
        </div>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <div key={p.pair} className="flex items-center gap-2 sm:gap-3 text-sm">
                  <span className="font-mono font-medium w-14 sm:w-16 truncate text-xs sm:text-sm">{p.pair}</span>
                  <div className="flex-1 h-2 rounded-full bg-muted/50 overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${p.winRate}%` }} />
                  </div>
                  <span className="w-10 text-right text-xs tabular-nums shrink-0">{p.winRate}%</span>
                  <span className={`w-14 sm:w-16 text-right text-xs font-mono tabular-nums shrink-0 ${p.pnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
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

function RiskMetric({ label, value, tone }: { label: string; value: string; tone: "emerald" | "rose" | "neutral" }) {
  const toneClass = tone === "emerald" ? "text-emerald-400" : tone === "rose" ? "text-rose-400" : "text-foreground"
  return (
    <div className="rounded-lg border bg-background/50 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-lg font-bold font-mono ${toneClass}`}>{value}</p>
    </div>
  )
}
