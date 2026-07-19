"use client"

import { useEffect, useState } from "react"
import { cn } from "@nba/design-system"
import { LayoutDashboard, Bell, Clock } from "lucide-react"

type TabId = "dashboard" | "signals" | "timeline"

const TABS = [
  { id: "dashboard" as TabId, label: "Résumé", icon: LayoutDashboard },
  { id: "timeline" as TabId, label: "Membres", icon: Clock },
]

export function TrackerTabs({
  dashboard,
  signals,
  timeline,
}: {
  dashboard: React.ReactNode
  signals: React.ReactNode
  timeline: React.ReactNode
}) {
  const [activeTab, setActiveTab] = useState<TabId>("dashboard")
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)")
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  if (!isMobile) {
    return (
      <>
        {dashboard}
        {signals}
        {timeline}
      </>
    )
  }

  const sections: Record<TabId, React.ReactNode> = { dashboard, signals, timeline }

  return (
    <div className="md:hidden">
      <div className="pb-20">
        {sections[activeTab]}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex items-center justify-around h-14">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1.5 text-[10px] font-medium transition-colors min-w-0",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className={cn("size-5", isActive ? "text-primary" : "text-muted-foreground")} />
                {tab.label}
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
