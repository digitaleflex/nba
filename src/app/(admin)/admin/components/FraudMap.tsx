"use client"

import { useEffect, useState, lazy, Suspense } from "react"
import { Card, CardContent } from "@nba/design-system"
import { Loader2 } from "lucide-react"

const MapInner = lazy(() => import("./FraudMapInner"))

interface GeoEvent {
  id: string
  type: string
  severity: string
  latitude: number
  longitude: number
  country: string | null
  city: string | null
  ipAddress: string | null
  createdAt: string
  user: { email: string } | null
}

export function FraudMap() {
  const [geoEvents, setGeoEvents] = useState<GeoEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/security/fraud/geo-events")
      .then((r) => r.json())
      .then((d) => setGeoEvents(d.events ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return null
  if (geoEvents.length === 0) return null

  return (
    <Card><CardContent className="p-6 space-y-4">
      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        Connexions suspectes (24h) — {geoEvents.length} evenements
      </h3>
      <div className="h-[400px] rounded-xl overflow-hidden border">
        <Suspense fallback={<div className="flex items-center justify-center h-full"><Loader2 className="size-6 animate-spin" /></div>}>
          <MapInner events={geoEvents} />
        </Suspense>
      </div>
    </CardContent></Card>
  )
}
