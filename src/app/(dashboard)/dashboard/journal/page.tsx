"use client"

import { useEffect, useState, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { BookOpen, TrendingUp, PenLine, Loader2 } from "lucide-react"
import { cn } from "@nba/design-system"

import { TradeList } from "./components/trade-list"
import { StatsDashboard } from "./components/stats-dashboard"
import { ReflectionsTab } from "./components/reflections-tab"
import { TradeForm } from "./components/trade-form"

const TABS = [
  { id: "trades", label: "Trades", icon: BookOpen },
  { id: "stats", label: "Stats", icon: TrendingUp },
  { id: "reflections", label: "Réflexions", icon: PenLine },
] as const

type TabId = (typeof TABS)[number]["id"]

export default function JournalPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
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

      {/* Tabs */}
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

      {/* Contenu */}
      {activeTab === "trades" && (
        <TradeList key={`trades-${refreshKey}`} onNewTrade={openNewTrade} />
      )}
      {activeTab === "stats" && <StatsDashboard />}
      {activeTab === "reflections" && <ReflectionsTab />}

      {/* Formulaire de trade (BottomSheet en mobile, Dialog en desktop) */}
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
