"use client"

import { useEffect, useState, useCallback } from "react"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { Button, Card, CardContent, Badge, Dialog, DialogContent, DialogHeader, DialogTitle, cn } from "@nba/design-system"
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
  const [requestStatusFilter, setRequestStatusFilter] = useState<string>("ALL")
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectTarget, setRejectTarget] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState<string>("")
  const [rejectNotes, setRejectNotes] = useState<string>("")

  const fetchRequests = useCallback(async (status = "ALL") => {
    setLoadingRequests(true)
    try {
      const { ok, data } = await cachedGet(`/api/admin/access-requests?status=${status}`)
      if (ok) {
        setRequests(data)
      } else {
        toast.error("Erreur de chargement des demandes")
      }
    } catch (err) {
      console.error(err)
      toast.error("Erreur de chargement des demandes")
    } finally {
      setLoadingRequests(false)
    }
  }, [cachedGet])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRequests(requestStatusFilter)
  }, [requestStatusFilter, fetchRequests])

  async function handleApprove(id: string) {
    if (!confirm("Approuver cette demande d'accès ?")) return
    invalidate()
    await fetch(`/api/admin/access-requests/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "APPROVED", reviewerId: "admin", notes: "Demande approuvée" }),
    })
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
    const notes = rejectNotes.trim() ? `${rejectReason} — ${rejectNotes.trim()}` : rejectReason
    await fetch(`/api/admin/access-requests/${rejectTarget}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "REJECTED", reviewerId: "admin", notes }),
    })
    setRejectOpen(false)
    setRejectTarget(null)
    fetchRequests(requestStatusFilter)
    refreshOps()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-border pb-5">
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

      {loadingRequests ? (
        <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
      ) : requests.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {requests.map((req) => (
            <Card key={req.id} className="border-border bg-card/30">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-foreground text-sm">{req.user.name}</h3>
                    <p className="text-[10px] text-muted-foreground">{req.user.email}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <Badge variant="outline" className="text-[9px] border-border">
                      {req.plan.name}
                    </Badge>
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
                      {req.reviewedAt ? ` · ${new Date(req.reviewedAt).toLocaleDateString("fr-FR")}` : ""}
                    </p>
                    {req.notes && (
                      <p className="text-foreground/90">
                        <span className="font-medium">Motif :</span> {req.notes}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex justify-between items-center pt-2 border-t border-border/60">
                  <span className="text-[10px] text-muted-foreground">
                    Soumis le {new Date(req.createdAt).toLocaleDateString()}
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
          ))}
        </div>
      ) : (
        <div className="py-16 text-center border border-dashed border-border rounded-2xl text-muted-foreground select-none">
          {requestStatusFilter === "ALL"
            ? "Aucune demande d'accès."
            : `Aucune demande ${REQUEST_STATUS_LABELS[requestStatusFilter]?.toLowerCase() ?? ""}.`}
        </div>
      )}

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
    </div>
  )
}
