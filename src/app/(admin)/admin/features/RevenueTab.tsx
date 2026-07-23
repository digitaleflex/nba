"use client"

import { useEffect, useState } from "react"
import {
  TrendingUp,
  Users,
  CreditCard,
  Wallet,
  Loader2,
  ArrowUpRight,
  Euro,
  DollarSign,
  PoundSterling,
} from "lucide-react"
import { Card, CardContent, EmptyState } from "@nba/design-system"
import type { CachedGet } from "./types"

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
}

function CurrencyIcon({ currency }: { currency: string }) {
  const cls = "size-4 text-muted-foreground/40"
  if (currency === "EUR") return <Euro className={cls} />
  if (currency === "USD") return <DollarSign className={cls} />
  if (currency === "GBP") return <PoundSterling className={cls} />
  return <Wallet className={cls} />
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency }).format(amount)
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: React.ReactNode
  sub?: string
}) {
  return (
    <Card className="border-border/60 bg-card shadow-sm">
      <CardContent className="p-4 flex items-center justify-between">
        <div className="space-y-0.5">
          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">{label}</p>
          <p className="text-xl font-bold text-foreground">{value}</p>
          {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
        </div>
        <Icon className="size-5 text-muted-foreground/40" />
      </CardContent>
    </Card>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground pb-4 border-b border-border/40">
      {children}
    </h3>
  )
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

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <Loader2 className="animate-spin text-primary" />
      </div>
    )
  }

  if (error || !data) {
    return <div className="py-20 text-center text-rose-600 text-sm" role="alert">{error}</div>
  }

  const maxRevenue = Math.max(...data.breakdown.map((p) => p.monthlyRevenue), 1)

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
          value={formatCurrency(data.totalRevenue, data.currency)}
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
          value={data.totalMembers > 0 ? formatCurrency(data.totalRevenue / data.totalMembers, data.currency) : "—"}
          sub="par membre / mois"
        />
        <StatCard
          icon={Wallet}
          label="Revenu annuel estimé"
          value={formatCurrency(data.totalRevenue * 12, data.currency)}
          sub="projection sur 12 mois"
        />
      </div>

      {/* Détail par plan */}
      <Card className="border-border/60 bg-card shadow-sm">
        <CardContent className="p-6">
          <SectionTitle>Revenus par plan</SectionTitle>
          {data.breakdown.length > 0 ? (
            <div className="pt-4 space-y-4">
              {data.breakdown.map((plan) => {
                const pct = maxRevenue > 0 ? (plan.monthlyRevenue / maxRevenue) * 100 : 0
                return (
                  <div key={plan.planId}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <CurrencyIcon currency={plan.currency} />
                        <span className="text-sm font-medium text-foreground truncate">
                          {plan.planName}
                        </span>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {plan.members} membre{plan.members > 1 ? "s" : ""}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-foreground shrink-0 ml-4">
                        {formatCurrency(plan.monthlyRevenue, plan.currency)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 rounded-full bg-muted/50 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-500/60 transition-all duration-500"
                          style={{ width: `${Math.max(2, pct)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground w-12 text-right shrink-0">
                        {plan.price} {plan.currency}/{plan.durationDays > 30 ? "an" : "mois"}
                      </span>
                    </div>
                  </div>
                )
              })}
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
                      {top.members} abonné{top.members > 1 ? "s" : ""} · {formatCurrency(top.price, top.currency)}/{top.durationDays > 30 ? "an" : "mois"}
                    </p>
                  </div>
                </div>
                <p className="text-lg font-bold text-emerald-600">
                  {formatCurrency(top.monthlyRevenue, top.currency)}
                </p>
              </div>
            </CardContent>
          </Card>
        )
      })()}
    </div>
  )
}
