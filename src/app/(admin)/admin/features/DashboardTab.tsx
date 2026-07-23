"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Users, ListTodo, FileCheck, Radio, Server, Activity, Laptop, Loader2,
  ShieldAlert,
} from "lucide-react"
import { Card, CardContent, Badge, cn, Chart, EmptyState } from "@nba/design-system"
import { AlertsPanel } from "../components/alerts-panel"
import { HeroNumber } from "../components/HeroNumber"

interface DashboardTabProps {
  opsData: any
  loadingOps: boolean
  errorOps: string | null
  router: ReturnType<typeof useRouter>
}

export function DashboardTab({ opsData, loadingOps, errorOps, router }: DashboardTabProps) {
  const [secData, setSecData] = useState<any>(null)

  useEffect(() => {
    fetch("/api/admin/security/fraud/abuse")
      .then(r => r.json())
      .then(d => setSecData(d.summary))
      .catch(() => {})
  }, [])

  return (
    <div className="space-y-7">
      <div className="flex items-center justify-between border-b border-border/40 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Operations Center</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Surveillez l&apos;état opérationnel et traitez les tâches prioritaires.
          </p>
        </div>
        <Badge variant="outline" className="text-[10px] text-emerald-600 bg-emerald-500/5 border-emerald-500/20 py-1 px-2.5 shrink-0">
          <span className="inline-block size-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
          Live
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-7">
        <div className="lg:col-span-3 space-y-7">

      {errorOps ? (
        <div className="py-20 text-center text-rose-600 text-sm" role="alert">{errorOps}</div>
      ) : loadingOps ? (
        <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
      ) : (
        <>
          <HeroNumber
            value={(secData?.highEvents ?? 0) + (secData?.blockedIps ?? 0) + (secData?.suspendedAccounts ?? 0) + (secData?.blockedDevices ?? 0)}
            label="alertes sécurité actives"
            status={(secData?.highEvents ?? 0) > 0 ? "critical" : (secData?.blockedIps ?? 0) > 0 ? "warning" : "calm"}
            icon={ShieldAlert}
            subtitle={
              (opsData?.attention?.kycPendingCount ?? 0) > 0 || (opsData?.attention?.brokerPendingCount ?? 0) > 0 || (opsData?.attention?.requestsPendingCount ?? 0) > 0
                ? `${(opsData?.attention?.kycPendingCount ?? 0) + (opsData?.attention?.brokerPendingCount ?? 0) + (opsData?.attention?.requestsPendingCount ?? 0)} tâches administratives en attente`
                : undefined
            }
            details={[
              { label: "Événements HAUT", value: secData?.highEvents ?? 0, color: (secData?.highEvents ?? 0) > 0 ? "text-red-500" : "text-muted-foreground" },
              { label: "IPs bloquées", value: secData?.blockedIps ?? 0, color: (secData?.blockedIps ?? 0) > 0 ? "text-purple-500" : "text-muted-foreground" },
              { label: "Suspendus", value: secData?.suspendedAccounts ?? 0, color: (secData?.suspendedAccounts ?? 0) > 0 ? "text-rose-500" : "text-muted-foreground" },
              { label: "Appareils bloqués", value: secData?.blockedDevices ?? 0, color: (secData?.blockedDevices ?? 0) > 0 ? "text-amber-500" : "text-muted-foreground" },
            ]}
          />

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard icon={Users} label="Membres actifs" value={opsData.stats.totalMembers} />
            <KpiCard icon={ListTodo} label="Demandes en attente" value={opsData.attention.requestsPendingCount} />
            <KpiCard icon={FileCheck} label="KYC à traiter" value={opsData.attention.kycPendingCount} />
            <KpiCard icon={Radio} label="Signaux publiés" value={opsData.stats.publishedSignalsCount} />
          </div>


          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <Card className="border-border/60 bg-card shadow-sm lg:col-span-2">
              <CardContent className="p-5">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground pb-3.5 border-b border-border/40">Inscriptions (7 jours)</h3>
                <div className="pt-4">
                  <Chart type="bar" data={(opsData.activityGraph ?? []).map((d: any) => ({ label: d.day, value: d.count }))} emptyText="Aucune inscription cette semaine" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/60 bg-card shadow-sm">
              <CardContent className="p-5">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground pb-3.5 border-b border-border/40">Activités récentes</h3>
                <div className="pt-4 space-y-3.5 max-h-48 overflow-y-auto">
                  {opsData.recentActivities.length > 0 ? opsData.recentActivities.map((act: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-2.5 text-[10px]">
                      <span className="size-1.5 rounded-full bg-neutral-400 mt-1 shrink-0" />
                      <div>
                        <p className="font-semibold text-foreground leading-snug">{act.action}</p>
                        <p className="text-[9px] text-muted-foreground mt-0.5">{act.user?.name || "System"} • {new Date(act.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  )) : (
                    <EmptyState icon={Activity} title="Aucune activité récente" description="Les actions des administrateurs apparaîtront ici." />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border/60 bg-card shadow-sm">
            <CardContent className="p-5">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground pb-3.5 border-b border-border/40">Santé du Système</h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-4 text-xs">
                <SysHealth icon={Server} label="Redis" healthy={opsData.systemStatus.redis === "healthy"} />
                <SysHealth icon={Activity} label="BullMQ Workers" healthy={opsData.systemStatus.bullmq === "healthy"} okText="Actifs" failText="Ralentis" />
                <SysHealth icon={Laptop} label="Stockage" healthy={opsData.systemStatus.storage === "healthy"} okText="Normal" failText="Presque plein" />
              </div>
            </CardContent>
          </Card>
        </>
        )}
        </div>

        <aside className="lg:col-span-1 space-y-5">
          <AlertsPanel />
        </aside>
      </div>
    </div>
  )
}

function KpiCard({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <Card className="border-border/60 bg-card shadow-sm">
      <CardContent className="p-4 flex items-center justify-between">
        <div className="space-y-0.5">
          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">{label}</p>
          <p className="text-xl font-bold text-foreground">{value}</p>
        </div>
        <Icon className="size-5 text-muted-foreground/40" />
      </CardContent>
    </Card>
  )
}

function SysHealth({ icon: Icon, label, healthy, okText = "En ligne", failText = "Échec" }: { icon: any; label: string; healthy: boolean; okText?: string; failText?: string }) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="size-4 text-muted-foreground" />
      <div>
        <p className="font-bold text-foreground">{label}</p>
        <Badge variant="outline" className={cn("text-[9px] py-0 px-1.5 mt-0.5", healthy ? "text-emerald-600 bg-emerald-500/5 border-emerald-500/20" : "text-rose-600 bg-rose-500/5 border-rose-500/20")}>
          {healthy ? okText : failText}
        </Badge>
      </div>
    </div>
  )
}
