"use client"

import { useEffect, useState } from "react"
import { Loader2, TrendingUp, TrendingDown, BarChart3, Star, Calendar, ArrowLeft, ChevronDown, ChevronUp, type LucideIcon } from "lucide-react"
import { Card, CardContent, Input, Page, PageHeader } from "@nba/design-system"

interface OverviewMember {
  id: string
  name: string | null
  email: string
  isActive: boolean
  totalTrades: number
  totalPnl: unknown
  winRate: number
  lastTradeAt: string | null
}

interface AdminTrade {
  id: string
  tradedAt: string
  pair: string
  direction: string
  result: string
  entryPrice: number | string
  exitPrice: number | string
  stopLoss: number | string | null
  takeProfit: number | string | null
  lotSize: number | string
  spread: number | string | null
  commission: number | string | null
  swap: number | string | null
  pnl: number | string
  rrRatio: number | null
  strategy: string | null
  setupType: string | null
  mood: string | null
  confidence: number | null
  tags: string[]
  note: string | null
}

interface Reflection {
  id: string
  date: string
  rating: number
  wins: number
  losses: number
  note: string | null
}

interface SessionInfo {
  id: string
  startedAt: string
  endedAt: string | null
  isActive: boolean
}

interface JournalData {
  user: { id: string; name: string; email: string; isActive: boolean }
  stats: { totalTrades: number; totalPnl: number | null; winRate: number }
  recentTrades: AdminTrade[]
  reflections: Reflection[]
  streaks: { type: string; bestCount: string; count: string }[]
  sessions: SessionInfo[]
}

const streakMap: Record<string, string> = { WIN_STREAK: "🔥 Gains", LOSS_STREAK: "💀 Pertes", DISCIPLINE_STREAK: "📋 Discipline" }

export default function CoachingPage() {
  // Vue d'ensemble : tous les membres actifs dans leur journal
  const [members, setMembers] = useState<OverviewMember[] | null>(null)
  const [loadingList, setLoadingList] = useState(true)
  const [listError, setListError] = useState(false)
  const [filter, setFilter] = useState("")

  // Détail d'un membre
  const [journal, setJournal] = useState<JournalData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [expandedTradeId, setExpandedTradeId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch("/api/admin/journal/overview")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => { if (!cancelled) setMembers(data.members || []) })
      .catch(() => { if (!cancelled) setListError(true) })
      .finally(() => { if (!cancelled) setLoadingList(false) })
    return () => { cancelled = true }
  }, [])

  async function openMember(userId: string) {
    setLoading(true)
    setError("")
    setExpandedTradeId(null)
    try {
      const res = await fetch(`/api/admin/journal/${userId}`)
      if (!res.ok) { setError("Erreur chargement journal"); return }
      const data = await res.json()
      data.recentTrades = data.recentTrades.slice(0, 10)
      setJournal(data)
    } catch { setError("Erreur de recherche") }
    finally { setLoading(false) }
  }

  // ─── Vue détail membre ───
  if (journal) {
    return (
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <button
          onClick={() => setJournal(null)}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <ArrowLeft className="size-3.5" /> Tous les membres
        </button>

        <div>
          <h1 className="text-xl font-bold tracking-tight">{journal.user.name || journal.user.email}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{journal.user.email}</p>
        </div>

        {error && <p className="text-xs text-rose-600">{error}</p>}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={BarChart3} label="Total trades" value={journal.stats.totalTrades} />
          <StatCard icon={journal.stats.totalPnl && journal.stats.totalPnl >= 0 ? TrendingUp : TrendingDown} label="PnL total" value={`${journal.stats.totalPnl ? Number(journal.stats.totalPnl).toFixed(2) : "0"} €`} color={journal.stats.totalPnl && journal.stats.totalPnl >= 0 ? "text-emerald-500" : "text-red-500"} />
          <StatCard icon={Star} label="Win rate" value={`${journal.stats.winRate}%`} />
          <StatCard icon={Calendar} label="Sessions" value={journal.sessions.length} />
        </div>

        {journal.streaks.length > 0 && (
          <Card><CardContent className="p-5 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Séries</h3>
            <div className="flex flex-wrap gap-4 text-sm">
              {journal.streaks.map(s => (
                <span key={s.type}>{streakMap[s.type] || s.type} : <strong>{s.count}</strong> (record {s.bestCount})</span>
              ))}
            </div>
          </CardContent></Card>
        )}

        <Card><CardContent className="p-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Derniers trades — cliquez pour le détail</h3>
          {journal.recentTrades.length === 0 ? <p className="text-sm text-muted-foreground py-4 text-center">Aucun trade</p> : (
            <table className="w-full text-xs text-left">
              <thead><tr className="border-b text-muted-foreground uppercase tracking-wider text-xs">
                <th className="px-2 py-2"></th><th className="px-2 py-2">Date</th><th className="px-2 py-2">Paire</th><th className="px-2 py-2">Direction</th><th className="px-2 py-2">Resultat</th><th className="px-2 py-2">PnL</th><th className="px-2 py-2">Setup</th><th className="px-2 py-2">Mood</th>
              </tr></thead>
              <tbody className="divide-y">
                {journal.recentTrades.map((t) => (
                  <TradeRow key={t.id} trade={t} expanded={expandedTradeId === t.id} onToggle={() => setExpandedTradeId(expandedTradeId === t.id ? null : t.id)} />
                ))}
              </tbody>
            </table>
          )}
        </CardContent></Card>

        {journal.reflections.length > 0 && (
          <Card><CardContent className="p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Reflexions quotidiennes</h3>
            <div className="space-y-2 max-h-80 overflow-y-auto" role="region" aria-label="Contenu défilant">
              {journal.reflections.map((r) => (
                <div key={r.id} className="rounded-lg border p-3 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{new Date(r.date).toLocaleDateString("fr-FR")}</span>
                    <span className="text-muted-foreground">Note: {r.rating}/10 · {r.wins}W/{r.losses}L</span>
                  </div>
                  {r.note && <p className="text-muted-foreground">{r.note}</p>}
                </div>
              ))}
            </div>
          </CardContent></Card>
        )}
      </div>
    )
  }

  // ─── Vue d'ensemble : liste des membres ───
  const filtered = (members ?? []).filter((m) =>
    !filter.trim()
    || m.email.toLowerCase().includes(filter.toLowerCase())
    || (m.name ?? "").toLowerCase().includes(filter.toLowerCase())
  )

  return (
    <Page maxWidth="6xl" className="p-6" gap={6}>
      <PageHeader
        title="Journaux des membres"
        description={members ? `${filtered.length} membre(s) avec au moins un trade` : ""}
        actions={
          <Input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filtrer par nom ou email..."
            className="h-9 max-w-xs text-xs"
          />
        }
      />

      {loadingList && (
        <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
      )}

      {!loadingList && listError && (
        <p className="text-xs text-rose-600 border border-rose-500/30 bg-rose-500/5 rounded-lg px-4 py-3">
          Erreur de chargement. Réessayer.
        </p>
      )}

      {!loadingList && !listError && filtered.length === 0 && (
        <p className="text-sm text-muted-foreground py-10 text-center">
          Aucun membre n&apos;a encore rempli son journal.
        </p>
      )}

      {!loadingList && !listError && filtered.length > 0 && (
        <Card><CardContent className="p-0">
          <table className="w-full text-xs text-left">
            <thead><tr className="border-b text-muted-foreground uppercase tracking-wider text-xs">
              <th className="px-4 py-3">Membre</th>
              <th className="px-2 py-3">Trades</th>
              <th className="px-2 py-3">PnL</th>
              <th className="px-2 py-3">Win rate</th>
              <th className="px-2 py-3">Dernier trade</th>
            </tr></thead>
            <tbody className="divide-y">
              {filtered.map((m) => (
                <tr
                  key={m.id}
                  onClick={() => openMember(m.id)}
                  className="hover:bg-accent/40 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3">
                    <p className="font-semibold">{m.name || "—"}</p>
                    <p className="text-xs text-muted-foreground">{m.email}{!m.isActive && " · suspendu"}</p>
                  </td>
                  <td className="px-2 py-3 font-mono">{m.totalTrades}</td>
                  <td className={`px-2 py-3 font-mono font-bold ${Number(m.totalPnl) >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                    {Number(m.totalPnl ?? 0).toFixed(2)} €
                  </td>
                  <td className="px-2 py-3 font-mono">{m.winRate}%</td>
                  <td className="px-2 py-3 text-muted-foreground">
                    {m.lastTradeAt ? new Date(m.lastTradeAt).toLocaleDateString("fr-FR") : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent></Card>
      )}

      {loading && (
        <div className="py-8 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
      )}
    </Page>
  )
}

function TradeRow({ trade: t, expanded, onToggle }: { trade: AdminTrade; expanded: boolean; onToggle: () => void }) {
  return (
    <>
      <tr onClick={onToggle} className="hover:bg-accent/30 cursor-pointer transition-colors">
        <td className="px-2 py-2 w-6 text-muted-foreground">
          {expanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
        </td>
        <td className="px-2 py-2 text-muted-foreground">{new Date(t.tradedAt).toLocaleDateString("fr-FR")}</td>
        <td className="px-2 py-2 font-medium">{t.pair}</td>
        <td className="px-2 py-2">{t.direction === "BUY" ? "📈" : "📉"}</td>
        <td className="px-2 py-2"><span className={`px-1.5 py-0.5 rounded text-xs font-bold ${t.result === "WIN" ? "bg-emerald-100 text-emerald-700" : t.result === "LOSS" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"}`}>{t.result}</span></td>
        <td className={`px-2 py-2 font-mono font-bold ${Number(t.pnl) >= 0 ? "text-emerald-500" : "text-red-500"}`}>{Number(t.pnl).toFixed(2)}</td>
        <td className="px-2 py-2 text-muted-foreground">{[t.strategy, t.setupType].filter(Boolean).join(" · ") || "—"}</td>
        <td className="px-2 py-2 text-muted-foreground">{t.mood || "—"}</td>
      </tr>
      {expanded && (
        <tr className="bg-muted/20">
          <td colSpan={8} className="px-4 py-4">
            <TradeDetails t={t} />
          </td>
        </tr>
      )}
    </>
  )
}

function TradeDetails({ t }: { t: AdminTrade }) {
  const num = (v: unknown) => (v === null || v === undefined ? "—" : Number(v).toString())
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2 text-xs">
      <Detail label="Entrée" value={num(t.entryPrice)} />
      <Detail label="Sortie" value={num(t.exitPrice)} />
      <Detail label="Stop-loss" value={num(t.stopLoss)} />
      <Detail label="Take-profit" value={num(t.takeProfit)} />
      <Detail label="Lots" value={num(t.lotSize)} />
      <Detail label="R:R" value={t.rrRatio != null ? `${t.rrRatio}:1` : "—"} />
      <Detail label="Spread" value={num(t.spread)} />
      <Detail label="Commission / swap" value={`${num(t.commission)} / ${num(t.swap)}`} />
      <Detail label="Confiance" value={t.confidence ? "★".repeat(t.confidence) + "☆".repeat(5 - t.confidence) : "—"} />
      {Array.isArray(t.tags) && t.tags.length > 0 && (
        <div className="col-span-2 md:col-span-3 flex flex-wrap items-center gap-1">
          <span className="text-muted-foreground">Tags :</span>
          {t.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-primary/10 text-primary px-1.5 py-0.5">{tag}</span>
          ))}
        </div>
      )}
      {t.note && (
        <div className="col-span-2 md:col-span-4">
          <p className="text-muted-foreground mb-0.5">Note du trader :</p>
          <p className="rounded-md border bg-background p-2 whitespace-pre-wrap">{t.note}</p>
        </div>
      )}
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-muted-foreground block">{label}</span>
      <span className="font-mono font-semibold">{value}</span>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }: { icon: LucideIcon; label: string; value: string | number; color?: string }) {
  return (
    <Card className="border-border bg-card/30">
      <CardContent className="p-4 flex items-center gap-3">
        <Icon className={`size-5 ${color || "text-muted-foreground"}`} />
        <div>
          <p className="text-xs uppercase font-bold text-muted-foreground tracking-wider">{label}</p>
          <p className={`text-lg font-bold ${color || "text-foreground"}`}>{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}
