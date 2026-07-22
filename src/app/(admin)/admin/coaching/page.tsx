"use client"

import { useEffect, useState } from "react"
import { Loader2, Search, TrendingUp, TrendingDown, BarChart3, BookOpen, Star, Calendar } from "lucide-react"
import { Card, CardContent } from "@nba/design-system"

interface JournalData {
  user: { id: string; name: string; email: string; isActive: boolean }
  stats: { totalTrades: number; totalPnl: number | null; avgPnl: number | null; winRate: number }
  recentTrades: any[]
  reflections: any[]
  streaks: { type: string; count: number; bestCount: number }[]
  sessions: any[]
}

export default function CoachingPage() {
  const [searchEmail, setSearchEmail] = useState("")
  const [journal, setJournal] = useState<JournalData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function searchMember() {
    if (!searchEmail.trim()) return
    setLoading(true)
    setError("")
    setJournal(null)
    try {
      const search = await fetch(`/api/admin/members/search?email=${encodeURIComponent(searchEmail)}`)
      if (!search.ok) { setError("Membre introuvable"); setLoading(false); return }
      const { id } = await search.json()
      const res = await fetch(`/api/admin/journal/${id}`)
      if (!res.ok) { setError("Erreur chargement journal"); setLoading(false); return }
      const data = await res.json()
      const wins = data.recentTrades.filter((t: any) => t.result === "WIN").length
      data.stats.winRate = data.recentTrades.length > 0 ? Math.round((wins / data.recentTrades.length) * 100) : 0
      data.recentTrades = data.recentTrades.slice(0, 10)
      setJournal(data)
    } catch { setError("Erreur de recherche") }
    finally { setLoading(false) }
  }

  const streakMap: Record<string, string> = { WIN_STREAK: "🔥 Gains", LOSS_STREAK: "💀 Pertes", DISCIPLINE_STREAK: "📋 Discipline" }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Coaching</h1>
          <p className="text-xs text-muted-foreground mt-1">Analysez le journal de trading des membres</p>
        </div>
      </div>

      <div className="flex gap-2 max-w-md">
        <input className="flex-1 px-3 py-2 text-sm rounded-lg border bg-background" placeholder="Email du membre" value={searchEmail} onChange={e => setSearchEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && searchMember()} />
        <button onClick={searchMember} className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"><Search className="size-4" /></button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {loading && <div className="flex justify-center py-10"><Loader2 className="size-6 animate-spin" /></div>}

      {journal && (
        <div className="space-y-6">
          <Card><CardContent className="p-5">
            <p className="text-lg font-bold">{journal.user.name}</p>
            <p className="text-xs text-muted-foreground">{journal.user.email} · {journal.user.isActive ? "Actif" : "Suspendu"}</p>
          </CardContent></Card>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={BarChart3} label="Total trades" value={journal.stats.totalTrades} />
            <StatCard icon={journal.stats.totalPnl && journal.stats.totalPnl >= 0 ? TrendingUp : TrendingDown} label="PnL total" value={`${journal.stats.totalPnl ? Number(journal.stats.totalPnl).toFixed(2) : "0"} €`} color={journal.stats.totalPnl && journal.stats.totalPnl >= 0 ? "text-emerald-500" : "text-red-500"} />
            <StatCard icon={Star} label="Win rate" value={`${journal.stats.winRate}%`} />
            <StatCard icon={Calendar} label="Sessions" value={journal.sessions.length} />
          </div>

          {journal.streaks.length > 0 && (
            <Card><CardContent className="p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Series en cours</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {journal.streaks.map(s => (
                  <div key={s.type} className="rounded-lg border p-3 text-center">
                    <p className="text-lg font-bold text-foreground">{s.count}</p>
                    <p className="text-xs text-muted-foreground">{streakMap[s.type] || s.type}</p>
                    <p className="text-[10px] text-muted-foreground/60">Record: {s.bestCount}</p>
                  </div>
                ))}
              </div>
            </CardContent></Card>
          )}

          <Card><CardContent className="p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Derniers trades</h3>
            {journal.recentTrades.length === 0 ? <p className="text-sm text-muted-foreground py-4 text-center">Aucun trade</p> : (
              <table className="w-full text-xs text-left">
                <thead><tr className="border-b text-muted-foreground uppercase tracking-wider text-[10px]">
                  <th className="px-2 py-2">Date</th><th className="px-2 py-2">Paire</th><th className="px-2 py-2">Direction</th><th className="px-2 py-2">Resultat</th><th className="px-2 py-2">PnL</th><th className="px-2 py-2">Mood</th>
                </tr></thead>
                <tbody className="divide-y">
                  {journal.recentTrades.map((t: any) => (
                    <tr key={t.id} className="hover:bg-accent/30">
                      <td className="px-2 py-2 text-muted-foreground">{new Date(t.tradedAt).toLocaleDateString("fr-FR")}</td>
                      <td className="px-2 py-2 font-medium">{t.pair}</td>
                      <td className="px-2 py-2">{t.direction === "BUY" ? "📈" : "📉"}</td>
                      <td className="px-2 py-2"><span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${t.result === "WIN" ? "bg-emerald-100 text-emerald-700" : t.result === "LOSS" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"}`}>{t.result}</span></td>
                      <td className={`px-2 py-2 font-mono font-bold ${t.pnl >= 0 ? "text-emerald-500" : "text-red-500"}`}>{t.pnl.toFixed(2)}</td>
                      <td className="px-2 py-2 text-muted-foreground">{t.mood || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent></Card>

          {journal.reflections.length > 0 && (
            <Card><CardContent className="p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Reflexions quotidiennes</h3>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {journal.reflections.map((r: any) => (
                  <div key={r.id} className="rounded-lg border p-3 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{new Date(r.date).toLocaleDateString("fr-FR")}</span>
                      <span className="text-muted-foreground">Note: {r.rating}/10 · {r.wins}W/{r.losses}L</span>
                    </div>
                    {r.note && <p className="text-muted-foreground line-clamp-2">{r.note}</p>}
                  </div>
                ))}
              </div>
            </CardContent></Card>
          )}
        </div>
      )}
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color?: string }) {
  return (
    <Card className="border-border bg-card/30">
      <CardContent className="p-4 flex items-center gap-3">
        <Icon className={`size-5 ${color || "text-muted-foreground"}`} />
        <div>
          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{label}</p>
          <p className={`text-lg font-bold ${color || "text-foreground"}`}>{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}
