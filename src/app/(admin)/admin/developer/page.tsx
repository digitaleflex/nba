"use client"

import { useEffect, useState } from "react"
import { Loader2, Activity, FileJson, Clock, Database, Terminal, Server, Box } from "lucide-react"
import { Card, CardContent, Badge } from "@nba/design-system"

interface SpecInfo {
  openapi: string
  info: { title: string; version: string; description: string }
  paths: Record<string, unknown>
  tags: { name: string; description: string }[]
}

interface Metrics {
  timestamp: string
  users: { total: number; active: number }
  sessions: { active: number }
  security: { highCritical24h: number; rateLimitExceeded24h: number }
  system: { redis: string; blockedIps: number }
}

export default function DeveloperPage() {
  const [spec, setSpec] = useState<SpecInfo | null>(null)
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch("/api/docs/openapi.json").then(r => r.json()),
      fetch("/api/admin/metrics").then(r => r.json()).catch(() => null),
    ]).then(([s, m]) => {
      setSpec(s)
      setMetrics(m)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="size-6 animate-spin" /></div>

  const pathCount = spec?.paths ? Object.keys(spec.paths).length : 0
  const tagCount = spec?.tags?.length || 0

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Terminal className="size-5" />
            Mode Développeur
          </h1>
          <p className="text-xs text-muted-foreground mt-1">Outils et informations techniques</p>
        </div>
        <Badge variant="outline" className="text-[10px] text-emerald-600">
          {spec?.info.version || "v1.0.0"}
        </Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <DevCard icon={FileJson} label="Endpoints API" value={pathCount} />
        <DevCard icon={Box} label="Tags OpenAPI" value={tagCount} />
        <DevCard icon={Server} label="Redis" value={metrics?.system?.redis === "ok" ? "OK" : "ERR"} color={metrics?.system?.redis === "ok" ? "text-emerald-500" : "text-red-500"} />
        <DevCard icon={Activity} label="Alertes 24h" value={metrics?.security?.highCritical24h ?? "?"} color="text-orange-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card><CardContent className="p-5 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <FileJson className="size-3.5" />
            Spécification OpenAPI
          </h3>
          <div className="text-xs space-y-2">
            <p><span className="text-muted-foreground">Version :</span> <span className="font-mono">{spec?.openapi || "—"}</span></p>
            <p><span className="text-muted-foreground">API :</span> <span className="font-medium">{spec?.info?.title} v{spec?.info?.version}</span></p>
            <p className="text-muted-foreground">{spec?.info?.description}</p>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            {spec?.tags?.map(t => (
              <Badge key={t.name} variant="outline" className="text-[10px]">{t.name}</Badge>
            ))}
          </div>
          <div className="pt-2">
            <a href="/api/docs" className="text-xs text-primary hover:underline underline-offset-2">
              Ouvrir Swagger UI →
            </a>
          </div>
        </CardContent></Card>

        <Card><CardContent className="p-5 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Terminal className="size-3.5" />
            Commandes utiles
          </h3>
          <div className="space-y-2 text-xs font-mono bg-accent/20 p-3 rounded-lg">
            <p className="text-muted-foreground"># Smoke test API</p>
            <p>bash scripts/api-smoke-test.sh</p>
            <p className="text-muted-foreground pt-2"># Métriques système</p>
            <p>curl /api/admin/metrics | jq</p>
            <p className="text-muted-foreground pt-2"># Digest sécurité</p>
            <p>curl -X POST /api/admin/security/digest</p>
            <p className="text-muted-foreground pt-2"># Spécification OpenAPI</p>
            <p>curl /api/docs/openapi.json | jq</p>
          </div>
        </CardContent></Card>
      </div>

      <Card><CardContent className="p-5 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Accès rapides</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <QuickLink href="/api/docs" icon={FileJson} label="Swagger UI" />
          <QuickLink href="/admin/queues" icon={Clock} label="BullMQ" />
          <QuickLink href="/admin/cache" icon={Database} label="Cache Redis" />
          <QuickLink href="/admin/webhooks/dlq" icon={Activity} label="Webhooks DLQ" />
        </div>
      </CardContent></Card>
    </div>
  )
}

function DevCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color?: string }) {
  return (
    <Card className="border-border bg-card/30">
      <CardContent className="p-4 flex items-center gap-3">
        <Icon className={`size-5 ${color || "text-muted-foreground"}`} />
        <div>
          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{label}</p>
          <p className={`text-lg font-bold ${color || "text-foreground"}`}>{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function QuickLink({ href, icon: Icon, label }: { href: string; icon: any; label: string }) {
  return (
    <a href={href} className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent/30 transition-colors text-xs">
      <Icon className="size-4 text-muted-foreground" />
      <span>{label}</span>
    </a>
  )
}
