"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, EmptyState } from "@nba/design-system"
import {
  BarChart3, Smartphone, Tablet, Monitor, Apple, ShieldCheck, Loader2,
  AlertTriangle, Users
} from "lucide-react"
import { SeverityBadge } from "../components/SeverityBadge"

interface DeviceStats {
  total: number
  counts: { mobile: number; tablet: number; desktop: number }
  byBrand: Record<string, number>
  byOs: { name: string; count: number }[]
  byBrowser: { name: string; count: number }[]
  recent: {
    id: string
    name: string | null
    deviceType: string | null
    brand: string | null
    model: string | null
    os: string | null
    browser: string | null
    ipAddress: string | null
    lastSeenAt: Date | string
    trusted: boolean
    userId: string
    user: { name: string | null; email: string | null }
  }[]
}

interface FraudAlert {
  type: string
  severity: "high" | "medium" | "low"
  title: string
  detail: string
  users: { name: string; email: string; count: number }[]
}

const DEVICE_TYPE_LABELS: Record<string, string> = {
  mobile: "Mobile",
  tablet: "Tablette",
  desktop: "Ordinateur",
  unknown: "Inconnu",
}

export function DevicesTab() {
  const [data, setData] = useState<DeviceStats | null>(null)
  const [fraudAlerts, setFraudAlerts] = useState<FraudAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [devRes, fraudRes] = await Promise.all([
          fetch("/api/admin/device-stats"),
          fetch("/api/admin/device-stats/fraud"),
        ])
        if (!devRes.ok) throw new Error("Erreur de chargement")
        const json = await devRes.json()
        if (!cancelled) setData(json)
        if (fraudRes.ok && !cancelled) {
          const fraudJson = await fraudRes.json()
          setFraudAlerts(fraudJson.alerts ?? [])
        }
      } catch {
        if (!cancelled) setError("Erreur de chargement des appareils")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    const id = setInterval(load, 60_000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !data) {
    return <EmptyState icon={BarChart3} title="Aucune donnée" description="Les statistiques apparaîtront lorsque des appareils seront enregistrés." />
  }

  const maxBrand = Math.max(1, ...Object.values(data.byBrand))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Appareils & Optimisation</h2>
        <p className="text-sm text-muted-foreground">
          {data.total} appareil{data.total !== 1 ? "s" : ""} enregistré{data.total !== 1 ? "s" : ""} — données
          utilisées pour optimiser l&apos;expérience mobile (iOS/Safari notamment).
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={<Monitor className="size-5" />} label="Ordinateur" value={data.counts.desktop} accent="text-blue-500" />
        <StatCard icon={<Smartphone className="size-5" />} label="Mobile" value={data.counts.mobile} accent="text-emerald-500" />
        <StatCard icon={<Tablet className="size-5" />} label="Tablette" value={data.counts.tablet} accent="text-violet-500" />
        <StatCard
          icon={<Apple className="size-5" />}
          label="Marque #1"
          value={Object.entries(data.byBrand).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—"}
          accent="text-rose-500"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="size-4" /> Répartition par marque
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.keys(data.byBrand).length === 0 ? (
              <EmptyState icon={BarChart3} title="Aucune donnée" description="Les statistiques apparaîtront lorsque des appareils seront enregistrés." />
            ) : (
              Object.entries(data.byBrand)
                .sort((a, b) => b[1] - a[1])
                .map(([brand, count]) => (
                  <div key={brand} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{brand}</span>
                      <span className="text-muted-foreground">{count}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${(count / maxBrand) * 100}%` }} />
                    </div>
                  </div>
                ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="size-4" /> Systèmes & navigateurs
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">OS</p>
              {data.byOs.map((o) => (
                <div key={o.name} className="flex items-center justify-between text-sm">
                  <span>{o.name}</span>
                  <span className="text-muted-foreground">{o.count}</span>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Navigateur</p>
              {data.byBrowser.map((b) => (
                <div key={b.name} className="flex items-center justify-between text-sm">
                  <span>{b.name}</span>
                  <span className="text-muted-foreground">{b.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {fraudAlerts.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-amber-700">
              <AlertTriangle className="size-4" /> Alertes anti-fraude
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {fraudAlerts.map((alert, i) => (
              <div key={i} className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
                    alert.severity === "high" ? "text-red-600 bg-red-100" :
                    alert.severity === "medium" ? "text-amber-600 bg-amber-100" :
                    "text-blue-600 bg-blue-100"
                  }`}>{alert.severity === "high" ? "Critique" : alert.severity === "medium" ? "Moyen" : "Faible"}</span>
                  <span className="text-sm font-semibold">{alert.title}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{alert.detail}</p>
                <div className="flex flex-wrap gap-1">
                  {alert.users.map((u, j) => (
                    <span key={j} className="inline-flex items-center gap-1 text-xs bg-background border border-border rounded px-2 py-0.5">
                      <Users className="size-3" />
                      {u.name || u.email} {u.count > 1 && `(${u.count})`}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="size-4" /> Appareils récents
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.recent.length === 0 ? (
            <EmptyState icon={Smartphone} title="Aucun appareil récent" description="Les appareils enregistrés apparaîtront ici." />
          ) : (
            data.recent.map((d) => (
              <div
                key={d.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 px-3 py-2 text-sm"
              >
                <div className="min-w-0 flex-[2]">
                  <p className="truncate font-medium text-primary">
                    {d.user?.name ?? d.user?.email ?? "Inconnu"}
                  </p>
                  <p className="truncate font-medium">
                    {d.model ?? d.name ?? "Appareil inconnu"}
                    {d.brand && <span className="ml-1 text-muted-foreground">· {d.brand}</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {DEVICE_TYPE_LABELS[d.deviceType ?? "unknown"]}
                    {d.os && ` · ${d.os}`}
                    {d.browser && ` · ${d.browser}`}
                  </p>
                </div>
                <div className="text-right text-xs text-muted-foreground shrink-0">
                  <p className="font-mono">{d.ipAddress ?? "—"}</p>
                  <p>{new Date(d.lastSeenAt).toLocaleString("fr-FR")}</p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  accent: string
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1 p-4">
        <span className={accent}>{icon}</span>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  )
}
