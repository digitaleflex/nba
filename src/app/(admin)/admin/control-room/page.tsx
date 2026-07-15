"use client"

import { useEffect, useState, useCallback } from "react"
import {
  Card,
  CardContent,
  Badge,
  cn,
} from "@nba/design-system"
import {
  Radio,
  Mail,
  Bell,
  Users,
  Activity,
  Database,
  Webhook,
  Smartphone,
  AlertTriangle,
  CheckCircle2,
  Inbox,
  MailOpen,
  MousePointerClick,
  ShieldAlert,
  Loader2,
  RefreshCw,
} from "lucide-react"

type FeedItem = {
  kind: string
  at: string
  title: string
  detail: string
  status: "ok" | "warn" | "danger"
}

type ControlRoomData = {
  kpis: {
    activeMembers: number
    membersWithOverride: number
    signalsLast24h: number
    signalsLast7d: number
    emailsSentLast7d: number
    delivered: number
    opened: number
    bounced: number
    complained: number
    openRate: number
    clicks: number
    ctr: number
    topClickLinks: { link: string; count: number }[]
    pushSentLast24h: number
    pushFailedLast24h: number
    pushSubsCount: number
    pendingRequests: number
    pendingKyc: number
  }
  dangerZone: {
    bannedCount: number
    pendingRequests: number
    pendingKyc: number
  }
  funnel: {
    signals: number
    recipients: number
    emailsSent: number
    delivered: number
    opened: number
    clicked: number
    bounced: number
    complained: number
  }
  liveFeed: FeedItem[]
  systemHealth: {
    redis: "healthy" | "error" | "warning"
    webhook: "healthy" | "warning" | "error"
    storage: "healthy" | "warning" | "error"
    pushSubs: number
  }
  alerts: { level: "warn" | "danger"; message: string }[]
}

const REFRESH_MS = 10_000

function healthColor(level: "healthy" | "warning" | "error" | undefined) {
  if (level === "healthy") return "text-emerald-600 bg-emerald-500/5 border-emerald-500/20"
  if (level === "warning") return "text-amber-600 bg-amber-500/5 border-amber-500/20"
  return "text-rose-600 bg-rose-500/5 border-rose-500/20"
}

function healthLabel(level: "healthy" | "warning" | "error" | undefined, ok: string, warn: string, err: string) {
  if (level === "healthy") return ok
  if (level === "warning") return warn
  return err
}

function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime()
  const s = Math.floor(ms / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}min`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}j`
}

function feedIcon(kind: string) {
  switch (kind) {
    case "signal": return <Radio className="size-3.5 text-primary" />
    case "email_delivered": return <Mail className="size-3.5 text-emerald-600" />
    case "email_opened": return <MailOpen className="size-3.5 text-emerald-600" />
    case "email_bounced": return <ShieldAlert className="size-3.5 text-rose-600" />
    case "email_complained": return <ShieldAlert className="size-3.5 text-rose-600" />
    default: return <Inbox className="size-3.5 text-muted-foreground" />
  }
}

export default function ControlRoomPage() {
  const [data, setData] = useState<ControlRoomData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [pulse, setPulse] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/control-room", { cache: "no-store" })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = (await res.json()) as ControlRoomData
      setData(json)
      setError(null)
      setLastUpdate(new Date())
      setPulse(true)
      setTimeout(() => setPulse(false), 600)
    } catch (err: any) {
      setError(err.message || "Erreur de chargement")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const id = setInterval(fetchData, REFRESH_MS)
    return () => clearInterval(id)
  }, [fetchData])

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    )
  }

  const k = data?.kpis
  const f = data?.funnel
  const sh = data?.systemHealth
  const alerts = data?.alerts ?? []

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight">Centre de contrôle</h1>
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] py-0.5 px-2 flex items-center gap-1.5",
                pulse ? "border-emerald-500/40 text-emerald-600 bg-emerald-500/5" : "border-border text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "size-1.5 rounded-full bg-emerald-500",
                  pulse ? "animate-ping" : "animate-pulse",
                )}
              />
              {pulse ? "Actualisé" : "Temps réel"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Vue opérationnelle connectée à la base — signaux, livraisons email & push.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
          <RefreshCw className="size-3" />
          <span>Auto-refresh 10s</span>
          {lastUpdate && <span>· MAJ {timeAgo(lastUpdate.toISOString())}</span>}
          <button
            onClick={fetchData}
            className="ml-1 rounded border border-border bg-card/40 px-2 py-1 text-[10px] hover:bg-muted/50 min-h-[32px]"
          >
            Rafraîchir
          </button>
        </div>
      </div>

      {/* Danger Zone — Tour de contrôle */}
      {data?.dangerZone && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className={cn("border", data.dangerZone.bannedCount > 0 ? "border-rose-500/40 bg-rose-500/5" : "border-border")}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Bannis</p>
                <p className="text-xl font-bold text-foreground">{data.dangerZone.bannedCount}</p>
              </div>
              <ShieldAlert className={cn("size-5", data.dangerZone.bannedCount > 0 ? "text-rose-500" : "text-muted-foreground/30")} />
            </CardContent>
          </Card>
          <Card className={cn("border", data.dangerZone.pendingRequests > 0 ? "border-amber-500/40 bg-amber-500/5" : "border-border")}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Demandes</p>
                <p className="text-xl font-bold text-foreground">{data.dangerZone.pendingRequests}</p>
              </div>
              <Inbox className={cn("size-5", data.dangerZone.pendingRequests > 0 ? "text-amber-500" : "text-muted-foreground/30")} />
            </CardContent>
          </Card>
          <Card className={cn("border", data.dangerZone.pendingKyc > 0 ? "border-amber-500/40 bg-amber-500/5" : "border-border")}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">KYC en attente</p>
                <p className="text-xl font-bold text-foreground">{data.dangerZone.pendingKyc}</p>
              </div>
              <ShieldAlert className={cn("size-5", data.dangerZone.pendingKyc > 0 ? "text-amber-500" : "text-muted-foreground/30")} />
            </CardContent>
          </Card>
          <Card className={cn("border", (data.kpis.bounced ?? 0) > 0 ? "border-rose-500/40 bg-rose-500/5" : "border-border")}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Bounces 24h</p>
                <p className="text-xl font-bold text-foreground">{data.kpis.bounced ?? 0}</p>
              </div>
              <Mail className={cn("size-5", (data.kpis.bounced ?? 0) > 0 ? "text-rose-500" : "text-muted-foreground/30")} />
            </CardContent>
          </Card>
        </div>
      )}

      {error && (
        <Card className="border-rose-500/30 bg-rose-500/5">
          <CardContent className="p-3 text-xs text-rose-700 flex items-center gap-2">
            <AlertTriangle className="size-3.5" /> {error}
          </CardContent>
        </Card>
      )}

      {/* Alertes */}
      {alerts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {alerts.map((a, i) => (
            <Card
              key={i}
              className={cn(
                "border",
                a.level === "danger"
                  ? "border-rose-500/30 bg-rose-500/5"
                  : "border-amber-500/30 bg-amber-500/5",
              )}
            >
              <CardContent className="p-3 flex items-center gap-2 text-xs">
                <AlertTriangle
                  className={cn(
                    "size-4 shrink-0",
                    a.level === "danger" ? "text-rose-600" : "text-amber-600",
                  )}
                />
                <span className="font-medium">{a.message}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard icon={<Radio className="size-4" />} label="Signaux 24h" value={k?.signalsLast24h ?? 0} />
        <KpiCard icon={<Users className="size-4" />} label="Membres actifs" value={k?.activeMembers ?? 0} />
        <KpiCard
          icon={<Mail className="size-4" />}
          label="Délivrés (7j)"
          value={k?.delivered ?? 0}
          sub={`${k?.openRate ?? 0}% d'ouverture`}
        />
        <KpiCard
          icon={<MailOpen className="size-4" />}
          label="Ouverts (7j)"
          value={k?.opened ?? 0}
        />
        <KpiCard
          icon={<MousePointerClick className="size-4" />}
          label="Clics (7j)"
          value={k?.clicks ?? 0}
          sub={`${k?.ctr ?? 0}% CTR`}
        />
        <KpiCard
          icon={<ShieldAlert className="size-4 text-rose-600" />}
          label="Bounces (7j)"
          value={k?.bounced ?? 0}
          danger={(k?.bounced ?? 0) > 0}
        />
        <KpiCard
          icon={<Bell className="size-4" />}
          label="Push envoyés 24h"
          value={k?.pushSentLast24h ?? 0}
          sub={`${k?.pushFailedLast24h ?? 0} échecs`}
        />
      </div>

      {/* Funnel + System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Funnel */}
        <Card className="border-border bg-card/30 lg:col-span-2">
          <CardContent className="p-5">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Funnel de livraison (7 derniers jours)
              </h2>
              <span className="text-[10px] text-muted-foreground">email.sent → delivered → opened</span>
            </div>
            <div className="pt-4 space-y-3">
              <FunnelBar label="Signaux publiés" value={f?.signals ?? 0} max={Math.max(1, f?.signals ?? 1)} color="bg-primary" />
              <FunnelBar label="Destinataires (in-app)" value={f?.recipients ?? 0} max={Math.max(1, f?.signals ?? 1)} color="bg-primary/70" />
              <FunnelBar label="Emails envoyés" value={f?.emailsSent ?? 0} max={Math.max(1, f?.signals ?? 1)} color="bg-blue-500" />
              <FunnelBar label="Délivrés" value={f?.delivered ?? 0} max={Math.max(1, f?.signals ?? 1)} color="bg-emerald-500" />
              <FunnelBar label="Ouverts" value={f?.opened ?? 0} max={Math.max(1, f?.signals ?? 1)} color="bg-emerald-400" />
              <FunnelBar label="Clics" value={f?.clicked ?? 0} max={Math.max(1, f?.signals ?? 1)} color="bg-emerald-300" />
              {((f?.bounced ?? 0) > 0 || (f?.complained ?? 0) > 0) && (
                <>
                  <FunnelBar label="Bounces" value={f?.bounced ?? 0} max={Math.max(1, f?.signals ?? 1)} color="bg-rose-500" />
                  <FunnelBar label="Plaintes" value={f?.complained ?? 0} max={Math.max(1, f?.signals ?? 1)} color="bg-rose-600" />
                </>
              )}
            </div>

            {/* Top liens cliqués (Sprint 2 #63) */}
            {(k?.topClickLinks ?? []).length > 0 && (
              <div className="pt-4 mt-4 border-t border-border/60">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground pb-2">
                  Top liens cliqués (7j)
                </h3>
                <div className="space-y-1.5">
                  {k!.topClickLinks.map((l) => (
                    <div key={l.link} className="flex items-center justify-between gap-2 text-[11px]">
                      <span className="truncate font-mono text-foreground/80" title={l.link}>
                        {l.link}
                      </span>
                      <span className="font-bold text-primary whitespace-nowrap">{l.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Health */}
        <Card className="border-border bg-card/30">
          <CardContent className="p-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground pb-3 border-b border-border">
              Santé du système
            </h2>
            <div className="pt-3 space-y-3 text-xs">
              <HealthRow
                icon={<Database className="size-4" />}
                name="Redis"
                level={sh?.redis}
                label={healthLabel(sh?.redis, "En ligne", "Ralenti", "Injoignable")}
              />
              <HealthRow
                icon={<Webhook className="size-4" />}
                name="Webhook Resend"
                level={sh?.webhook}
                label={healthLabel(sh?.webhook, "Configuré", "Fallback API", "Erreur")}
              />
              <HealthRow
                icon={<Activity className="size-4" />}
                name="Stockage"
                level={sh?.storage}
                label={healthLabel(sh?.storage, "Normal", "Attention", "Erreur")}
              />
              <HealthRow
                icon={<Smartphone className="size-4" />}
                name="Push subscriptions"
                level="healthy"
                label={`${sh?.pushSubs ?? 0} actifs`}
              />
              <div className="pt-2 border-t border-border/60 text-[10px] text-muted-foreground flex items-center gap-1.5">
                <Users className="size-3" /> {k?.membersWithOverride ?? 0} membre(s) avec accès override
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Feed */}
      <Card className="border-border bg-card/30">
        <CardContent className="p-5">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Flux temps réel
              </h2>
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <span className="text-[10px] text-muted-foreground">
              Derniers signaux & événements email
            </span>
          </div>
          <div className="pt-2 max-h-[420px] overflow-y-auto divide-y divide-border/60">
            {(data?.liveFeed ?? []).length === 0 && (
              <div className="py-8 text-center text-xs text-muted-foreground">
                Aucun événement récent.
              </div>
            )}
            {(data?.liveFeed ?? []).map((item, idx) => (
              <div key={idx} className="flex items-start gap-3 py-2.5">
                <div className="mt-0.5 shrink-0">{feedIcon(item.kind)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-foreground">{item.title}</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[9px] py-0 px-1.5",
                        item.status === "ok" && "text-emerald-600 border-emerald-500/20",
                        item.status === "warn" && "text-amber-600 border-amber-500/20",
                        item.status === "danger" && "text-rose-600 border-rose-500/20",
                      )}
                    >
                      {item.status === "ok" ? "OK" : item.status === "warn" ? "!" : "ALERTE"}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground truncate">{item.detail}</p>
                </div>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap mt-0.5">
                  {timeAgo(item.at)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function KpiCard({
  icon,
  label,
  value,
  sub,
  danger,
}: {
  icon: React.ReactNode
  label: string
  value: number | string
  sub?: string
  danger?: boolean
}) {
  return (
    <Card className="border-border bg-card/30">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
            {label}
          </span>
          {icon}
        </div>
        <p
          className={cn(
            "text-2xl font-bold mt-2",
            danger ? "text-rose-600" : "text-foreground",
          )}
        >
          {value}
        </p>
        {sub && <p className="text-[10px] text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  )
}

function FunnelBar({
  label,
  value,
  max,
  color,
}: {
  label: string
  value: number
  max: number
  color: string
}) {
  const pct = Math.max(2, Math.min(100, (value / max) * 100))
  return (
    <div>
      <div className="flex items-center justify-between text-[11px] mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-bold text-foreground">{value}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted/40 overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function HealthRow({
  icon,
  name,
  level,
  label,
}: {
  icon: React.ReactNode
  name: string
  level: "healthy" | "warning" | "error" | undefined
  label: string
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 text-foreground">
        {icon}
        <span className="font-bold">{name}</span>
      </div>
      <Badge variant="outline" className={cn("text-[10px] py-0 px-2", healthColor(level))}>
        {level === "healthy" && <CheckCircle2 className="size-3 mr-1" />}
        {level === "warning" && <AlertTriangle className="size-3 mr-1" />}
        {level === "error" && <AlertTriangle className="size-3 mr-1" />}
        {label}
      </Badge>
    </div>
  )
}
