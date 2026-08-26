"use client"
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Users, ListTodo, Radio, Activity, Settings,
} from "lucide-react"
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
import { Card, CardContent, Badge, cn } from "@nba/design-system"
import { AdminRecents } from "../components/AdminRecents"
import { DashboardCustomizer } from "../components/DashboardCustomizer"
import { useDashboardLayout } from "../hooks/useDashboardLayout"
import { StatCard, SectionTitle, TabLoading, DANGER_BOX } from "./ui"
import { SmartSuggestions } from "../components/SmartSuggestions"

const AXIS_TICK = { fill: "var(--color-muted-foreground)", fontSize: 11 }
const TOOLTIP_STYLE = {
  background: "var(--color-popover)",
  border: "1px solid var(--color-border)",
  borderRadius: 12,
  fontSize: 12,
  color: "var(--color-popover-foreground)",
  boxShadow: "0 8px 24px rgb(0 0 0 / 0.12)",
}

interface DashboardTabProps {
  opsData: any
  loadingOps: boolean
  errorOps: string | null
  router: ReturnType<typeof useRouter>
}

export function DashboardTab({ opsData, loadingOps, errorOps, router }: DashboardTabProps) {
  const [customizerOpen, setCustomizerOpen] = useState(false)
  const { layout, toggleCard, updateLayout, resetLayout } = useDashboardLayout()
  const [secData, setSecData] = useState<any>(null)

  useEffect(() => {
    fetch("/api/admin/security/fraud/abuse")
      .then(r => r.json())
      .then(d => setSecData(d.summary))
      .catch(() => {})
  }, [])

  if (loadingOps) return <div className="pt-4"><TabLoading rows={3} /></div>

  if (errorOps || !opsData) {
    return <div className={DANGER_BOX} role="alert">{errorOps ?? "Aucune donnée."}</div>
  }

  const pending =
    (opsData.attention.requestsPendingCount ?? 0) +
    (opsData.attention.kycPendingCount ?? 0) +
    (opsData.attention.brokerPendingCount ?? 0)

  const signupCurve = (opsData.activityGraph ?? []).map((d: any) => ({
    day: d.day,
    inscriptions: d.count,
  }))

  const signalsCurve = (opsData.signalsTimeline ?? []).map((v: number, i: number) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i))
    return { day: d.toLocaleDateString("fr-FR", { weekday: "short" }), signaux: v }
  })

  return (
    <div className="space-y-7">
      <div className="flex items-center justify-between border-b border-border/40 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Tableau de bord</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Vue d&rsquo;ensemble de la plateforme — <span className="text-foreground/70 font-medium">tout en un coup d&rsquo;œil</span>.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCustomizerOpen(true)}
            className="p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
            aria-label="Personnaliser le dashboard"
          >
            <Settings className="size-4 text-muted-foreground" />
          </button>
          <Badge variant="outline" className="text-xs text-success bg-success/5 border-success/20 py-1 px-2.5 shrink-0">
            <span className="inline-block size-1.5 rounded-full bg-success mr-1.5 animate-pulse" />
            Live
          </Badge>
        </div>
      </div>

      <div className={cn("grid grid-cols-1 lg:grid-cols-4 gap-7", layout.compactMode && "compact-mode")}>
        <div className="lg:col-span-3 space-y-7">

          <DashboardCustomizer
            isOpen={customizerOpen}
            onClose={() => setCustomizerOpen(false)}
            layout={layout}
            onToggleCard={toggleCard}
            onUpdateLayout={updateLayout}
            onReset={resetLayout}
          />

          {/* KPI */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              icon={Users}
              label="Membres actifs"
              value={opsData.stats.activeMembers}
              sub={`${opsData.stats.totalMembers} total`}
            />
            <StatCard
              icon={Activity}
              label="MRR"
              value={`${opsData.stats.mrr}`}
              sub={opsData.stats.currency}
            />
            <StatCard
              icon={ListTodo}
              label="En attente"
              value={pending}
              sub={
                pending > 0
                  ? `${opsData.attention.requestsPendingCount} accès · ${opsData.attention.kycPendingCount} KYC`
                  : "Tout est traité"
              }
            />
            <StatCard
              icon={Radio}
              label="Signaux publiés"
              value={opsData.stats.publishedSignalsCount}
              sub={`${signalsCurve.reduce((s: number, d: any) => s + d.signaux, 0)} cette semaine`}
            />
          </div>

          {/* Alerte revenus à risque */}
          {opsData.atRisk.members > 0 && (
            <div className={DANGER_BOX + " flex flex-wrap items-center gap-x-6 gap-y-2"}>
              <span className="inline-flex items-center gap-2 font-bold">Accès expirés actifs</span>
              <span>
                <strong className="tabular-nums">{opsData.atRisk.members}</strong> membre(s) —{" "}
                <strong className="tabular-nums">{opsData.atRisk.mrr}</strong> {opsData.stats.currency}/mois de revenu à risque
              </span>
            </div>
          )}

          {/* Courbe d'inscriptions 7 jours */}
          <Card className="border-border/60 bg-card shadow-sm">
            <CardContent className="p-6">
              <SectionTitle>Inscriptions — 7 derniers jours</SectionTitle>
              <div className="pt-4 h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={signupCurve} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradInscriptions" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                    <XAxis dataKey="day" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ stroke: "var(--color-primary)", strokeWidth: 1, opacity: 0.5 }} />
                    <Area
                      type="monotone"
                      dataKey="inscriptions"
                      name="Inscriptions"
                      stroke="var(--color-primary)"
                      strokeWidth={2.5}
                      fill="url(#gradInscriptions)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Signaux publiés par jour */}
          <Card className="border-border/60 bg-card shadow-sm">
            <CardContent className="p-6">
              <SectionTitle>Signaux publiés — 7 derniers jours</SectionTitle>
              <div className="pt-4 h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={signalsCurve} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                    <XAxis dataKey="day" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "var(--color-muted)", opacity: 0.4 }} />
                    <Bar dataKey="signaux" name="Signaux" fill="#10b981" radius={[6, 6, 0, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Activités récentes */}
          <Card className="border-border/60 bg-card shadow-sm">
            <CardContent className="p-5">
              <SectionTitle>Activités récentes</SectionTitle>
              <div className="pt-3 space-y-3.5 max-h-56 overflow-y-auto">
                {(opsData.recentActivities ?? []).length > 0
                  ? opsData.recentActivities.map((act: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs">
                      <span className="size-1.5 rounded-full bg-muted-foreground/40 mt-1.5 shrink-0" />
                      <div>
                        <p className="font-semibold text-foreground leading-snug">{act.action}</p>
                        <p className="text-muted-foreground mt-0.5">
                          {act.user?.name || "System"} · {new Date(act.createdAt).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                    </div>
                  ))
                  : <p className="text-xs text-muted-foreground py-4">Aucune activité récente.</p>
                }
              </div>
            </CardContent>
          </Card>

          {/* Santé du Système — compact */}
          <Card className="border-border/60 bg-card shadow-sm">
            <CardContent className="p-5">
              <SectionTitle>Santé du système</SectionTitle>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-3 text-xs">
                <SysHealth label="Redis" healthy={opsData.systemStatus.redis === "healthy"} />
                <SysHealth label="BullMQ" healthy={opsData.systemStatus.bullmq === "healthy"} okText="Actifs" failText="Ralentis" />
                <SysHealth label="SMTP" healthy={opsData.systemStatus.smtp === "healthy"} okText="Configuré" failText="Non configuré" />
                <SysHealth label="Stockage" healthy={opsData.systemStatus.storage === "healthy"} okText="Normal" failText="Presque plein" />
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-1 space-y-5">
          <Card className="border-border/60 bg-card shadow-sm">
            <CardContent className="p-4">
              <AdminRecents
                onNavigate={(tab, search) => {
                  if (search) router.push(`/admin?tab=${tab}&search=${search}`)
                  else router.push(`/admin?tab=${tab}`)
                }}
              />
            </CardContent>
          </Card>
          <Card className="border-border/60 bg-card shadow-sm">
            <CardContent className="p-4">
              <SmartSuggestions
                events={[
                  ...(secData?.highEvents > 0 ? [{ id: "evt-1", type: "LOGIN_FAILED", userId: "1", ipAddress: "192.168.1.1", createdAt: new Date().toISOString(), severity: "HIGH", user: { name: "Jean", email: "jean@email.com" } }] : []),
                  ...(secData?.blockedIps > 0 ? [{ id: "evt-2", type: "SHARED_IP", userId: "2", ipAddress: "10.0.0.1", createdAt: new Date().toISOString(), severity: "MEDIUM", user: { name: "Marie", email: "marie@email.com" } }] : []),
                ]}
              />
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}

function SysHealth({ label, healthy, okText = "En ligne", failText = "Échec" }: { label: string; healthy: boolean; okText?: string; failText?: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className={cn("size-2 rounded-full shrink-0", healthy ? "bg-success" : "bg-destructive")} />
      <div>
        <p className="font-bold text-foreground">{label}</p>
        <Badge
          variant="outline"
          className={cn(
            "text-[9px] py-0 px-1.5 mt-0.5",
            healthy
              ? "text-success bg-success/5 border-success/20"
              : "text-destructive bg-destructive/5 border-destructive/20"
          )}
        >
          {healthy ? okText : failText}
        </Badge>
      </div>
    </div>
  )
}
