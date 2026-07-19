"use client"

import { useEffect, useState, useCallback } from "react"
import {
  Card,
  CardContent,
  Badge,
  cn,
} from "@nba/design-system"
import {
  Database,
  Activity,
  Radio,
  Mail,
  Bell,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Cpu,
  Users,
  HardDrive,
  Clock,
  Zap,
  XCircle,
} from "lucide-react"

type CacheStatusData = {
  cache: {
    hits: number
    misses: number
    invalidations: number
    total: number
    ratio: string
  }
  redis: Record<string, any>
  queues: { name: string; failed: number; waiting: number; active: number; delayed: number }[]
  websocket: string
  issues: {
    totalFailedDeliveries: number
    recentFailedDeliveries: any[]
    affectedUserCount: number
    recentAuditErrors: any[]
  }
}

const REFRESH_MS = 15_000

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

function healthColor(level: string) {
  if (level === "healthy") return "text-emerald-600 bg-emerald-500/5 border-emerald-500/20"
  if (level === "degraded") return "text-amber-600 bg-amber-500/5 border-amber-500/20"
  return "text-rose-600 bg-rose-500/5 border-rose-500/20"
}

export default function CacheStatusPage() {
  const [data, setData] = useState<CacheStatusData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [pulse, setPulse] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/cache/status", { cache: "no-store" })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = (await res.json()) as CacheStatusData
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

  const redis = data?.redis
  const cache = data?.cache
  const queues = data?.queues ?? []
  const issues = data?.issues

  const redisStatus = redis?.status === "healthy" ? "healthy" : "error"
  const anyQueueFailed = queues.some((q) => q.failed > 0)
  const totalFailed = queues.reduce((s, q) => s + q.failed, 0)
  const totalWaiting = queues.reduce((s, q) => s + q.waiting, 0)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight">Cache &amp; Services</h1>
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
            Surveillance du cache Redis, files d&apos;attente et workers en temps réel.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
          <RefreshCw className="size-3" />
          <span>Auto-refresh 15s</span>
          {lastUpdate && <span>· MAJ {timeAgo(lastUpdate.toISOString())}</span>}
          <button
            onClick={fetchData}
            className="ml-1 rounded border border-border bg-card/40 px-2 py-1 text-[10px] hover:bg-muted/50 min-h-[32px]"
          >
            Rafraîchir
          </button>
        </div>
      </div>

      {error && (
        <Card className="border-rose-500/30 bg-rose-500/5">
          <CardContent className="p-3 text-xs text-rose-700 flex items-center gap-2">
            <AlertTriangle className="size-3.5" /> {error}
          </CardContent>
        </Card>
      )}

      {/* Statut général */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className={cn("border", redisStatus === "healthy" ? "border-emerald-500/40 bg-emerald-500/5" : "border-rose-500/40 bg-rose-500/5")}>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">Redis</p>
              <p className="text-xl font-bold text-foreground">{redisStatus === "healthy" ? "OK" : "DOWN"}</p>
              {redis?.version && <p className="text-[10px] text-muted-foreground mt-1">v{redis.version}</p>}
            </div>
            <Database className={cn("size-5", redisStatus === "healthy" ? "text-emerald-500" : "text-rose-500")} />
          </CardContent>
        </Card>
        <Card className={cn("border", anyQueueFailed ? "border-amber-500/40 bg-amber-500/5" : "border-border")}>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">Files d&apos;attente</p>
              <p className="text-xl font-bold text-foreground">{totalFailed} échec(s)</p>
              <p className="text-[10px] text-muted-foreground mt-1">{totalWaiting} en attente</p>
            </div>
            <Activity className={cn("size-5", anyQueueFailed ? "text-amber-500" : "text-muted-foreground/30")} />
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">WebSocket</p>
              <p className={cn("text-xl font-bold", data?.websocket?.startsWith("healthy") ? "text-emerald-600" : "text-rose-600")}>
                {data?.websocket?.startsWith("healthy") ? "OK" : "DOWN"}
              </p>
            </div>
            <Radio className="size-5 text-muted-foreground/60" />
          </CardContent>
        </Card>
        <Card className={cn("border", (issues?.totalFailedDeliveries ?? 0) > 0 ? "border-amber-500/40 bg-amber-500/5" : "border-border")}>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">Livraisons en échec</p>
              <p className="text-xl font-bold text-foreground">{issues?.totalFailedDeliveries ?? 0}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{issues?.affectedUserCount ?? 0} user(s) touché(s)</p>
            </div>
            <AlertTriangle className={cn("size-5", (issues?.totalFailedDeliveries ?? 0) > 0 ? "text-amber-500" : "text-muted-foreground/30")} />
          </CardContent>
        </Card>
      </div>

      {/* Redis metrics */}
      {redis && redis.status === "healthy" && (
        <Card className="border-border bg-card/30">
          <CardContent className="p-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground pb-3 border-b border-border flex items-center gap-2">
              <Cpu className="size-3.5" /> Métriques Redis
            </h2>
            <div className="pt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <Metric label="Uptime" value={`${Math.floor((redis.uptime || 0) / 3600)}h ${Math.floor(((redis.uptime || 0) % 3600) / 60)}min`} icon={<Clock className="size-3.5" />} />
              <Metric label="Mémoire utilisée" value={redis.usedMemory || "?"} icon={<HardDrive className="size-3.5" />} />
              <Metric label="Clients connectés" value={redis.connectedClients ?? "?"} icon={<Users className="size-3.5" />} />
              <Metric label="Clés totales" value={redis.totalKeys ?? "?"} icon={<Database className="size-3.5" />} />
              <Metric label="Cache hit ratio" value={redis.hitRatio || "N/A"} icon={<Zap className="size-3.5" />} />
              <Metric label="Total connexions" value={redis.totalConnectionsReceived ?? "?"} icon={<Activity className="size-3.5" />} />
              <Metric label="OS" value={redis.os || "?"} icon={<Cpu className="size-3.5" />} />
              <Metric label="PID" value={redis.processId ?? "?"} icon={<Activity className="size-3.5" />} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cache stats + Queues */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Cache stats */}
        <Card className="border-border bg-card/30">
          <CardContent className="p-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground pb-3 border-b border-border flex items-center gap-2">
              <Zap className="size-3.5" /> Cache applicatif
            </h2>
            <div className="pt-3 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Hit ratio</span>
                <span className={cn("font-bold", cache && cache.ratio !== "N/A" && parseFloat(cache.ratio) < 50 ? "text-rose-600" : "text-foreground")}>
                  {cache?.ratio ?? "N/A"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Hits</span>
                <span className="font-bold text-foreground">{cache?.hits ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Misses</span>
                <span className="font-bold text-foreground">{cache?.misses ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Invalidations</span>
                <span className="font-bold text-foreground">{cache?.invalidations ?? 0}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border/60">
                <span className="text-muted-foreground">Requêtes totales</span>
                <span className="font-bold text-foreground">{cache?.total ?? 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Queues */}
        <Card className="border-border bg-card/30">
          <CardContent className="p-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground pb-3 border-b border-border flex items-center gap-2">
              <Activity className="size-3.5" /> Files BullMQ
            </h2>
            <div className="pt-3 space-y-3">
              {queues.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Aucune donnée de file disponible.
                </p>
              )}
              {queues.map((q) => (
                <div key={q.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "size-2 rounded-full",
                      q.failed > 0 ? "bg-rose-500" : q.waiting > 0 ? "bg-amber-500" : "bg-emerald-500",
                    )} />
                    <span className="font-medium text-foreground">{q.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <span className={q.failed > 0 ? "text-rose-600 font-bold" : ""}>{q.failed} échec</span>
                    <span>{q.waiting} attente</span>
                    <span>{q.active} actif</span>
                    <span>{q.delayed} différé</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* WebSocket status */}
      <Card className="border-border bg-card/30">
        <CardContent className="p-5">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Radio className="size-3.5" /> WebSocket
            </h2>
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] py-0 px-2",
                data?.websocket?.startsWith("healthy")
                  ? "text-emerald-600 border-emerald-500/20"
                  : "text-rose-600 border-rose-500/20",
              )}
            >
              {data?.websocket?.startsWith("healthy") ? (
                <><CheckCircle2 className="size-3 mr-1" /> {data.websocket}</>
              ) : (
                <><XCircle className="size-3 mr-1" /> {data?.websocket ?? "inconnu"}</>
              )}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Issues section */}
      {issues && issues.totalFailedDeliveries > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 pb-3 border-b border-amber-500/20">
              <AlertTriangle className="size-4 text-amber-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-amber-700">
                Problèmes de livraison (24h)
              </h2>
              <Badge variant="outline" className="text-[10px] py-0 px-2 text-amber-600 border-amber-500/30">
                {issues.totalFailedDeliveries} échec(s) · {issues.affectedUserCount} user(s)
              </Badge>
            </div>
            <div className="pt-3 max-h-[300px] overflow-y-auto space-y-2">
              {issues.recentFailedDeliveries.map((d: any) => (
                <div key={d.id} className="flex items-start gap-2 text-[11px] p-2 rounded bg-background/50">
                  <XCircle className="size-3.5 text-rose-500 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-foreground">
                      {d.channel === "EMAIL" ? "Email" : d.channel}
                    </span>
                    <span className="text-muted-foreground ml-1">
                      {d.status === "BOUNCED" ? "bounced" : "failed"}
                    </span>
                    {d.errorMessage && (
                      <p className="text-[10px] text-muted-foreground truncate">{d.errorMessage}</p>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {timeAgo(d.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent audit errors */}
      {issues && issues.recentAuditErrors && issues.recentAuditErrors.length > 0 && (
        <Card className="border-border bg-card/30">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 pb-3 border-b border-border">
              <Activity className="size-4 text-muted-foreground" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Activité récente
              </h2>
            </div>
            <div className="pt-3 max-h-[250px] overflow-y-auto space-y-1.5">
              {issues.recentAuditErrors.slice(0, 15).map((e: any) => (
                <div key={e.id} className="flex items-center justify-between text-[11px] py-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-foreground/80 truncate">{e.action}</span>
                    {e.user && (
                      <span className="text-muted-foreground truncate hidden sm:inline">
                        — {e.user.name || e.user.email}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                    {timeAgo(e.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function Metric({
  label,
  value,
  icon,
}: {
  label: string
  value: string | number
  icon: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-muted/20 border border-border/50">
      <div className="text-muted-foreground shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground truncate">{label}</p>
        <p className="text-xs font-bold text-foreground truncate">{value}</p>
      </div>
    </div>
  )
}
