"use client"

import { useEffect, useState } from "react"
import {
  Users,
  FileCheck,
  CreditCard,
  MessageSquare,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Laptop,
  Radio,
  Loader2,
} from "lucide-react"
import { Card, CardContent, cn, Chart } from "@nba/design-system"

interface AnalyticsTabProps {
  cachedGet: (url: string, ttlMs?: number) => Promise<{ ok: boolean; data: any }>
}

const PERIODS = [
  { value: 7, label: "7 j" },
  { value: 30, label: "30 j" },
  { value: 90, label: "90 j" },
]

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: React.ReactNode
}) {
  return (
    <Card className="border-border bg-card/30">
      <CardContent className="p-4 flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{label}</p>
          <p className="text-xl font-bold text-foreground">{value}</p>
        </div>
        <Icon className="size-5 text-muted-foreground/60" />
      </CardContent>
    </Card>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground pb-4 border-b border-border">
      {children}
    </h3>
  )
}

export function AnalyticsTab({ cachedGet }: AnalyticsTabProps) {
  const [days, setDays] = useState(30)
  const [data, setData] = useState<any>(null)
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
        setData(res.data)
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

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <Loader2 className="animate-spin text-primary" />
      </div>
    )
  }

  if (error || !data) {
    return <div className="py-20 text-center text-rose-600 text-sm">{error}</div>
  }

  const plansTotal = data.plansBreakdown.reduce((a: number, s: any) => a + s.count, 0) || 1

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Analytics</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Répartition des membres, vérifications, abonnements et activité plateforme.
          </p>
        </div>
        <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setDays(p.value)}
              className={cn(
                "text-[11px] px-3 py-1 rounded-md transition-colors cursor-pointer",
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

      {/* CARTES RAPIDES */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Membres" value={data.totalMembers} />
        <StatCard icon={FileCheck} label="KYC vérifiés" value={`${data.kyc.verifiedPct}%`} />
        <StatCard icon={MessageSquare} label="Conversations" value={data.messaging.conversations} />
        <StatCard icon={Laptop} label="Sessions actives" value={data.infra.activeSessions} />
      </div>

      {/* RÉPARTITION MEMBRES */}
      <Card className="border-border bg-card/20">
        <CardContent className="p-6">
          <SectionTitle>Répartition des membres par statut</SectionTitle>
          <div className="pt-4">
            <Chart
              type="funnel"
              data={data.membersBreakdown.map((s: any) => ({ label: s.label, value: s.count }))}
              emptyText="Aucun membre"
              height={140}
            />
          </div>
        </CardContent>
      </Card>

      {/* KYC + PLANS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border bg-card/20">
          <CardContent className="p-6">
            <SectionTitle>Vérification KYC</SectionTitle>
            <div className="pt-4 grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-2xl font-bold text-emerald-600">{data.kyc.approved}</p>
                <p className="text-[10px] text-muted-foreground mt-1">Approuvés</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600">{data.kyc.pending}</p>
                <p className="text-[10px] text-muted-foreground mt-1">En attente</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-rose-600">{data.kyc.rejected}</p>
                <p className="text-[10px] text-muted-foreground mt-1">Rejetés</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">Membres vérifiés (KYC approuvé / total)</span>
              <span className="font-bold text-foreground">{data.kyc.verifiedPct}%</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">Taux de complétion (approuvés / dossiers)</span>
              <span className="font-bold text-foreground">{data.kyc.completionPct}%</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/20">
          <CardContent className="p-6">
            <SectionTitle>Abonnements par plan</SectionTitle>
            <div className="pt-4 space-y-2.5">
              {data.plansBreakdown.length > 0 ? (
                data.plansBreakdown.map((p: any) => (
                  <div key={p.planId} className="flex items-center gap-3">
                    <span className="text-[11px] w-44 shrink-0 text-muted-foreground truncate">
                      {p.planName}
                    </span>
                    <div className="flex-1 h-2.5 rounded-full bg-muted/50 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-indigo-500/60"
                        style={{ width: `${Math.max(3, (p.count / plansTotal) * 100)}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-bold w-10 text-right text-foreground">
                      {p.count}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-[11px] text-muted-foreground py-4 text-center">
                  Aucun abonnement actif.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MESSAGERIE + INFRA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border bg-card/20">
          <CardContent className="p-6">
            <SectionTitle>Messagerie</SectionTitle>
            <div className="pt-4 grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-2xl font-bold text-foreground flex items-center justify-center gap-1">
                  <MessageSquare className="size-4 text-muted-foreground/60" />
                  {data.messaging.conversations}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">Conversations</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{data.messaging.unreadMessages}</p>
                <p className="text-[10px] text-muted-foreground mt-1">Messages non lus</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground flex items-center justify-center gap-1">
                  <ShieldCheck className="size-4 text-muted-foreground/60" />
                  {data.messaging.reports}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">Signalements</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/20">
          <CardContent className="p-6">
            <SectionTitle>Infrastructure & sessions</SectionTitle>
            <div className="pt-4 grid grid-cols-2 gap-3 text-center">
              <div>
                <p className="text-2xl font-bold text-foreground flex items-center justify-center gap-1">
                  <Laptop className="size-4 text-muted-foreground/60" />
                  {data.infra.devices}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">Appareils enregistrés</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground flex items-center justify-center gap-1">
                  <Radio className="size-4 text-muted-foreground/60" />
                  {data.infra.activeSessions}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">Sessions actives</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CROISSANCE */}
      <Card className="border-border bg-card/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <SectionTitle>Inscriptions ({data.growth.days} derniers jours)</SectionTitle>
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="text-muted-foreground">
                {data.growth.currentPeriodCount} inscrits
              </span>
              {data.growth.changePct >= 0 ? (
                <span className="flex items-center gap-0.5 text-emerald-600 font-bold">
                  <TrendingUp className="size-3.5" />
                  +{data.growth.changePct}%
                </span>
              ) : (
                <span className="flex items-center gap-0.5 text-rose-600 font-bold">
                  <TrendingDown className="size-3.5" />
                  {data.growth.changePct}%
                </span>
              )}
              <span className="text-muted-foreground">vs période préc.</span>
            </div>
          </div>
          <div className="pt-4">
            <Chart
              type="bar"
              data={data.growth.series.map((d: any) => ({ label: d.label, value: d.count }))}
              emptyText="Aucune inscription sur la période"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
