"use client"

import { useEffect, useState, useCallback } from "react"
import { toast } from "sonner"
import { Loader2, ChevronDown, CheckCircle2, XCircle, SkipForward, Square, CheckSquare } from "lucide-react"
import { readBatchStream } from "@nba/lib/batch-stream"
import { Button, Card, CardContent, Badge, Dialog, DialogContent, DialogHeader, DialogTitle, cn, SwipeableRow, useMediaQuery, EmptyState, Checkbox } from "@nba/design-system"
import { Inbox } from "lucide-react"
import { REQUEST_FILTERS, REQUEST_STATUS_CLASS, REQUEST_STATUS_LABELS, REJECT_REASONS } from "./constants"
import { AccessRequest, CachedGet } from "./types"

interface RequestsTabProps {
  cachedGet: CachedGet
  invalidate: () => void
  refreshOps: () => void
}

export function RequestsTab({ cachedGet, invalidate, refreshOps }: RequestsTabProps) {
  const [requests, setRequests] = useState<AccessRequest[]>([])
  const [loadingRequests, setLoadingRequests] = useState(false)
  const [plans, setPlans] = useState<{ id: string; name: string }[]>([])
  const [requestStatusFilter, setRequestStatusFilter] = useState<string>("ALL")
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectTarget, setRejectTarget] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState<string>("")
  const [rejectNotes, setRejectNotes] = useState<string>("")
  const [reexamineTarget, setReexamineTarget] = useState<string | null>(null)
  const [reexamineOpen, setReexamineOpen] = useState(false)
  const [reexaminePlanId, setReexaminePlanId] = useState<string>("")

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [batchOpen, setBatchOpen] = useState(false)
  const [batchStep, setBatchStep] = useState(0)
  const [batchProgressText, setBatchProgressText] = useState("")
  const [batchResult, setBatchResult] = useState<{ total: number; succeeded: number; failed: number; action: string } | null>(null)

  const pendingIds = requests.filter((r) => r.status === "PENDING").map((r) => r.id)
  const selectedCount = selectedIds.size

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }, [])

  const toggleSelectAllPending = useCallback(() => {
    setSelectedIds((prev) => {
      const allSelected = pendingIds.every((id) => prev.has(id))
      if (allSelected) return new Set()
      return new Set(pendingIds)
    })
  }, [pendingIds])

  const clearSelection = useCallback(() => setSelectedIds(new Set()), [])

  const fetchRequests = useCallback(async (status = "ALL") => {
    setLoadingRequests(true)
    try {
      const { ok, data } = await cachedGet(`/api/admin/access-requests?status=${status}`)
      if (ok) {
        setRequests(data)
      } else {
        toast.error("Impossible de charger les demandes. Réessayez.")
      }
    } catch (err) {
      console.error(err)
      toast.error("Impossible de charger les demandes. Réessayez.")
    } finally {
      setLoadingRequests(false)
    }
  }, [cachedGet])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRequests(requestStatusFilter)
  }, [requestStatusFilter, fetchRequests])

  useEffect(() => {
    cachedGet("/api/admin/plans").then(({ ok, data }) => {
      if (ok && data.plans) setPlans(data.plans)
    })
  }, [cachedGet])

  async function handleChangePlan(requestId: string, newPlanId: string) {
    const req = requests.find((r) => r.id === requestId)
    if (!req || req.plan.id === newPlanId) return
    invalidate()
    const res = await fetch(`/api/admin/access-requests/${requestId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: req.status, planId: newPlanId }),
    })
    if (res.ok) {
      toast.success("Plan modifié")
      fetchRequests(requestStatusFilter)
    } else {
      toast.error("Échec de la modification du plan")
    }
  }

  async function batchReview(status: "APPROVED" | "REJECTED") {
    if (selectedCount === 0) return
    const label = status === "APPROVED" ? "approuvée" : "refusée"
    if (!confirm(`${status === "APPROVED" ? "Approuver" : "Refuser"} ${selectedCount} demande${selectedCount > 1 ? "s" : ""} ?`)) return

    setBatchResult(null)
    setBatchStep(0)
    setBatchProgressText("Envoi de la requête...")
    setBatchOpen(true)
    invalidate()

    try {
      const res = await fetch("/api/admin/access-requests/batch-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestIds: Array.from(selectedIds), status }),
      })

      await readBatchStream(res, {
        onProgress: (data) => {
          setBatchStep(Math.min(4, Math.round((data.succeeded + data.failed) / data.total * 4)))
          setBatchProgressText(data.step)
        },
        onDone: (result) => {
          setBatchStep(5)
          setBatchProgressText("Terminé")
          setBatchResult({ ...result, action: label })
          if (result.succeeded > 0) toast.success(`${result.succeeded} demande(s) ${label}`)
          clearSelection()
          fetchRequests(requestStatusFilter)
          refreshOps()
        },
        onError: (msg) => {
          toast.error(msg)
          setBatchOpen(false)
        },
      })
    } catch {
      toast.error("Échec du traitement par lot")
      setBatchOpen(false)
    }
  }

  function openReexamine(id: string) {
    const req = requests.find((r) => r.id === id)
    setReexamineTarget(id)
    setReexaminePlanId(req?.plan.id || "")
    setReexamineOpen(true)
  }

  const [actingRequestId, setActingRequestId] = useState<string | null>(null)
  const isDesktop = useMediaQuery("(min-width: 768px)")

  function swipeApprove(id: string) {
    setActingRequestId(id)
    invalidate()
    fetch(`/api/admin/access-requests/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "APPROVED", notes: "Demande approuvée (swipe)" }),
    })
      .then((res) => {
        if (res.ok) toast.success("Demande approuvée")
        else toast.error("Échec de l'approbation. Réessayez.")
      })
      .catch(() => toast.error("Échec de l'approbation. Réessayez."))
      .finally(() => {
        setActingRequestId(null)
        fetchRequests(requestStatusFilter)
        refreshOps()
      })
  }

  async function handleReexamine(status: "APPROVED" | "REJECTED" | "REVOKED" | "SUSPENDED") {
    if (!reexamineTarget) return
    setActingRequestId(reexamineTarget)
    invalidate()
    const body: Record<string, string> = { status, notes: `Réexaminé → ${status}` }
    if (reexaminePlanId) body.planId = reexaminePlanId
    const res = await fetch(`/api/admin/access-requests/${reexamineTarget}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      const label = status === "APPROVED" ? "approuvée" : status === "REJECTED" ? "refusée" : status === "REVOKED" ? "révoquée" : "suspendue"
      toast.success(`Demande ${label}`)
    } else {
      toast.error("Échec du réexamen. Réessayez.")
    }
    setReexamineOpen(false)
    setReexamineTarget(null)
    setActingRequestId(null)
    fetchRequests(requestStatusFilter)
    refreshOps()
  }

  async function handleApprove(id: string) {
    if (!confirm("Approuver cette demande d'accès ?")) return
    setActingRequestId(id)
    invalidate()
    const res = await fetch(`/api/admin/access-requests/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "APPROVED", notes: "Demande approuvée" }),
    })
    if (res.ok) {
      toast.success("Demande approuvée")
    } else {
      toast.error("Échec de l'approbation. Réessayez.")
    }
    setActingRequestId(null)
    fetchRequests(requestStatusFilter)
    refreshOps()
  }

  function openReject(id: string) {
    setRejectTarget(id)
    setRejectReason("")
    setRejectNotes("")
    setRejectOpen(true)
  }

  async function confirmReject() {
    if (!rejectTarget) return
    if (!rejectReason) {
      toast.error("Veuillez sélectionner un motif de refus.")
      return
    }
    invalidate()
    setActingRequestId(rejectTarget)
    const notes = rejectNotes.trim() ? `${rejectReason} — ${rejectNotes.trim()}` : rejectReason
    const res = await fetch(`/api/admin/access-requests/${rejectTarget}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "REJECTED", notes }),
    })
    if (res.ok) {
      toast.success("Demande refusée")
    } else {
      toast.error("Échec du refus. Réessayez.")
    }
    setRejectOpen(false)
    setRejectTarget(null)
    setActingRequestId(null)
    fetchRequests(requestStatusFilter)
    refreshOps()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-border/40 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Demandes d&apos;accès</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Historique et validation des dossiers d&apos;inscription des membres.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {REQUEST_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setRequestStatusFilter(f.value)}
              className={cn(
                "text-[11px] px-3 py-1.5 rounded-full border transition-colors cursor-pointer",
                requestStatusFilter === f.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:bg-muted/50"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {pendingIds.length > 0 && (
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <Checkbox
              checked={selectedCount > 0 && pendingIds.every((id) => selectedIds.has(id))}
              onCheckedChange={toggleSelectAllPending}
            />
            <span className="text-xs text-muted-foreground">
              {selectedCount > 0 ? `${selectedCount} sélectionnée${selectedCount > 1 ? "s" : ""}` : "Sélectionner les demandes en attente"}
            </span>
          </label>
          {selectedCount > 0 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => batchReview("APPROVED")}
                className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors cursor-pointer"
              >
                <CheckCircle2 className="size-3" />
                Tout approuver
              </button>
              <button
                onClick={() => batchReview("REJECTED")}
                className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium bg-rose-600 text-white hover:bg-rose-700 transition-colors cursor-pointer"
              >
                <XCircle className="size-3" />
                Tout refuser
              </button>
              <button
                onClick={clearSelection}
                className="text-[10px] text-muted-foreground hover:text-foreground px-2 cursor-pointer"
              >
                Annuler
              </button>
            </div>
          )}
        </div>
      )}

      {loadingRequests ? (
        <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
      ) : requests.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {requests.map((req) => {
            const pending = req.status === "PENDING"
            const card = (
              <Card key={req.id} className="border-border/60 bg-card shadow-sm">
                <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2">
                    {pending && (
                      <Checkbox
                        checked={selectedIds.has(req.id)}
                        onCheckedChange={() => toggleSelect(req.id)}
                        className="mt-1"
                      />
                    )}
                    <div>
                      <h3 className="font-bold text-foreground text-sm">{req.user.name}</h3>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                        {req.user.email}
                        <EmailStatusBadge status={(req.user as any).emailStatus} />
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    {plans.length > 0 ? (
                      <select
                        value={req.plan.id}
                        onChange={(e) => handleChangePlan(req.id, e.target.value)}
                        className="text-[10px] border border-border rounded-md bg-card px-2 py-1 text-foreground cursor-pointer outline-none focus:border-primary/50 max-w-[140px] truncate"
                      >
                        {plans.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    ) : (
                      <Badge variant="outline" className="text-[9px] border-border">
                        {req.plan.name}
                      </Badge>
                    )}
                    <Badge
                      variant="outline"
                      className={cn("text-[9px]", REQUEST_STATUS_CLASS[req.status] || REQUEST_STATUS_CLASS.PENDING)}
                    >
                      {REQUEST_STATUS_LABELS[req.status] || req.status}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-1.5 text-[11px] text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Progression Onboarding</span>
                    <span className="font-semibold text-foreground">{req.onboarding.progress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${req.onboarding.progress}%` }}
                      className="h-full bg-primary transition-all duration-300"
                    />
                  </div>
                </div>

                {req.status !== "PENDING" && (
                  <div className="rounded-lg border border-border/60 bg-muted/30 p-3 space-y-1 text-[11px]">
                    <p className="text-muted-foreground">
                      Traité par <span className="font-medium text-foreground">{req.reviewer?.name ?? "Admin"}</span>
                      {req.reviewedAt ? ` · ${new Date(req.reviewedAt).toLocaleString("fr-FR")}` : ""}
                    </p>
                    {req.notes && (
                      <p className="text-foreground/90">
                        <span className="font-medium">Motif :</span> {req.notes}
                      </p>
                    )}
                    <button
                      onClick={() => openReexamine(req.id)}
                      className="mt-2 inline-flex items-center gap-1 text-[10px] text-primary hover:underline cursor-pointer"
                    >
                      <ChevronDown className="size-3" />
                      Réexaminer
                    </button>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2 border-t border-border/60">
                  <span className="text-[10px] text-muted-foreground">
                    Soumis le {new Date(req.createdAt).toLocaleString("fr-FR")}
                  </span>
                  {req.status === "PENDING" && (
                    <div className="flex gap-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        className="text-[10px] h-7 px-3.5 cursor-pointer"
                        onClick={() => openReject(req.id)}
                      >
                        Refuser
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        className="text-[10px] h-7 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white border-0 cursor-pointer"
                        onClick={() => handleApprove(req.id)}
                      >
                        Approuver
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            )

            if (!pending) return card

            return (
              <SwipeableRow
                key={req.id}
                disabled={isDesktop}
                leftActions={
                  <button
                    onClick={() => openReject(req.id)}
                    className="flex h-full w-full items-center justify-center gap-2 bg-rose-600/90 text-white text-[11px] font-medium"
                  >
                    ← Refuser
                  </button>
                }
                rightActions={
                  <button
                    onClick={() => swipeApprove(req.id)}
                    className="flex h-full w-full items-center justify-center gap-2 bg-emerald-600/90 text-white text-[11px] font-medium"
                  >
                    Approuver →
                  </button>
                }
              >
                {card}
              </SwipeableRow>
            )
          })}
          </div>
      ) : (
        <EmptyState
          icon={Inbox}
          title={requestStatusFilter === "ALL" ? "Aucune demande d'accès" : `Aucune demande ${REQUEST_STATUS_LABELS[requestStatusFilter]?.toLowerCase() ?? ""}`}
          description="Les nouvelles demandes d'inscription apparaîtront ici. Appuyez sur R pour tout réinitialiser."
          shortcut="R"
          action={{
            label: requestStatusFilter !== "ALL" ? "Toutes les demandes" : "Actualiser",
            onClick: () => setRequestStatusFilter("ALL"),
          }}
        />
      )}

      <Dialog open={reexamineOpen} onOpenChange={(o) => !o && setReexamineOpen(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Réexaminer la demande</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            {plans.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Plan</label>
                <select
                  value={reexaminePlanId}
                  onChange={(e) => setReexaminePlanId(e.target.value)}
                  className="w-full text-xs border border-border rounded-md bg-background px-3 py-2 text-foreground outline-none focus:border-primary/50 cursor-pointer"
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}
            <Button
              variant="default"
              className="bg-emerald-600 hover:bg-emerald-700 text-white border-0 cursor-pointer"
              onClick={() => handleReexamine("APPROVED")}
            >
              Réapprouver
            </Button>
            <Button
              variant="outline"
              className="border-amber-500/40 text-amber-500 hover:bg-amber-500/10 cursor-pointer"
              onClick={() => handleReexamine("SUSPENDED")}
            >
              Suspendre
            </Button>
            <Button
              variant="destructive"
              className="cursor-pointer"
              onClick={() => handleReexamine("REVOKED")}
            >
              Révoquer
            </Button>
            <Button
              variant="ghost"
              className="text-muted-foreground cursor-pointer"
              onClick={() => { setReexamineOpen(false); setReexamineTarget(null) }}
            >
              Annuler
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectOpen} onOpenChange={(o) => !o && setRejectOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refuser la demande d&apos;accès</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground mb-2">Motif du refus</p>
              <div className="flex flex-wrap gap-2">
                {REJECT_REASONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => setRejectReason(r)}
                    className={cn(
                      "text-[11px] px-3 py-1.5 rounded-full border transition-colors cursor-pointer",
                      rejectReason === r
                        ? "bg-rose-600 text-white border-rose-600"
                        : "border-border text-muted-foreground hover:bg-muted/50"
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Précisions (optionnel)</label>
              <textarea
                value={rejectNotes}
                onChange={(e) => setRejectNotes(e.target.value)}
                rows={3}
                placeholder="Détails supplémentaires..."
                className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRejectOpen(false)}>
                Annuler
              </Button>
              <Button variant="destructive" onClick={confirmReject} disabled={!rejectReason}>
                Confirmer le refus
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={batchOpen} onOpenChange={(o) => { if (!o) { setBatchOpen(false); setBatchResult(null) } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {batchResult ? "Résultat" : "Traitement par lot"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!batchResult ? (
              <div className="flex flex-col items-center gap-3 py-4">
                <Loader2 className="size-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground text-center">
                  Traitement de {selectedCount} demande{selectedCount > 1 ? "s" : ""}...
                </p>
                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-500 rounded-full"
                    style={{ width: `${Math.min(100, (batchStep / 5) * 100)}%` }}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {batchProgressText || "Traitement en cours..."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="size-4 text-emerald-500" />
                  <span>{batchResult.succeeded} {batchResult.action}</span>
                </div>
                {batchResult.failed > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <XCircle className="size-4 text-rose-500" />
                    <span>{batchResult.failed} échec{batchResult.failed > 1 ? "s" : ""}</span>
                  </div>
                )}
                <p className="text-[10px] text-muted-foreground pt-1 border-t border-border">
                  Les modifications sont effectives immédiatement.
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function EmailStatusBadge({ status }: { status: string | null | undefined }) {
  if (!status || status === "OK") {
    return <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-emerald-500/10 text-emerald-600">OK</span>
  }
  const config: Record<string, { label: string; class: string }> = {
    BOUNCED: { label: "BOUNCED", class: "bg-amber-500/10 text-amber-600" },
    INVALID: { label: "INVALID", class: "bg-rose-500/10 text-rose-600" },
  }
  const c = config[status] || { label: status, class: "bg-muted text-muted-foreground" }
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${c.class}`}>{c.label}</span>
}
