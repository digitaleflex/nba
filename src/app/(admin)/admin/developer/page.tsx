"use client"

import { useEffect, useState, useCallback } from "react"
import { Loader2, Terminal, Server, Database, Activity, FileJson, Box, RefreshCw, Eye, EyeOff, Cpu, Zap, AlertTriangle } from "lucide-react"
import { Card, CardContent, Badge, Button } from "@nba/design-system"
import { toast } from "sonner"

export default function DeveloperPage() {
  const [tab, setTab] = useState<"system" | "env" | "db" | "api">("system")
  const [sysInfo, setSysInfo] = useState<any>(null)
  const [envVars, setEnvVars] = useState<any[]>([])
  const [dbStats, setDbStats] = useState<any>(null)
  const [spec, setSpec] = useState<any>(null)
  const [circuits, setCircuits] = useState<any>(null)
  const [showSecrets, setShowSecrets] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [sys, env, db, specRes, circ] = await Promise.all([
        fetch("/api/admin/system").then(r => r.json()).catch(() => null),
        fetch("/api/admin/env").then(r => r.json()).catch(() => ({ vars: [], count: 0 })),
        fetch("/api/admin/db").then(r => r.json()).catch(() => null),
        fetch("/api/docs/openapi.json").then(r => r.json()).catch(() => null),
        fetch("/api/admin/operations").then(r => r.json()).catch(() => null),
      ])
      setSysInfo(sys)
      setEnvVars(env.vars || [])
      setDbStats(db)
      setSpec(specRes)
      setCircuits(circ?.circuitBreakers || null)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  async function resetCircuit(name: string) {
    await fetch("/api/admin/circuit-breaker", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) })
    toast.success(`Circuit ${name} reset`)
    loadAll()
  }

  if (loading && !sysInfo) return <div className="flex items-center justify-center py-20"><Loader2 className="size-6 animate-spin" /></div>

  const pathCount = spec?.paths ? Object.keys(spec.paths).length : "?"
  const isDegraded = circuits && Object.values(circuits).some((v: any) => v === "open")

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Terminal className="size-5" /> Mode Développeur
          </h1>
          <p className="text-xs text-muted-foreground mt-1">Contrôle total de la plateforme</p>
        </div>
        <div className="flex items-center gap-2">
          {isDegraded && <Badge className="text-[10px] bg-red-500/10 text-red-500 border-red-500/20">⚠ Circuits dégradés</Badge>}
          <Button size="sm" variant="outline" onClick={loadAll}><RefreshCw className="size-3.5 mr-1" /> Rafraîchir</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard icon={Cpu} label="Node.js" value={sysInfo?.node || "—"} />
        <StatCard icon={Server} label="Uptime" value={sysInfo?.uptime ? `${Math.round(sysInfo.uptime / 3600)}h` : "—"} />
        <StatCard icon={Database} label="RAM" value={sysInfo?.memory?.rss || "—"} />
        <StatCard icon={FileJson} label="Routes API" value={pathCount} />
        <StatCard icon={Box} label="Tables DB" value={dbStats?.models ? Object.keys(dbStats.models).length : "—"} />
      </div>

      <div className="flex gap-1 border-b pb-1">
        {[
          { id: "system", label: "Système", icon: Cpu },
          { id: "env", label: "Variables", icon: Eye },
          { id: "db", label: "Base de données", icon: Database },
          { id: "api", label: "API & Circuits", icon: Activity },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)} className={`px-4 py-2 text-xs rounded-t-lg border-b-2 transition-colors cursor-pointer ${tab === t.id ? "border-primary text-primary font-semibold" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            <t.icon className="size-3.5 inline mr-1.5" />{t.label}
          </button>
        ))}
      </div>

      {tab === "system" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card><CardContent className="p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Process</h3>
            <div className="text-xs space-y-2">
              <Row label="Node" value={sysInfo?.node} />
              <Row label="Platform" value={`${sysInfo?.platform} ${sysInfo?.arch}`} />
              <Row label="Environnement" value={sysInfo?.env} />
              <Row label="Uptime" value={sysInfo?.uptime ? `${Math.round(sysInfo.uptime / 60)} min` : "—"} />
              <Row label="CWD" value={sysInfo?.cwd} />
            </div>
          </CardContent></Card>
          <Card><CardContent className="p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Mémoire</h3>
            <div className="text-xs space-y-2">
              <Row label="RSS" value={sysInfo?.memory?.rss} />
              <Row label="Heap Total" value={sysInfo?.memory?.heapTotal} />
              <Row label="Heap Utilisé" value={sysInfo?.memory?.heapUsed} />
            </div>
          </CardContent></Card>
        </div>
      )}

      {tab === "env" && (
        <Card><CardContent className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{envVars.length} variables d'environnement</h3>
            <button onClick={() => setShowSecrets(!showSecrets)} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer">
              {showSecrets ? <EyeOff className="size-3" /> : <Eye className="size-3" />} {showSecrets ? "Masquer" : "Afficher"}
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-xs text-left">
              <thead><tr className="border-b text-muted-foreground uppercase tracking-wider text-[10px]">
                <th className="px-2 py-2">Clé</th><th className="px-2 py-2">Valeur</th><th className="px-2 py-2">Taille</th>
              </tr></thead>
              <tbody className="divide-y">
                {envVars.map(v => (
                  <tr key={v.key} className="hover:bg-accent/30">
                    <td className="px-2 py-1.5 font-mono">{v.key}</td>
                    <td className="px-2 py-1.5 font-mono text-muted-foreground">
                      {v.isSecret && !showSecrets ? "••••••••" : v.value.slice(0, 120)}{v.value.length > 120 ? "…" : ""}
                    </td>
                    <td className="px-2 py-1.5 text-right">{v.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent></Card>
      )}

      {tab === "db" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card><CardContent className="p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Lignes par table</h3>
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {dbStats?.models && Object.entries(dbStats.models).map(([name, count]: any) => (
                <div key={name} className="flex items-center justify-between text-xs py-1.5 px-2 rounded hover:bg-accent/30">
                  <span className="font-medium">{name}</span>
                  <span className="font-mono text-muted-foreground">{count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent></Card>
          <Card><CardContent className="p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total lignes</h3>
            <p className="text-2xl font-bold">{dbStats?.total?.toLocaleString() || 0}</p>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground pt-4">Actions</h3>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Migrations Prisma :</p>
              <code className="text-xs block bg-accent/20 p-2 rounded">docker compose run --rm app npx prisma migrate status</code>
              <code className="text-xs block bg-accent/20 p-2 rounded mt-1">docker compose run --rm app npx prisma migrate deploy</code>
            </div>
          </CardContent></Card>
        </div>
      )}

      {tab === "api" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card><CardContent className="p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Spécification OpenAPI</h3>
            <p className="text-xs text-muted-foreground">{spec?.info?.title} v{spec?.info?.version}</p>
            <p className="text-xs">{Object.keys(spec?.paths || {}).length} endpoints · {spec?.tags?.length || 0} tags</p>
            <div className="flex flex-wrap gap-1 pt-2">
              {spec?.tags?.map((t: any) => <Badge key={t.name} variant="outline" className="text-[10px]">{t.name}</Badge>)}
            </div>
            <div className="pt-2">
              <a href="/api/docs" className="text-xs text-primary hover:underline">Ouvrir Swagger UI →</a>
              <a href="/api/docs/openapi.json" className="text-xs text-primary hover:underline ml-4">JSON brut →</a>
            </div>
          </CardContent></Card>

          <Card><CardContent className="p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Circuit Breakers</h3>
            {!circuits ? <p className="text-xs text-muted-foreground">Aucun circuit</p> : (
              <div className="space-y-2">
                {Object.entries(circuits).map(([name, state]: any) => (
                  <div key={name} className="flex items-center justify-between text-xs py-2 px-3 rounded-lg border">
                    <div className="flex items-center gap-2">
                      <span className={`size-2 rounded-full ${state === "open" ? "bg-red-500" : state === "half-open" ? "bg-amber-500" : "bg-emerald-500"}`} />
                      <span className="font-medium">{name}</span>
                      <Badge variant="outline" className={`text-[9px] ${state === "open" ? "text-red-500" : "text-emerald-500"}`}>{state}</Badge>
                    </div>
                    {state !== "closed" && (
                      <button onClick={() => resetCircuit(name)} className="text-[10px] text-primary hover:underline cursor-pointer">Reset</button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent></Card>
        </div>
      )}
    </div>
  )
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <Card className="border-border bg-card/30">
      <CardContent className="p-4 flex items-center gap-3">
        <Icon className="size-5 text-muted-foreground" />
        <div>
          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{label}</p>
          <p className="text-sm font-bold text-foreground font-mono">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function Row({ label, value }: { label: string; value?: string }) {
  return <div className="flex justify-between"><span className="text-muted-foreground">{label}</span><span className="font-mono text-right">{value || "—"}</span></div>
}
