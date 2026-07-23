"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import dynamic from "next/dynamic"
import { Play, Copy, Eye, Trash2, Loader2, Inbox, Archive, Search, ChevronLeft, ChevronRight, ArchiveRestore } from "lucide-react"
import { toast } from "sonner"
import {
  Card, CardContent, Badge, Button, cn, EmptyState,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@nba/design-system"
import { useSocket } from "@nba/lib/hooks/use-socket"
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

type StatusFilter = "all" | "DRAFT" | "PUBLISHED" | "ARCHIVED"

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "DRAFT", label: "Brouillons" },
  { value: "PUBLISHED", label: "Publiés" },
  { value: "ARCHIVED", label: "Archivés" },
]

const LIMIT = 20

export function SignalsTab({ cachedGet, invalidate, onOpenPanel }: SignalsTabProps) {
  const [signals, setSignals] = useState<Signal[]>([])
  const [loadingSignals, setLoadingSignals] = useState(false)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [actingSignalId, setActingSignalId] = useState<string | null>(null)
  const [editorOpen, setEditorOpen] = useState(true)

  // Confirm dialog state
  const [confirmAction, setConfirmAction] = useState<{
    id: string
    type: "delete" | "publish" | "duplicate" | "archive" | "unarchive"
    title: string
    description: string
    confirmLabel: string
  } | null>(null)
  const [confirmLoading, setConfirmLoading] = useState(false)

  const buildUrl = useCallback(() => {
    const params = new URLSearchParams()
    params.set("page", String(page))
    params.set("limit", String(LIMIT))
    if (statusFilter !== "all") params.set("status", statusFilter)
    if (searchQuery.trim()) params.set("search", searchQuery.trim())
    return `/api/admin/signals?${params.toString()}`
  }, [page, statusFilter, searchQuery])

  const fetchSignals = useCallback(async () => {
    setLoadingSignals(true)
    try {
      const { ok, data } = await cachedGet(buildUrl())
      if (ok) {
        setSignals(data.signals ?? data)
        if (data.pagination) {
          setTotalPages(data.pagination.pages ?? data.pagination.totalPages ?? 1)
        }
      } else {
        toast.error(data?.error ?? "Erreur de chargement des signaux")
      }
    } catch {
      toast.error("Erreur de chargement des signaux")
    } finally {
      setLoadingSignals(false)
    }
  }, [cachedGet, buildUrl])

  useEffect(() => {
    fetchSignals()
  }, [fetchSignals])

  // Temps réel : un signal publié apparaît instantanément dans la console admin
  // (canal 'signal' diffusé à la room 'admins' par le serveur WebSocket).
  const { subscribe, socket } = useSocket()
  const seenSignalIds = useRef<Set<string>>(new Set())
  useEffect(() => {
    const off = subscribe("signal", (payload: any) => {
      const signalId = payload?.signalId
      // Dédup : ignore un signal déjà traité (reconnect + replay peuvent
      // renvoyer un event déjà affiché) pour éviter un refetch en rafale.
      if (signalId) {
        if (seenSignalIds.current.has(signalId)) return
        seenSignalIds.current.add(signalId)
      }
      invalidate()
      fetchSignals()
    })
    return off
  }, [subscribe, invalidate, fetchSignals])

  // Au (re)connect, demande le replay des signaux publiés pendant une éventuelle
  // fenêtre de perte (worker WS indisponible au moment du PUBLISH Redis).
  useEffect(() => {
    const sock = socket.current
    if (!sock) return
    const onConnect = () => {
      sock.emit("signal:resync", {
        since: signals.length
          ? new Date(
              Math.max(
                ...signals
                  .map((s) => new Date(s.publishedAt ?? s.createdAt).getTime())
                  .filter((t) => !isNaN(t)),
              ),
            ).toISOString()
          : new Date(Date.now() - 60_000).toISOString(),
      })
    }
    if (sock.connected) onConnect()
    sock.on("connect", onConnect)
    return () => {
      sock.off("connect", onConnect)
    }
  }, [socket, signals])

  function handleConfirm(id: string, type: "delete" | "publish" | "duplicate" | "archive" | "unarchive") {
    const labels: Record<string, { title: string; description: string; confirmLabel: string }> = {
      delete: {
        title: "Supprimer ce signal ?",
        description: "Cette action est irréversible. Le signal sera définitivement supprimé.",
        confirmLabel: "Supprimer",
      },
      publish: {
        title: "Publier ce signal maintenant ?",
        description: "Le signal sera envoyé immédiatement à tous les destinataires des groupes sélectionnés.",
        confirmLabel: "Publier",
      },
      duplicate: {
        title: "Dupliquer ce signal ?",
        description: "Une copie du signal sera créée en brouillon.",
        confirmLabel: "Dupliquer",
      },
      archive: {
        title: "Archiver ce signal ?",
        description: "Le signal sera masqué de la liste principale mais pourra être restauré.",
        confirmLabel: "Archiver",
      },
      unarchive: {
        title: "Restaurer ce signal ?",
        description: "Le signal sera remis dans la liste principale.",
        confirmLabel: "Restaurer",
      },
    }
    const l = labels[type]
    setConfirmAction({ id, type, ...l })
  }

  async function executeConfirm() {
    if (!confirmAction) return
    const { id, type } = confirmAction
    setConfirmLoading(true)
    setActingSignalId(id)
    setConfirmAction(null)

    try {
      let res: Response | null = null
      if (type === "delete") {
        res = await fetch(`/api/admin/signals/${id}`, { method: "DELETE" })
      } else if (type === "publish") {
        res = await fetch(`/api/admin/signals/${id}/publish`, { method: "POST" })
      } else if (type === "duplicate") {
        res = await fetch(`/api/admin/signals/${id}/duplicate`, { method: "POST" })
      } else if (type === "archive") {
        res = await fetch(`/api/admin/signals/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "ARCHIVED" }),
        })
      } else if (type === "unarchive") {
        res = await fetch(`/api/admin/signals/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "PUBLISHED" }),
        })
      }

      if (res?.ok) {
        const messages: Record<string, string> = {
          delete: "Signal supprimé",
          publish: "Signal publié",
          duplicate: "Signal dupliqué en brouillon",
          archive: "Signal archivé",
          unarchive: "Signal restauré",
        }
        toast.success(messages[type] ?? "Action effectuée")
        if (type === "delete") {
          setSignals((prev) => prev.filter((s) => s.id !== id))
        } else {
          invalidate()
          fetchSignals()
        }
      } else {
        toast.error("Erreur lors de l'action")
      }
    } catch {
      toast.error("Impossible de contacter le serveur. Vérifiez votre connexion.")
    } finally {
      setConfirmLoading(false)
      setActingSignalId(null)
    }
  }

  const filteredSignals = signals

  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
      {/* Left: Editor */}
      <div className="xl:col-span-3 space-y-6">
        <button
          onClick={() => setEditorOpen(!editorOpen)}
          className="flex items-center gap-2 text-sm font-bold text-foreground uppercase tracking-wider cursor-pointer hover:text-primary transition-colors"
        >
          <span className={cn("transition-transform duration-200", editorOpen && "rotate-90")}>▶</span>
          Publier un signal
        </button>
        {editorOpen && (
          <SignalEditor onSignalCreated={() => { invalidate(); fetchSignals() }} />
        )}
      </div>

      {/* Right: History */}
      <div className="xl:col-span-2 space-y-4">
        <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Historique des publications</h2>

        {/* Filters bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1) }}
              className="h-9 pl-8 text-xs"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(v) => { setStatusFilter(v as StatusFilter); setPage(1) }}
          >
            <SelectTrigger className="w-[130px] h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Signals list */}
        {loadingSignals ? (
          <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
        ) : signals.length > 0 ? (
          <>
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
              {signals.map((sig) => (
                <Card key={sig.id} className="border-border/60 bg-card shadow-sm">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[11px] uppercase",
                          sig.status === "PUBLISHED" && "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
                          sig.status === "DRAFT" && "bg-neutral-500/10 text-neutral-400 border-neutral-500/20",
                          sig.status === "ARCHIVED" && "bg-rose-500/10 text-rose-600 border-rose-500/20"
                        )}
                      >
                        {sig.status === "PUBLISHED" ? "Publié" : sig.status === "DRAFT" ? "Brouillon" : "Archivé"}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {sig.publishedAt ? new Date(sig.publishedAt).toLocaleDateString() : new Date(sig.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-xs text-foreground line-clamp-3 leading-relaxed whitespace-pre-wrap">
                      {sig.content}
                    </p>

                    <div className="flex justify-between items-center pt-2 border-t border-border/60">
                      <span className="text-[11px] text-muted-foreground">Créé par : {sig.creator?.name || "Admin"}</span>
                      <div className="flex gap-1.5">
                        {sig.status === "DRAFT" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-11 text-emerald-500 hover:text-emerald-600 cursor-pointer"
                            onClick={() => handleConfirm(sig.id, "publish")}
                            title="Publier"
                            aria-label="Publier"
                          >
                            <Play className="size-4" />
                          </Button>
                        )}
                        {sig.status === "ARCHIVED" ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-11 text-muted-foreground hover:text-foreground cursor-pointer"
                            onClick={() => handleConfirm(sig.id, "unarchive")}
                            title="Restaurer"
                            aria-label="Restaurer"
                          >
                            <ArchiveRestore className="size-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-11 text-muted-foreground hover:text-foreground cursor-pointer"
                            onClick={() => handleConfirm(sig.id, "archive")}
                            title="Archiver"
                            aria-label="Archiver"
                          >
                            <Archive className="size-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-11 text-muted-foreground hover:text-foreground cursor-pointer"
                          onClick={() => handleConfirm(sig.id, "duplicate")}
                        title="Dupliquer"
                            aria-label="Dupliquer"
                          >
                            <Copy className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-11 text-muted-foreground hover:text-foreground cursor-pointer"
                          onClick={() => onOpenPanel({ title: "Détails du Signal", type: "signal", data: sig })}
                        title="Détails"
                            aria-label="Voir le détail"
                          >
                            <Eye className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-11 text-muted-foreground hover:text-destructive cursor-pointer"
                          onClick={() => handleConfirm(sig.id, "delete")}
                        title="Supprimer"
                            aria-label="Supprimer"
                          >
                            {actingSignalId === sig.id && confirmLoading ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Trash2 className="size-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <span className="text-[10px] text-muted-foreground">
                  Page {page} sur {totalPages}
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8 cursor-pointer"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    aria-label="Page précédente"
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8 cursor-pointer"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    aria-label="Page suivante"
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <EmptyState
            icon={Inbox}
            title="Aucun signal"
            description={searchQuery ? "Aucun résultat pour cette recherche." : "Créez votre premier signal via l'éditeur ci-contre."}
            shortcut="N"
            action={{
              label: "Publier un signal",
              icon: Play,
              onClick: () => setEditorOpen(true),
            }}
          />
        )}
      </div>

      {/* Confirm dialog */}
      <Dialog open={!!confirmAction} onOpenChange={(o) => { if (!o) setConfirmAction(null) }}>
        <DialogContent className="max-w-sm" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{confirmAction?.title}</DialogTitle>
            <DialogDescription>{confirmAction?.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setConfirmAction(null)}>
              Annuler
            </Button>
            <Button
              size="sm"
              disabled={confirmLoading}
              onClick={executeConfirm}
              className={cn(
                "gap-1.5",
                confirmAction?.type === "delete" && "bg-destructive text-destructive-foreground hover:bg-destructive/90"
              )}
            >
              {confirmLoading ? <Loader2 className="size-3.5 animate-spin" /> : null}
              {confirmAction?.confirmLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
