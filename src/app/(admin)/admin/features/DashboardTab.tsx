"use client"

import { useRouter } from "next/navigation"
import {
  ArrowRight, Users, ListTodo, FileCheck, Radio, Server, Activity, Laptop, Loader2,
} from "lucide-react"
import { Card, CardContent, Badge, cn, Chart } from "@nba/design-system"
import { AlertsPanel } from "../components/alerts-panel"

interface DashboardTabProps {
  opsData: any
  loadingOps: boolean
  errorOps: string | null
  router: ReturnType<typeof useRouter>
}

export function DashboardTab({ opsData, loadingOps, errorOps, router }: DashboardTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Operations Center</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Surveillez l&apos;état opérationnel et traitez les tâches prioritaires.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AlertsPanel />
          <Badge variant="outline" className="text-[10px] text-emerald-600 bg-emerald-500/5 border-emerald-500/20 py-1 px-2.5">
            ● Live System
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">

      {errorOps ? (
        <div className="py-20 text-center text-rose-600 text-sm">{errorOps}</div>
      ) : loadingOps ? (
        <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
      ) : (
        <>
          {/* SECTION PRIORITAIRE : À TRAITER MAINTENANT */}
          <Card className="border-border bg-card/50 backdrop-blur-md shadow-xs">
            <CardContent className="p-6">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground pb-4 border-b border-border">
                À traiter maintenant
              </h2>
              <div className="divide-y divide-border">
                {/* KYC Alert */}
                {opsData?.attention?.kycPendingCount > 0 ? (
                  <div
                    onClick={() => router.push("/admin?tab=kyc")}
                    className="flex items-center justify-between py-3.5 hover:bg-muted/40 px-2 rounded-xl transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="size-2 rounded-full bg-rose-500 animate-pulse" />
                      <span className="font-semibold text-xs text-foreground">
                        {opsData.attention.kycPendingCount} dossiers KYC en attente de vérification
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground group-hover:text-foreground transition-colors">
                      <span>Traiter</span>
                      <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                ) : null}

                {/* Broker Alert */}
                {opsData?.attention?.brokerPendingCount > 0 ? (
                  <div
                    onClick={() => router.push("/admin?tab=broker")}
                    className="flex items-center justify-between py-3.5 hover:bg-muted/40 px-2 rounded-xl transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="size-2 rounded-full bg-amber-500" />
                      <span className="font-semibold text-xs text-foreground">
                        {opsData.attention.brokerPendingCount} vérifications Broker à valider
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground group-hover:text-foreground transition-colors">
                      <span>Traiter</span>
                      <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                ) : null}

                {/* Access Requests Alert */}
                {opsData?.attention?.requestsPendingCount > 0 ? (
                  <div
                    onClick={() => router.push("/admin?tab=requests")}
                    className="flex items-center justify-between py-3.5 hover:bg-muted/40 px-2 rounded-xl transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="size-2 rounded-full bg-blue-500" />
                      <span className="font-semibold text-xs text-foreground">
                        {opsData.attention.requestsPendingCount} demandes d&apos;accès à examiner
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground group-hover:text-foreground transition-colors">
                      <span>Examiner</span>
                      <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                ) : null}

                {/* Scheduled Signal Alert */}
                {opsData?.attention?.nextScheduledSignal ? (
                  <div
                    onClick={() => router.push("/admin?tab=signals")}
                    className="flex items-center justify-between py-3.5 hover:bg-muted/40 px-2 rounded-xl transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="size-2 rounded-full bg-emerald-500" />
                      <span className="font-semibold text-xs text-foreground">
                        1 signal programmé pour publication le {new Date(opsData.attention.nextScheduledSignal.scheduledAt).toLocaleString("fr-FR")}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground group-hover:text-foreground transition-colors">
                      <span>Voir</span>
                      <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                ) : null}

                {/* All Clear state */}
                {opsData?.attention?.kycPendingCount === 0 &&
                  opsData?.attention?.brokerPendingCount === 0 &&
                  opsData?.attention?.requestsPendingCount === 0 && (
                    <div className="py-6 text-center text-xs text-muted-foreground select-none">
                      🟢 Aucune intervention urgente requise. Système nominal.
                    </div>
                  )}
              </div>
            </CardContent>
          </Card>

          {/* KPIS CARDS ROW */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-border bg-card/30">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Membres Actifs</p>
                  <p className="text-xl font-bold text-foreground">{opsData.stats.totalMembers}</p>
                </div>
                <Users className="size-5 text-muted-foreground/60" />
              </CardContent>
            </Card>

            <Card className="border-border bg-card/30">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Demandes en attente</p>
                  <p className="text-xl font-bold text-foreground">{opsData.attention.requestsPendingCount}</p>
                </div>
                <ListTodo className="size-5 text-muted-foreground/60" />
              </CardContent>
            </Card>

            <Card className="border-border bg-card/30">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">KYC à traiter</p>
                  <p className="text-xl font-bold text-foreground">{opsData.attention.kycPendingCount}</p>
                </div>
                <FileCheck className="size-5 text-muted-foreground/60" />
              </CardContent>
            </Card>

            <Card className="border-border bg-card/30">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Signaux publiés</p>
                  <p className="text-xl font-bold text-foreground">{opsData.stats.publishedSignalsCount}</p>
                </div>
                <Radio className="size-5 text-muted-foreground/60" />
              </CardContent>
            </Card>
          </div>

          {/* GRAPH & TIMELINE ROW */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Graph (7 days activity) */}
            <Card className="border-border bg-card/20 lg:col-span-2">
              <CardContent className="p-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground pb-4 border-b border-border">
                  Inscriptions (7 derniers jours)
                </h3>
                <Chart
                  type="bar"
                  data={(opsData.activityGraph ?? []).map((d: any) => ({ label: d.day, value: d.count }))}
                  emptyText="Aucune inscription cette semaine"
                />
              </CardContent>
            </Card>

            {/* Recent Activity Timeline */}
            <Card className="border-border bg-card/20">
              <CardContent className="p-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground pb-4 border-b border-border">
                  Activités récentes
                </h3>
                <div className="pt-4 space-y-4 max-h-48 overflow-y-auto">
                  {opsData.recentActivities.length > 0 ? (
                    opsData.recentActivities.map((act: any, idx: number) => (
                      <div key={idx} className="flex items-start gap-2.5 text-[10px]">
                        <span className="size-1.5 rounded-full bg-neutral-400 mt-1 shrink-0" />
                        <div>
                          <p className="font-semibold text-foreground">
                            {act.action}
                          </p>
                          <p className="text-[9px] text-muted-foreground">
                            {act.user?.name || "System"} • {new Date(act.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-6 text-center text-xs text-muted-foreground select-none">
                      Aucune activité récente.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ALERTES SANTE INFRASTRUCTURE */}
          <Card className="border-border bg-card/20">
            <CardContent className="p-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground pb-4 border-b border-border">
                Santé du Système
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-4 text-xs">
                <div className="flex items-center gap-3">
                  <Server className="size-4 text-muted-foreground" />
                  <div>
                    <p className="font-bold text-foreground">Redis Server</p>
                    <Badge variant="outline" className={cn("text-[9px] py-0 px-1.5 mt-0.5", opsData.systemStatus.redis === "healthy" ? "text-emerald-600 bg-emerald-500/5 border-emerald-500/20" : "text-rose-600 bg-rose-500/5 border-rose-500/20")}>
                      {opsData.systemStatus.redis === "healthy" ? "En ligne" : "Échec"}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Activity className="size-4 text-muted-foreground" />
                  <div>
                    <p className="font-bold text-foreground">BullMQ Workers</p>
                    <Badge variant="outline" className={cn("text-[9px] py-0 px-1.5 mt-0.5", opsData.systemStatus.bullmq === "healthy" ? "text-emerald-600 bg-emerald-500/5 border-emerald-500/20" : "text-amber-600 bg-amber-500/5 border-amber-500/20")}>
                      {opsData.systemStatus.bullmq === "healthy" ? "Actifs (Concurrence 10)" : "Ralentis"}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Laptop className="size-4 text-muted-foreground" />
                  <div>
                    <p className="font-bold text-foreground">Stockage Disque</p>
                    <Badge variant="outline" className={cn("text-[9px] py-0 px-1.5 mt-0.5", opsData.systemStatus.storage === "healthy" ? "text-emerald-600 bg-emerald-500/5 border-emerald-500/20" : "text-amber-600 bg-amber-500/5 border-amber-500/20")}>
                      {opsData.systemStatus.storage === "healthy" ? "Normal (15% RAM)" : "Presque plein"}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
        )}
        </div>

        <aside className="lg:col-span-1">
          <AlertsPanel />
        </aside>
      </div>
    </div>
  )
}
