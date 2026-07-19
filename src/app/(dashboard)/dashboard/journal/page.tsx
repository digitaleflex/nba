"use client"

import { useEffect, useState, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { BookOpen, TrendingUp, PenLine, Play, Square, Loader2, Clock } from "lucide-react"
import { cn, Button } from "@nba/design-system"
import { toast } from "sonner"

import { TradeList } from "./components/trade-list"
import { StatsDashboard } from "./components/stats-dashboard"
import { ReflectionsTab } from "./components/reflections-tab"
import { TradeForm } from "./components/trade-form"
import { useDetectTimezone } from "@nba/hooks/use-detect-timezone"

const TABS = [
  { id: "trades", label: "Trades", icon: BookOpen },
  { id: "stats", label: "Stats", icon: TrendingUp },
  { id: "reflections", label: "Réflexions", icon: PenLine },
] as const

type TabId = (typeof TABS)[number]["id"]

function SessionBanner() {
  const [session, setSession] = useState<{ id: string; tradeCount: number; elapsed: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/journal/sessions")
      if (res.ok) {
        const data = await res.json()
        if (data.active) {
          const elapsed = formatElapsed(data.active.startedAt)
          setSession({ id: data.active.id, tradeCount: data.active._count?.trades ?? 0, elapsed })
        } else {
          setSession(null)
        }
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchSession() }, [fetchSession])

  useEffect(() => {
    if (!session) return
    const interval = setInterval(() => {
      fetchSession()
    }, 60000)
    return () => clearInterval(interval)
  }, [session, fetchSession])

  async function startSession() {
    setStarting(true)
    try {
      const res = await fetch("/api/dashboard/journal/sessions", { method: "POST" })
      if (res.ok) {
        toast.success("Session démarrée")
        fetchSession()
      }
    } finally {
      setStarting(false)
    }
  }

  async function stopSession() {
    if (!session) return
    if (!confirm("Fermer la session ?")) return
    try {
      const res = await fetch(`/api/dashboard/journal/sessions/${session.id}`, { method: "POST" })
      if (res.ok) {
        const data = await res.json()
        toast.success(`Session fermée — ${data.summary.tradeCount} trades, ${data.summary.totalPnl?.toFixed(0)}€`)
        setSession(null)
      }
    } catch {
      toast.error("Erreur")
    }
  }

  function formatElapsed(startedAt: string) {
    const diff = Date.now() - new Date(startedAt).getTime()
    const h = Math.floor(diff / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    return `${h}h${String(m).padStart(2, "0")}`
  }

  if (loading) return null

  if (session) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-2.5">
        <span className="relative flex size-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex size-3 rounded-full bg-emerald-500" />
        </span>
        <div className="flex-1 text-sm">
          <span className="font-medium">Session active</span>
          <span className="text-muted-foreground ml-2">
            · <Clock className="inline size-3 mr-0.5" />
            {session.elapsed} · {session.tradeCount} trade{session.tradeCount > 1 ? "s" : ""}
          </span>
        </div>
        <Button size="sm" variant="outline" onClick={stopSession} className="gap-1.5 text-xs h-7">
          <Square className="size-3" /> Fermer
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-dashed px-4 py-2.5">
      <span className="size-3 rounded-full bg-muted-foreground/20" />
      <span className="flex-1 text-sm text-muted-foreground">Aucune session active</span>
      <Button size="sm" variant="outline" onClick={startSession} disabled={starting} className="gap-1.5 text-xs h-7">
        <Play className="size-3" /> {starting ? "..." : "Démarrer"}
      </Button>
    </div>
  )
}

export default function JournalPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  useDetectTimezone()
  const initialTab = (searchParams.get("tab") || "trades") as TabId

  const [activeTab, setActiveTab] = useState<TabId>(initialTab)
  const [formOpen, setFormOpen] = useState(false)
  const [signalId, setSignalId] = useState<string | null>(searchParams.get("signalId"))
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const tab = searchParams.get("tab") as TabId
    if (tab) setActiveTab(tab)
  }, [searchParams])

  const switchTab = useCallback((tab: TabId) => {
    setActiveTab(tab)
    router.replace(`/dashboard/journal?tab=${tab}`, { scroll: false })
  }, [router])

  const openNewTrade = useCallback((sId?: string) => {
    setSignalId(sId ?? null)
    setFormOpen(true)
  }, [])

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Journal de trading</h1>
          <p className="text-sm text-muted-foreground">Suis tes trades, analyse ta performance, maîtrise tes émotions.</p>
        </div>
      </div>

      <SessionBanner />

      <div className="flex gap-1 rounded-lg bg-muted/50 p-1 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => switchTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors",
              activeTab === tab.id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <tab.icon className="size-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "trades" && (
        <TradeList key={`trades-${refreshKey}`} onNewTrade={openNewTrade} />
      )}
      {activeTab === "stats" && <StatsDashboard refreshKey={refreshKey} />}
      {activeTab === "reflections" && <ReflectionsTab />}

      {formOpen && (
        <TradeForm
          signalId={signalId}
          onClose={() => setFormOpen(false)}
          onSaved={() => {
            setFormOpen(false)
            setRefreshKey(k => k + 1)
          }}
        />
      )}
    </div>
  )
}
