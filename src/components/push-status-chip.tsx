"use client"

import { useState } from "react"
import { Button } from "@nba/design-system"
import { Bell, BellOff, AlertTriangle } from "lucide-react"
import { usePushSubscription } from "@nba/lib/hooks/use-push-subscription"
import { PushAlertsCard } from "@nba/components/push-alerts-card"

export function PushStatusChip() {
  const { state } = usePushSubscription()
  const [open, setOpen] = useState(false)

  const label =
    state === "active" ? "Alertes actives" :
    state === "denied" ? "Alertes bloquées" :
    "Activer les alertes"
  const Icon = state === "active" ? Bell : state === "denied" ? BellOff : AlertTriangle
  const color = state === "active" ? "text-emerald-600" : state === "denied" ? "text-destructive" : "text-amber-600"

  return (
    <div className="relative">
      <Button variant="ghost" size="sm" onClick={() => setOpen((v) => !v)} className="gap-1.5">
        <Icon className={`size-4 ${color}`} />
        <span className="hidden sm:inline text-xs">{label}</span>
      </Button>
      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 w-80">
          <PushAlertsCard variant="full" />
        </div>
      )}
    </div>
  )
}
