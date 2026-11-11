"use client"
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useCallback, useRef } from "react"
import dynamic from "next/dynamic"
import {
  Play, Copy, Eye, Trash2, Loader2, Inbox, Archive, Search, ChevronLeft, ChevronRight,
  ArchiveRestore, Plus, Clock, Pencil,
} from "lucide-react"
import { toast } from "sonner"
import {
  Card, CardContent, Button, cn, EmptyState,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  Input,
} from "@nba/design-system"
import { useSocket } from "@nba/lib/hooks/use-socket"
import { Signal, CachedGet, OpenPanel } from "./types"
import { StatusBadge } from "./ui"
import { FilterPills } from "../components/filter-pills"

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

const STATUS_FILTERS: { value: StatusFilter; label: string; count?: number }[] = [
  { value: "all", label: "Tous" },
  { value: "DRAFT", label: "Brouillons" },
  { value: "PUBLISHED", label: "Publiés" },
  { value: "ARCHIVED", label: "Archivés" },
]

const STATUS_META: Record<string, { label: string; tone: "success" | "neutral" | "destructive" | "warning" }> = {
  PUBLISHED: { label: "Publié", tone: "success" },
  DRAFT: { label: "Brouillon", tone: "neutral" },
  ARCHIVED: { label: "Archivé", tone: "destructive" },
}

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

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchSignals() }, [fetchSignals])

  const { subscribe, socket } = useSocket()
  const seenSignalIds = useRef<Set<string>>(new Set())
  useEffect(() => {
    const off = subscribe("signal", (payload: any) => {
      const signalId = payload?.signalId
      if (signalId) {
        if (seenSignalIds.current.has(signalId)) return
        seenSignalIds.current.add(signalId)
      }
      invalidate()
      fetchSignals()
    })
    return off
  }, [subscribe, invalidate, fetchSignals])

  const latestSignalTs = useRef<string>(new Date(Date.now() - 60_000).toISOString()) // eslint-disable-line react-hooks/purity
  useEffect(() => {
    if (signals.length > 0) {
      const maxTs = Math.max(
        ...signals
          .map((s) => new Date(s.publishedAt ?? s.createdAt).getTime())
          .filter((t) => !isNaN(t)),
      )
      latestSignalTs.current = new Date(maxTs).toISOString()
    }
  }, [signals])

  useEffect(() => {
    const sock = socket.current
    if (!sock) return
    const onConnect = () => { sock.emit("signal:resync", { since: latestSignalTs.current }) }
    sock.on("connect", onConnect)
    return () => { sock.off("connect", onConnect) }
  }, [socket])

  function handleConfirm(id: string, type: "delete" | "publish" | "duplicate" | "archive" | "unarchive") {
    const labels: Record<string, { title: string; description: string; confirmLabel: string }> = {
      delete: { title: "Supprimer ce signal ?", description: "Cette action est irréversible.", confirmLabel: "Supprimer" },
      publish: { title: "Publier ce signal ?", description: "Le signal sera envoyé immédiatement aux destinataires.", confirmLabel: "Publier" },
      duplicate: { title: "Dupliquer ce signal ?", description: "Une copie en brouillon sera créée.", confirmLabel: "Dupliquer" },
      archive: { title: "Archiver ce signal ?", description: "Masqué de la liste, pourra être restauré.", confirmLabel: "Archiver" },
      unarchive: { title: "Restaurer ce signal ?", description: "Remis dans la liste principale.", confirmLabel: "Restaurer" },
    }
    setConfirmAction({ id, type, ...labels[type] })
  }

  async function executeConfirm() {
    if (!confirmAction) return
    const { id, type } = confirmAction
    setConfirmLoading(true)
    setActingSignalId(id)
    setConfirmAction(null)

    try {
      let res: Response | null = null
      if (type === "delete") res = await fetch(`/api/admin/signals/${id}`, { method: "DELETE" })
      else if (type === "publish") res = await fetch(`/api/admin/signals/${id}/publish`, { method: "POST" })
      else if (type === "duplicate") res = await fetch(`/api/admin/signals/${id}/duplicate`, { method: "POST" })
      else if (type === "archive") res = await fetch(`/api/admin/signals/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "ARCHIVED" }) })
      else if (type === "unarchive") res = await fetch(`/api/admin/signals/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "PUBLISHED" }) })

      if (res?.ok) {
        toast.success({ delete: "Signal supprimé", publish: "Signal publié", duplicate: "Dupliqué en brouillon", archive: "Signal archivé", unarchive: "Signal restauré" }[type] ?? "OK")
        if (type === "delete") setSignals((prev) => prev.filter((s) => s.id !== id))
        else { invalidate(); fetchSignals() }
      } else {
        toast.error("Erreur lors de l'action")
      }
    } catch {
      toast.error("Impossible de contacter le serveur.")
    } finally {
      setConfirmLoading(false)
      setActingSignalId(null)
    }
  }

  function signalDate(sig: Signal) {
    const d = sig.publishedAt ?? sig.createdAt
    return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
  }

  return (
    <div className="space-y-6">
      {/* ═══ HEADER ═══ */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Signaux</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Créer, planifier et gérer les signaux diffusés aux membres.
          </p>
        </div>
        <Button
          size="sm"
          className="gap-1.5 cursor-pointer"
          onClick={() => setEditorOpen(!editorOpen)}
        >
          {editorOpen ? <Pencil className="size-3.5" /> : <Plus className="size-3.5" />}
          {editorOpen ? "Masquer l'éditeur" : "Nouveau signal"}
        </Button>
      </div>

      {/* ═══ ÉDITEUR (collapsible) ═══ */}
      {editorOpen && (
        <Card className="border-border/60 bg-card shadow-sm">
          <CardContent className="p-5">
            <SignalEditor onSignalCreated={() => { invalidate(); fetchSignals() }} />
          </CardContent>
        </Card>
      )}

      {/* ═══ HISTORIQUE ═══ */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Historique</h2>
          <FilterPills
            options={STATUS_FILTERS}
            active={statusFilter}
            onChange={(v) => { setStatusFilter(v as StatusFilter); setPage(1) }}
          />
        </div>

        {/* Search */}
        <div className="relative max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Rechercher un signal..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1) }}
            className="h-9 pl-8 text-xs"
          />
        </div>

        {/* Signals list */}
        {loadingSignals ? (
          <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
        ) : signals.length > 0 ? (
          <>
            <div className="space-y-3 max-h-[700px] overflow-y-auto pr-2" role="region" aria-label="Contenu défilant">
              {signals.map((sig) => {
                const meta = STATUS_META[sig.status] ?? STATUS_META.DRAFT
                const imageCount = sig.imageUrls?.length ?? 0
                return (
                  <Card key={sig.id} className="border-border/60 bg-card shadow-sm hover:border-border/80 transition-colors">
                    <CardContent className="p-4 space-y-3">
                      {/* Row 1: badge + date + creator */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
                          {sig.status === "PUBLISHED" && sig.publishedAt && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="size-3" />
                              {signalDate(sig)}
                            </span>
                          )}
                          {sig.status !== "PUBLISHED" && (
                            <span className="text-xs text-muted-foreground">{signalDate(sig)}</span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {sig.creator?.name || "Admin"}
                        </span>
                      </div>

                      {/* Row 2: content preview */}
                      <p className="text-xs text-foreground line-clamp-2 leading-relaxed whitespace-pre-wrap">
                        {sig.content}
                      </p>

                      {/* Row 3: images thumbnails */}
                      {imageCount > 0 && (
                        <div className="flex gap-1.5">
                          {sig.imageUrls!.slice(0, 3).map((url: string, idx: number) => (
                            <div key={idx} className="size-10 rounded-lg overflow-hidden border bg-muted shrink-0">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={`/api/files/${url}`} alt="" className="h-full w-full object-cover" />
                            </div>
                          ))}
                          {imageCount > 3 && (
                            <div className="size-10 rounded-lg border bg-muted flex items-center justify-center text-[10px] text-muted-foreground font-bold shrink-0">
                              +{imageCount - 3}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Row 4: actions */}
                      <div className="flex items-center justify-between pt-2 border-t border-border/60">
                        <div className="flex items-center gap-1">
                          {sig.status === "DRAFT" && (
                            <ActionBtn icon={Play} label="Publier" color="text-success" onClick={() => handleConfirm(sig.id, "publish")} loading={actingSignalId === sig.id && confirmLoading} />
                          )}
                          {sig.status === "ARCHIVED" ? (
                            <ActionBtn icon={ArchiveRestore} label="Restaurer" onClick={() => handleConfirm(sig.id, "unarchive")} loading={actingSignalId === sig.id && confirmLoading} />
                          ) : (
                            <ActionBtn icon={Archive} label="Archiver" onClick={() => handleConfirm(sig.id, "archive")} loading={actingSignalId === sig.id && confirmLoading} />
                          )}
                          <ActionBtn icon={Copy} label="Dupliquer" onClick={() => handleConfirm(sig.id, "duplicate")} loading={actingSignalId === sig.id && confirmLoading} />
                          <ActionBtn icon={Eye} label="Détail" onClick={() => onOpenPanel({ title: "Détails du Signal", type: "signal", data: sig })} />
                          <ActionBtn icon={Trash2} label="Supprimer" color="text-destructive" onClick={() => handleConfirm(sig.id, "delete")} loading={actingSignalId === sig.id && confirmLoading} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-muted-foreground">Page {page} / {totalPages}</span>
                <div className="flex gap-1">
                  <Button variant="outline" size="icon" className="size-8 cursor-pointer" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} aria-label="Précédent">
                    <ChevronLeft className="size-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="size-8 cursor-pointer" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} aria-label="Suivant">
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
            description={searchQuery ? "Aucun résultat pour cette recherche." : "Créez votre premier signal via l'éditeur ci-dessus."}
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
            <Button variant="outline" size="sm" onClick={() => setConfirmAction(null)}>Annuler</Button>
            <Button
              size="sm"
              disabled={confirmLoading}
              onClick={executeConfirm}
              className={cn("gap-1.5", confirmAction?.type === "delete" && "bg-destructive text-destructive-foreground hover:bg-destructive/90")}
            >
              {confirmLoading && <Loader2 className="size-3.5 animate-spin" />}
              {confirmAction?.confirmLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ActionBtn({ icon: Icon, label, color, onClick, loading }: {
  icon: any; label: string; color?: string; onClick?: () => void; loading?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={cn(
        "inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors cursor-pointer",
        "hover:bg-muted/60",
        color ?? "text-muted-foreground hover:text-foreground"
      )}
      title={label}
      aria-label={label}
    >
      {loading ? <Loader2 className="size-3 animate-spin" /> : <Icon className="size-3" />}
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}
