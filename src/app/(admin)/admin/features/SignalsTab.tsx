"use client"

import { useEffect, useState, useCallback } from "react"
import dynamic from "next/dynamic"
import { Play, Copy, Eye, Trash2, Loader2, Inbox } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, Badge, Button, cn } from "@nba/design-system"
import { EmptyState } from "@nba/app/components/empty-state"
import { Signal, CachedGet, OpenPanel } from "./types"

const SignalEditor = dynamic(
  () => import("../components/signal-editor").then((mod) => mod.SignalEditor),
  {
    loading: () => (
      <div className="py-12 flex justify-center items-center">
        <Loader2 className="animate-spin text-primary size-6" />
      </div>
    ),
    ssr: false,
  }
)

interface SignalsTabProps {
  cachedGet: CachedGet
  invalidate: () => void
  onOpenPanel: OpenPanel
}

export function SignalsTab({ cachedGet, invalidate, onOpenPanel }: SignalsTabProps) {
  const [signals, setSignals] = useState<Signal[]>([])
  const [loadingSignals, setLoadingSignals] = useState(false)

  const fetchSignals = useCallback(async () => {
    setLoadingSignals(true)
    try {
      const { ok, data } = await cachedGet("/api/admin/signals")
      if (ok) {
        setSignals(data.signals ?? data)
      } else {
        toast.error("Erreur de chargement des signaux")
      }
    } catch (err) {
      console.error(err)
      toast.error("Erreur de chargement des signaux")
    } finally {
      setLoadingSignals(false)
    }
  }, [cachedGet])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSignals()
  }, [fetchSignals])

  const [actingSignalId, setActingSignalId] = useState<string | null>(null)

  async function handleDeleteSignal(id: string) {
    if (!confirm("Voulez-vous vraiment supprimer ce signal ?")) return
    setActingSignalId(id)
    invalidate()
    const res = await fetch(`/api/admin/signals/${id}`, { method: "DELETE" })
    if (res.ok) {
      setSignals((prev) => prev.filter((s) => s.id !== id))
      toast.success("Signal supprimé")
    } else {
      toast.error("Erreur lors de la suppression")
    }
    setActingSignalId(null)
  }

  async function handlePublishSignal(id: string) {
    if (!confirm("Publier ce signal maintenant ?")) return
    setActingSignalId(id)
    invalidate()
    const res = await fetch(`/api/admin/signals/${id}/publish`, { method: "POST" })
    if (res.ok) {
      fetchSignals()
      toast.success("Signal publié")
    } else {
      toast.error("Erreur lors de la publication")
    }
    setActingSignalId(null)
  }

  async function handleDuplicateSignal(id: string) {
    if (!confirm("Dupliquer ce signal en brouillon ?")) return
    setActingSignalId(id)
    invalidate()
    const res = await fetch(`/api/admin/signals/${id}/duplicate`, { method: "POST" })
    if (res.ok) {
      fetchSignals()
      toast.success("Signal dupliqué en brouillon")
    } else {
      toast.error("Erreur lors de la duplication")
    }
    setActingSignalId(null)
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
      <div className="xl:col-span-3 space-y-6">
        <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Publier un signal</h2>
        <SignalEditor onSignalCreated={() => { invalidate(); fetchSignals() }} />
      </div>

      <div className="xl:col-span-2 space-y-6">
        <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Historique des publications</h2>
        {loadingSignals ? (
          <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
        ) : signals.length > 0 ? (
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
            {signals.map((sig) => (
              <Card key={sig.id} className="border-border bg-card/20">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[9px] uppercase",
                        sig.status === "PUBLISHED" && "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
                        sig.status === "DRAFT" && "bg-neutral-500/10 text-neutral-400 border-neutral-500/20",
                        sig.status === "ARCHIVED" && "bg-rose-500/10 text-rose-600 border-rose-500/20"
                      )}
                    >
                      {sig.status}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {sig.publishedAt ? new Date(sig.publishedAt).toLocaleDateString() : new Date(sig.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-xs text-foreground line-clamp-3 leading-relaxed whitespace-pre-wrap">
                    {sig.content}
                  </p>

                  <div className="flex justify-between items-center pt-2 border-t border-border/60">
                    <span className="text-[9px] text-muted-foreground">Créé par : {sig.creator?.name || "Admin"}</span>
                    <div className="flex gap-1.5">
                      {sig.status === "DRAFT" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-9 text-emerald-500 hover:text-emerald-600 cursor-pointer"
                          onClick={() => handlePublishSignal(sig.id)}
                          title="Publier"
                        >
                          <Play className="size-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-9 text-muted-foreground hover:text-foreground cursor-pointer"
                        onClick={() => handleDuplicateSignal(sig.id)}
                        title="Dupliquer"
                      >
                        <Copy className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-9 text-muted-foreground hover:text-foreground cursor-pointer"
                        onClick={() => {
                          onOpenPanel({ title: "Détails du Signal", type: "signal", data: sig })
                        }}
                      >
                        <Eye className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-9 text-muted-foreground hover:text-destructive cursor-pointer"
                        onClick={() => handleDeleteSignal(sig.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState icon={Inbox} title="Aucun signal créé" description="Créez votre premier signal via l'éditeur ci-contre." />
        )}
      </div>
    </div>
  )
}
