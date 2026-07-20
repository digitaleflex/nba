"use client"

import { useState } from "react"
import { Button, Card, CardContent } from "@nba/design-system"
import { Trash2, RotateCw, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { useConfirm } from "@nba/components/confirm-dialog"

export function AdminTools() {
  const [busy, setBusy] = useState<string | null>(null)
  const [queues, setQueues] = useState<any[] | null>(null)
  const [cacheStats, setCacheStats] = useState<any>(null)
  const { confirm, node } = useConfirm()

  async function purgeCache() {
    confirm({
      title: "Purger le cache Redis ?",
      description: "Cela peut ralentir temporairement les requêtes le temps que le cache se reconstruise.",
      confirmLabel: "Purger",
      onConfirm: async () => {
        setBusy("cache")
        try {
          const res = await fetch("/api/admin/cache/purge", { method: "POST" })
          if (!res.ok) throw new Error()
          const d = await res.json()
          toast.success(`Cache purgé (${d.purged} préfixes).`)
        } catch {
          toast.error("Erreur lors de la purge du cache.")
        } finally {
          setBusy(null)
        }
      },
    })
  }

  async function retryQueues() {
    setBusy("retry")
    try {
      const res = await fetch("/api/admin/queues", { method: "POST" })
      if (!res.ok) throw new Error()
      const d = await res.json()
      toast.success(`Jobs en échec relancés (${d.retried}).`)
    } catch {
      toast.error("Erreur lors de la relance des files.")
    } finally {
      setBusy(null)
    }
  }

  async function fetchCacheStats() {
    setBusy("stats")
    try {
      const res = await fetch("/api/admin/cache/stats")
      if (!res.ok) throw new Error()
      setCacheStats(await res.json())
    } catch {
      toast.error("Erreur lors de la lecture des stats cache.")
    } finally {
      setBusy(null)
    }
  }

  async function refreshQueues() {
    setBusy("stats")
    try {
      const res = await fetch("/api/admin/queues")
      if (!res.ok) throw new Error()
      const d = await res.json()
      setQueues(d.queues)
    } catch {
      toast.error("Erreur lors de la lecture des files.")
    } finally {
      setBusy(null)
    }
  }

  return (
    <>
      <Card className="border-border">
        <CardContent className="p-4 flex flex-wrap items-center gap-3">
          <span className="text-[10px] uppercase text-muted-foreground font-semibold mr-1">
            Outils super-admin
          </span>
          <Button size="sm" variant="outline" className="gap-1.5" disabled={busy === "cache"} onClick={purgeCache}>
            <Trash2 className="size-3.5" /> Purge cache
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5" disabled={busy === "retry"} onClick={retryQueues}>
            <RotateCw className="size-3.5" /> Relancer jobs en échec
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5" disabled={busy === "stats"} onClick={fetchCacheStats}>
            <RefreshCw className="size-3.5" /> Cache stats
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5" disabled={busy === "stats"} onClick={refreshQueues}>
            <RefreshCw className="size-3.5" /> Files (stats)
          </Button>
          {cacheStats && (
            <span className="text-[10px] px-2 py-1 rounded bg-muted/50 border border-border">
              Cache: {cacheStats.hits} hits / {cacheStats.misses} misses ({cacheStats.ratio}) · {cacheStats.invalidations} invalidations
            </span>
          )}
          {queues && (
            <div className="flex flex-wrap gap-2 ml-1">
              {queues.map((q: any) => (
                <span
                  key={q.name}
                  className="text-[10px] px-2 py-1 rounded bg-muted/50 border border-border"
                >
                  {q.name}: <b className={q.failed ? "text-rose-500" : ""}>{q.failed ?? 0}</b> échec /{" "}
                  {q.waiting ?? 0} attente / {q.active ?? 0} actif
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      {node}
    </>
  )
}
