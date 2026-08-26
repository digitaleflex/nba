"use client"

import { useEffect, useState } from "react"
import {
  Users,
  FileCheck,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Laptop,
  Radio,
  CreditCard,
} from "lucide-react"
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LabelList,
  RadialBarChart,
  RadialBar,
} from "recharts"
import { Card, CardContent, cn, EmptyState } from "@nba/design-system"
import { StatCard, SectionTitle, TabLoading, DANGER_BOX } from "./ui"

interface AnalyticsData {
  totalMembers: number
  membersBreakdown: { label: string; count: number }[]
  kyc: { approved: number; pending: number; rejected: number; verifiedPct: number; completionPct: number }
  plansBreakdown: { planId: string; planName: string; count: number }[]
  messaging: { conversations: number; unreadMessages: number; reports: number }
  infra: { devices: number; activeSessions: number }
  growth: { days: number; currentPeriodCount: number; changePct: number; series: { label: string; count: number }[] }
}

interface AnalyticsTabProps {
  cachedGet: (url: string, ttlMs?: number) => Promise<{ ok: boolean; data: unknown }>
}

const PERIODS = [
  { value: 7, label: "7 j" },
  { value: 30, label: "30 j" },
  { value: 90, label: "90 j" },
]

/** Palette charts — lisibles en clair ET en sombre. */
const CHART_COLORS = ["#8b5cf6", "#10b981", "#f59e0b", "#3b82f6", "#ef4444", "#ec4899", "#14b8a6"]
const AXIS_TICK = { fill: "var(--color-muted-foreground)", fontSize: 11 }
const TOOLTIP_STYLE = {
  background: "var(--color-popover)",
  border: "1px solid var(--color-border)",
  borderRadius: 12,
  fontSize: 12,
  color: "var(--color-popover-foreground)",
  boxShadow: "0 8px 24px rgb(0 0 0 / 0.12)",
}

export function AnalyticsTab({ cachedGet }: AnalyticsTabProps) {
  const [days, setDays] = useState(30)
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    setError(null)
    cachedGet(`/api/admin/analytics?days=${days}`, 30000)
      .then((res) => {
        if (cancelled) return
        if (!res.ok) {
          setError("Impossible de charger les analyses.")
          setLoading(false)
          return
        }
        setData(res.data as AnalyticsData)
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setError("Impossible de charger les analyses.")
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [days, cachedGet])

  if (loading) return <div className="pt-4"><TabLoading rows={4} /></div>

  if (error || !data) {
    return <div className={DANGER_BOX} role="alert">{error ?? "Aucune donnée."}</div>
  }

  const growthSeries = data.growth.series.map((d) => ({
    label: d.label,
    inscriptions: d.count,
  }))
  const trendPositive = data.growth.changePct >= 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border/40 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Analytics</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Croissance, répartition et activité de la plateforme.
          </p>
        </div>
        <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setDays(p.value)}
              className={cn(
                "text-xs px-3 py-1 rounded-md transition-colors cursor-pointer",
                days === p.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Membres" value={data.totalMembers} />
        <StatCard icon={FileCheck} label="KYC vérifiés" value={`${data.kyc.verifiedPct}%`} tone="success" />
        <StatCard icon={MessageSquare} label="Conversations" value={data.messaging.conversations} />
        <StatCard icon={Laptop} label="Sessions actives" value={data.infra.activeSessions} />
      </div>

      {/* CROISSANCE — graphique héro */}
      <Card className="border-border/60 bg-card shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-border/40">
            <SectionTitle>Inscriptions — {data.growth.days} derniers jours</SectionTitle>
            <span className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold",
              trendPositive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive",
            )}>
              {trendPositive ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
              {trendPositive ? "+" : ""}{data.growth.changePct}% vs période précédente
            </span>
          </div>
          <div className="pt-4 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthSeries} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradSignups" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} minTickGap={24} />
                <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ stroke: "var(--color-border)" }} />
                <Area
                  type="monotone"
                  dataKey="inscriptions"
                  name="Inscriptions"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  fill="url(#gradSignups)"
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* MEMBRES (donut) + KYC (radial) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/60 bg-card shadow-sm">
          <CardContent className="p-6">
            <SectionTitle>Répartition des membres par statut</SectionTitle>
            <div className="pt-2 relative h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.membersBreakdown}
                    dataKey="count"
                    nameKey="label"
                    innerRadius="62%"
                    outerRadius="88%"
                    paddingAngle={3}
                    strokeWidth={0}
                  >
                    {data.membersBreakdown.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-2xl font-bold tabular-nums text-foreground">{data.totalMembers}</p>
                <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Membres</p>
              </div>
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 pt-1">
                {data.membersBreakdown.map((s, i) => (
                  <span key={s.label} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="size-2 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                    {s.label} · <strong className="text-foreground tabular-nums">{s.count}</strong>
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card shadow-sm">
          <CardContent className="p-6">
            <SectionTitle>Vérification KYC</SectionTitle>
            <div className="relative h-[160px] pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  data={[{ name: "Vérifiés", value: data.kyc.verifiedPct, fill: "#10b981" }]}
                  startAngle={90}
                  endAngle={-270}
                  innerRadius="72%"
                  outerRadius="100%"
                >
                  <RadialBar background={{ fill: "var(--color-muted)" }} dataKey="value" cornerRadius={20} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-2xl font-bold tabular-nums text-success">{data.kyc.verifiedPct}%</p>
                <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">vérifiés</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 pt-2 text-center border-t border-border/40 mt-2">
              <div className="pt-3">
                <p className="text-lg font-bold tabular-nums text-success">{data.kyc.approved}</p>
                <p className="text-xs text-muted-foreground">Approuvés</p>
              </div>
              <div className="pt-3 border-x border-border/40">
                <p className="text-lg font-bold tabular-nums text-amber-600 dark:text-amber-400">{data.kyc.pending}</p>
                <p className="text-xs text-muted-foreground">En attente</p>
              </div>
              <div className="pt-3">
                <p className="text-lg font-bold tabular-nums text-destructive">{data.kyc.rejected}</p>
                <p className="text-xs text-muted-foreground">Rejetés</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground pt-3 text-center">
              Taux de complétion : <strong className="text-foreground">{data.kyc.completionPct}%</strong> (approuvés / dossiers soumis)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ABONNEMENTS PAR PLAN */}
      <Card className="border-border/60 bg-card shadow-sm">
        <CardContent className="p-6">
          <SectionTitle>Abonnements actifs par plan</SectionTitle>
          {data.plansBreakdown.length > 0 ? (
            <div className="pt-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.plansBreakdown}
                  layout="vertical"
                  margin={{ top: 4, right: 40, left: 8, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                  <XAxis type="number" tick={AXIS_TICK} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="planName"
                    tick={{ ...AXIS_TICK, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={170}
                  />
                  <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "var(--color-muted)", opacity: 0.5 }} />
                  <Bar dataKey="count" name="Abonnés" fill="#8b5cf6" radius={[0, 6, 6, 0]} barSize={18}>
                    <LabelList dataKey="count" position="right" style={{ fill: "var(--color-foreground)", fontSize: 11, fontWeight: 700 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState icon={CreditCard} title="Aucun abonnement actif" description="Les répartitions par plan apparaîtront lorsqu'il y aura des abonnés." />
          )}
        </CardContent>
      </Card>

      {/* MESSAGERIE + INFRA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/60 bg-card shadow-sm">
          <CardContent className="p-6">
            <SectionTitle>Messagerie</SectionTitle>
            <div className="pt-4 grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-xl font-bold tabular-nums text-foreground">{data.messaging.conversations}</p>
                <p className="text-xs text-muted-foreground mt-1">Conversations</p>
              </div>
              <div>
                <p className="text-xl font-bold tabular-nums text-foreground">{data.messaging.unreadMessages}</p>
                <p className="text-xs text-muted-foreground mt-1">Non lus</p>
              </div>
              <div>
                <p className="text-xl font-bold tabular-nums text-destructive">{data.messaging.reports}</p>
                <p className="text-xs text-muted-foreground mt-1">Signalements</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card shadow-sm">
          <CardContent className="p-6">
            <SectionTitle>Infrastructure & sessions</SectionTitle>
            <div className="pt-4 grid grid-cols-2 gap-3 text-center">
              <div>
                <p className="text-xl font-bold tabular-nums text-foreground flex items-center justify-center gap-1">
                  <Laptop className="size-4 text-muted-foreground/60" />
                  {data.infra.devices}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Appareils enregistrés</p>
              </div>
              <div>
                <p className="text-xl font-bold tabular-nums text-foreground flex items-center justify-center gap-1">
                  <Radio className="size-4 text-muted-foreground/60" />
                  {data.infra.activeSessions}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Sessions actives</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
