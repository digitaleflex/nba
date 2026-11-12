"use client"

import { useEffect, useState } from "react"
import { TrendingUp, Users, CreditCard, Wallet } from "lucide-react"
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart as RBarChart,
  LabelList,
} from "recharts"
import { AlertTriangle, ArrowUpRight } from "lucide-react"
import { Card, CardContent, EmptyState } from "@nba/design-system"
import type { CachedGet } from "./types"
import { formatMoney } from "@nba/lib/format/money"
import { StatCard, SectionTitle, TabLoading, DANGER_BOX } from "./ui"

interface RevenuePlan {
  planId: string
  planName: string
  price: number
  currency: string
  durationDays: number
  members: number
  monthlyRevenue: number
}

interface RevenueData {
  currency: string
  totalMembers: number
  totalPlans: number
  totalRevenue: number
  breakdown: RevenuePlan[]
  timeline: { month: string; newSubs: number; newMrr: number; cumulatedMrr: number }[]
  atRisk: { members: number; expiredAccesses: number; mrr: number }
}

const AXIS_TICK = { fill: "var(--color-muted-foreground)", fontSize: 11 }
const TOOLTIP_STYLE = {
  background: "var(--color-popover)",
  border: "1px solid var(--color-border)",
  borderRadius: 12,
  fontSize: 12,
  color: "var(--color-popover-foreground)",
  boxShadow: "0 8px 24px rgb(0 0 0 / 0.12)",
}



export function RevenueTab({ cachedGet }: { cachedGet: CachedGet }) {
  const [data, setData] = useState<RevenueData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    setError(null)
    cachedGet("/api/admin/revenue", 120000)
      .then((res) => {
        if (cancelled) return
        if (!res.ok) {
          setError("Impossible de charger les données de revenus.")
          setLoading(false)
          return
        }
        setData(res.data as RevenueData)
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setError("Impossible de charger les données de revenus.")
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [cachedGet])

  if (loading) return <div className="pt-4"><TabLoading rows={3} /></div>

  if (error || !data) {
    return <div className={DANGER_BOX} role="alert">{error ?? "Aucune donnée."}</div>
  }


  return (
    <div className="space-y-6">
      <div className="border-b border-border/40 pb-5">
        <h1 className="text-xl font-bold tracking-tight text-foreground">Revenus</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Vue d&rsquo;ensemble des revenus générés par les abonnements membres.
        </p>
      </div>

      {/* Cartes récapitulatives */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={TrendingUp}
          label="Revenu mensuel"
          value={formatMoney(data.totalRevenue, data.currency)}
          sub={`${data.totalMembers} abonné${data.totalMembers > 1 ? "s" : ""}`}
        />
        <StatCard
          icon={Users}
          label="Abonnés"
          value={data.totalMembers}
          sub={`répartis sur ${data.totalPlans} plan${data.totalPlans > 1 ? "s" : ""}`}
        />
        <StatCard
          icon={CreditCard}
          label="Prix moyen"
          value={data.totalMembers > 0 ? formatMoney(data.totalRevenue / data.totalMembers, data.currency) : "—"}
          sub="par membre / mois"
        />
        <StatCard
          icon={Wallet}
          label="Revenu annuel estimé"
          value={formatMoney(data.totalRevenue * 12, data.currency)}
          sub="projection sur 12 mois"
        />
      </div>

      {/* ⚠️ Revenus à risque (accès expirés toujours actifs) */}
      {data.atRisk.expiredAccesses > 0 && (
        <div className={DANGER_BOX + " flex flex-wrap items-center gap-x-6 gap-y-2"}>
          <span className="inline-flex items-center gap-2 font-bold">
            <AlertTriangle className="size-4" />
            Revenu à risque
          </span>
          <span>
            <strong className="tabular-nums">{data.atRisk.members}</strong> membre(s) —{" "}
            <strong className="tabular-nums">{formatMoney(data.atRisk.mrr, data.currency)}</strong>/mois sur des accès expirés encore actifs
          </span>
        </div>
      )}

      {/* Évolution du MRR */}
      <Card className="border-border/60 bg-card shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-border/40">
            <SectionTitle>MRR ajouté & cumulé — 6 derniers mois</SectionTitle>
          </div>
          <div className="pt-4 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.timeline} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="month" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "var(--color-muted)", opacity: 0.4 }} />
                <Bar dataKey="newMrr" name="MRR ajouté" fill="#10b981" radius={[6, 6, 0, 0]} barSize={28} />
                <Line type="monotone" dataKey="cumulatedMrr" name="MRR cumulé" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Détail par plan */}
      <Card className="border-border/60 bg-card shadow-sm">
        <CardContent className="p-6">
          <SectionTitle>Revenus par plan</SectionTitle>
          {data.breakdown.length > 0 ? (
            <div className="pt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RBarChart data={data.breakdown} layout="vertical" margin={{ top: 4, right: 90, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                  <XAxis type="number" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="planName" tick={{ ...AXIS_TICK }} axisLine={false} tickLine={false} width={180} />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    cursor={{ fill: "var(--color-muted)", opacity: 0.5 }}
                    formatter={(value, _name, item) => {
                      const p = item?.payload as RevenuePlan | undefined
                      if (!p) return [String(value), ""]
                      return [`${formatMoney(p.monthlyRevenue, p.currency)}/mois · ${p.members} membre(s)`, "Revenu"]
                    }}
                  />
                  <Bar dataKey="monthlyRevenue" name="MRR" fill="#10b981" radius={[0, 6, 6, 0]} barSize={18}>
                    <LabelList
                      dataKey="monthlyRevenue"
                      position="right"
                      formatter={(v) => formatMoney(Number(v), data.currency)}
                      style={{ fill: "var(--color-foreground)", fontSize: 11, fontWeight: 700 }}
                    />
                  </Bar>
                </RBarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="pt-4">
              <EmptyState
                icon={CreditCard}
                title="Aucun abonnement actif"
                description="Les revenus apparaîtront lorsque des membres auront des abonnements approuvés."
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top plan */}
      {data.breakdown.length > 0 && (() => {
        const top = data.breakdown.reduce((a, b) => a.monthlyRevenue > b.monthlyRevenue ? a : b)
        return (
          <Card className="border-border/60 bg-card shadow-sm">
            <CardContent className="p-6">
              <SectionTitle>Plan le plus rentable</SectionTitle>
              <div className="pt-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-500/10">
                    <ArrowUpRight className="size-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{top.planName}</p>
                    <p className="text-xs text-muted-foreground">
                      {top.members} abonné{top.members > 1 ? "s" : ""} · {formatMoney(top.price, top.currency)}/{top.durationDays > 30 ? "an" : "mois"}
                    </p>
                  </div>
                </div>
                <p className="text-lg font-bold text-emerald-600">
                  {formatMoney(top.monthlyRevenue, top.currency)}
                </p>
              </div>
            </CardContent>
          </Card>
        )
      })()}
    </div>
  )
}
