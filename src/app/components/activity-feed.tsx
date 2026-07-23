"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { History, Loader2, ChevronRight } from "lucide-react"
import { cn } from "@nba/design-system"

interface ActivityItem {
  type: "signal" | "kyc" | "broker" | "streak" | "message" | "read"
  icon: string
  title: string
  description: string
  link?: string
  timestamp: string
}

export function ActivityFeed({ className }: { className?: string }) {
  const [items, setItems] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    fetch(`/api/user/activity-feed?since=${encodeURIComponent(since)}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setItems(d.items) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className={cn("flex justify-center py-8", className)}>
        <Loader2 className="size-5 animate-spin text-primary" />
      </div>
    )
  }

  if (items.length === 0) return null

  return (
    <div className={cn("space-y-3", className)}>
      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
        <History className="size-3.5" /> Fil d&apos;activité
      </h3>

      <div className="space-y-1">
        {items.map((item, i) => (
          <button
            key={`${item.type}-${i}`}
            onClick={() => item.link && router.push(item.link)}
            disabled={!item.link}
            className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-muted/40 transition-colors group cursor-pointer"
          >
            <span className="text-lg shrink-0">{item.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{item.title}</p>
              <p className="text-[11px] text-muted-foreground truncate">{item.description}</p>
            </div>
            {item.link && (
              <ChevronRight className="size-3.5 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors shrink-0" />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
