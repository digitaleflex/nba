"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, Badge, Button, cn } from "@nba/design-system"
import { RefreshCw, Loader2, AlertTriangle, CheckCircle2, XCircle, RotateCcw } from "lucide-react"
import { toast } from "sonner"

interface DlqItem {
  id: string
  eventType: string
  externalId: string | null
  attempts: number
  status: "PENDING" | "REPLAYED" | "ABANDONED"
  lastError: string | null
  createdAt: string
  replayedAt: string | null
}

interface DlqStats {
  pending: number
  replayed: number
  abandoned: number
  oldestPendingAt: string | null
}

export default function DlqPage() {
  const [items, setItems] = useState<DlqItem[]>([])
  const [stats, setStats] = useState<DlqStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [replaying, setReplaying] = useState<string | null>(null)
  const [filter, setFilter] = useState<"PENDING" | "REPLAYED" | "ABANDONED">("PENDING")

  const fetchDlq = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/webhooks/dlq?status=${filter}&limit=50`)
      if (!res.ok) throw new Error("Erreur de chargement")
      const data = await res.json()
      setItems(data.items)
      setStats(data.stats)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    fetchDlq()
    const id = setInterval(fetchDlq, 15000) // 15s auto-refresh
    return () => clearInterval(id)
  }, [fetchDlq])

  async function replay(id: string) {
    setReplaying(id)
    try {
      const res = await fetch(`/api/admin/webhooks/dlq/${id}/replay`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erreur")
      toast.success(`Replay OK (${data.type || "?"})`)
      fetchDlq()
    } catch (err: any) {
      toast.error(`Echec: ${err.message}`)
    } finally {
      setReplaying(null)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Dead Letter Queue — Webhooks</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Events Resend qui ont echoue dans le traitement. A rejouer ou abandonner.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchDlq} disabled={loading} className="gap-1.5">
          <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
          Rafraichir
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-3">
          <Card className="border-border bg-card/30">
            <CardContent className="p-4">
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                En attente
              </p>
              <p className={cn("text-2xl font-bold mt-1", stats.pending > 0 ? "text-amber-600" : "text-foreground")}>
                {stats.pending}
              </p>
              {stats.oldestPendingAt && (
                <p className="text-[10px] text-muted-foreground mt-1">
                  Plus ancien : {new Date(stats.oldestPendingAt).toLocaleString("fr-FR")}
                </p>
              )}
            </CardContent>
          </Card>
          <Card className="border-border bg-card/30">
            <CardContent className="p-4">
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                Rejoues
              </p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.replayed}</p>
            </CardContent>
          </Card>
          <Card className="border-border bg-card/30">
            <CardContent className="p-4">
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                Abandonns
              </p>
              <p className="text-2xl font-bold text-rose-600 mt-1">{stats.abandoned}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1">
        {(["PENDING", "REPLAYED", "ABANDONED"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
              filter === s
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted/40",
            )}
          >
            {s}
            {stats && s === "PENDING" && ` (${stats.pending})`}
            {stats && s === "REPLAYED" && ` (${stats.replayed})`}
            {stats && s === "ABANDONED" && ` (${stats.abandoned})`}
          </button>
        ))}
      </div>

      {/* Items */}
      {loading && items.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
            <CheckCircle2 className="size-8 text-emerald-500" />
            <p className="text-sm">Aucune entree {filter.toLowerCase()}.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((it) => (
            <Card key={it.id} className="border-border bg-card/30">
              <CardContent className="p-3 flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px]",
                        it.status === "PENDING" && "text-amber-600 border-amber-500/30",
                        it.status === "REPLAYED" && "text-emerald-600 border-emerald-500/30",
                        it.status === "ABANDONED" && "text-rose-600 border-rose-500/30",
                      )}
                    >
                      {it.status}
                    </Badge>
                    <code className="text-xs font-bold">{it.eventType}</code>
                    {it.externalId && (
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {it.externalId.slice(0, 16)}…
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground">
                      {it.attempts} tentative{it.attempts > 1 ? "s" : ""}
                    </span>
                  </div>
                  {it.lastError && (
                    <p className="text-[10px] text-rose-600 mt-1 truncate font-mono">
                      {it.lastError}
                    </p>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {new Date(it.createdAt).toLocaleString("fr-FR")}
                    {it.replayedAt && ` · rejoue ${new Date(it.replayedAt).toLocaleString("fr-FR")}`}
                  </p>
                </div>
                {it.status === "PENDING" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => replay(it.id)}
                    disabled={replaying === it.id}
                    className="gap-1.5"
                  >
                    {replaying === it.id ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <RotateCcw className="size-3.5" />
                    )}
                    Rejouer
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
