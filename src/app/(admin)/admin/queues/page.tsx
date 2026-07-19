"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, cn } from "@nba/design-system"
import { Activity, Loader2, RefreshCw, AlertTriangle, CheckCircle2, RotateCw, Cpu } from "lucide-react"

interface QueueStat {
  name: string
  waiting: number
  active: number
  completed: number
  failed: number
  delayed: number
  paused?: number
  error?: string
}

const REFRESH_MS = 15_000

const QUEUE_LABELS: Record<string, string> = {
  "file-cleanup": "Nettoyage des fichiers",
  "signal-distribution": "Distribution des signaux",
  "notification-delivery": "Envoi des notifications",
}

export default function AdminQueuesPage() {
  const [queues, setQueues] = useState<QueueStat[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [retrying, setRetrying] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/queues")
      if (!res.ok) throw new Error("Erreur de chargement des files")
      const json = await res.json()
      setQueues(json.queues ?? [])
      setError(null)
      setLastUpdate(new Date())
    } catch {
      setError("Erreur de chargement des files BullMQ")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const id = setInterval(load, REFRESH_MS)
    return () => clearInterval(id)
  }, [load])

  const retry = async (name: string) => {
    setRetrying(name)
    try {
      const res = await fetch("/api/admin/queues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
      if (res.ok) await load()
    } finally {
      setRetrying(null)
    }
  }

  const totalFailed = (queues ?? []).reduce((s, q) => s + (q.failed ?? 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Files BullMQ</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Surveillez les files de traitement asynchrone et relancez les jobs en échec.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdate && (
            <span className="text-[10px] text-muted-foreground">
              MAJ {lastUpdate.toLocaleTimeString("fr-FR")}
            </span>
          )}
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={cn("size-4", loading && "animate-spin")} />
            Actualiser
          </Button>
        </div>
      </div>

      {totalFailed > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-sm text-rose-600">
          <AlertTriangle className="size-4 shrink-0" />
          {totalFailed} job{totalFailed !== 1 ? "s" : ""} en échec sur l&apos;ensemble des files.
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      ) : error ? (
        <p className="py-10 text-center text-sm text-rose-600">{error}</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {(queues ?? []).map((q) => {
            const hasError = Boolean(q.error)
            return (
              <Card key={q.name} className={cn(hasError && "border-rose-500/30")}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Cpu className="size-4 text-primary" />
                    {QUEUE_LABELS[q.name] ?? q.name}
                  </CardTitle>
                  {hasError ? (
                    <Badge variant="outline" className="text-[10px] text-rose-600 border-rose-500/20">
                      Indisponible
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/20">
                      <CheckCircle2 className="mr-1 size-3" /> Actif
                    </Badge>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  {hasError ? (
                    <p className="text-xs text-rose-600">{q.error}</p>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <Metric label="En attente" value={q.waiting} />
                        <Metric label="En cours" value={q.active} />
                        <Metric label="Terminés" value={q.completed} />
                        <Metric label="Reportés" value={q.delayed} />
                      </div>
                      <div
                        className={cn(
                          "flex items-center justify-between rounded-lg px-3 py-2 text-sm",
                          (q.failed ?? 0) > 0
                            ? "bg-rose-500/5 text-rose-600"
                            : "bg-muted/40 text-muted-foreground",
                        )}
                      >
                        <span className="flex items-center gap-1.5">
                          <AlertTriangle className="size-3.5" /> Échecs
                        </span>
                        <span className="font-semibold">{q.failed ?? 0}</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => retry(q.name)}
                        disabled={retrying === q.name || (q.failed ?? 0) === 0}
                      >
                        {retrying === q.name ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <RotateCw className="size-4" />
                        )}
                        Relancer les échecs
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-muted/40 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  )
}
