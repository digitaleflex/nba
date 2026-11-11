"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ChevronLeft, Loader2 } from "lucide-react"
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from "recharts"
import {Card, CardContent, Page, PageHeader} from "@nba/design-system"

interface DayPoint {
  day: string
  pris: number
  recus: number
  manques: number
  couverture: number
}

interface TakenSignal {
  signalId: string
  tradedAt: string
  trade: { result: string; pnl: number } | null
}

interface TrackingData {
  days: number
  totalPris: number
  totalRecus: number
  joursAvecTrade: number
  couvertureGlobale: number
  series: DayPoint[]
  takenSignals?: TakenSignal[]
}

function shortDay(iso: string) {
  const d = new Date(iso + "T12:00:00")
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "numeric" })
}

export default function SignalTrackingPage() {
  const [data, setData] = useState<TrackingData | null>(null)
  const [days, setDays] = useState(30)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    fetch(`/api/dashboard/signals/tracking?days=${days}`, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error("fetch failed")
        return r.json()
      })
      .then((d) => {
        if (!controller.signal.aborted) setData(d)
      })
      .catch((err) => {
        if (err?.name !== "AbortError" && !controller.signal.aborted) setData(null)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [days])

  return (
    <Page maxWidth="4xl" gap={6}>
      <Link
        href="/dashboard/signals"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors min-h-[44px] py-2 -ml-2 px-2 rounded-lg"
      >
        <ChevronLeft className="size-4" />
        Retour aux signaux
      </Link>

      <PageHeader
        title="Mon tracking — signaux tradés"
        actions={<div className="flex gap-1.5">
          {[14, 30, 60].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors ${
                days === d
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border"
              }`}
            >
              {d}j
            </button>
          ))}
        </div>
      } />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : !data ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Impossible de charger le tracking.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2">
            <Card>
              <CardContent className="py-3 px-3 text-center">
                <div className="text-2xl font-extrabold text-emerald-600">{data.totalPris}</div>
                <div className="text-xs text-muted-foreground font-medium">signaux tradés</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-3 px-3 text-center">
                <div className="text-2xl font-extrabold">{data.joursAvecTrade}</div>
                <div className="text-xs text-muted-foreground font-medium">jours actifs</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-3 px-3 text-center">
                <div className="text-2xl font-extrabold text-primary">{data.couvertureGlobale}%</div>
                <div className="text-xs text-muted-foreground font-medium">couverture</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="py-4 px-3">
              <h2 className="text-sm font-semibold mb-1 px-1">Courbe — jours où tu as tradé</h2>
              <p className="text-xs text-muted-foreground mb-3 px-1">
                Chaque point = nombre de signaux marqués &quot;J&apos;ai tradé&quot; ce jour-là.
              </p>
              <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.series.map((s) => ({ ...s, label: shortDay(s.day) }))}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" minTickGap={24} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10 }} width={28} />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="pris"
                      name="Tradés"
                      stroke="#059669"
                      fill="#059669"
                      fillOpacity={0.2}
                      strokeWidth={2}
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-4 px-3">
              <h2 className="text-sm font-semibold mb-3 px-1">Tradés vs reçus par jour</h2>
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.series.map((s) => ({ ...s, label: shortDay(s.day) }))}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" minTickGap={24} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10 }} width={28} />
                    <Tooltip />
                    <Bar dataKey="pris" name="Tradés" fill="#059669" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="manques" name="Non tradés" fill="#e5e7eb" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-muted-foreground mt-2 px-1">
                Simple suivi pris / pas pris. Le détail PnL est affiché ci-dessous.
              </p>
            </CardContent>
          </Card>

          {data.takenSignals && data.takenSignals.length > 0 && (
            <Card>
              <CardContent className="py-4 px-3 space-y-2">
                <h2 className="text-sm font-semibold px-1">Signaux tradés — PnL</h2>
                <ul className="divide-y divide-border">
                  {data.takenSignals.map((ts) => (
                    <li key={ts.signalId} className="flex items-center justify-between py-2 px-1 text-sm">
                      <span className="text-muted-foreground">{shortDay(ts.tradedAt.slice(0, 10))}</span>
                      <span className="font-medium">
                        {ts.trade
                          ? `${ts.trade.result} · ${ts.trade.pnl.toFixed(2)}`
                          : "tradé"}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </Page>
  )
}
