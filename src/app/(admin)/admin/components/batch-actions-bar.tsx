"use client"

import { useCallback, useState } from "react"
import { toast } from "sonner"
import { X, CheckCheck, Ban, RotateCw, Trash2, Loader2, UserPlus, CheckCircle2, XCircle, SkipForward } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@nba/design-system"
import { readBatchStream } from "@nba/lib/batch-stream"

interface BatchActionsBarProps {
  selectedIds: Set<string>
  onClear: () => void
  onSuccess: () => void
  plans?: { id: string; name: string }[]
}

interface BatchResult {
  succeeded: number
  skipped: number
  failed: number
  total: number
  errors?: { id: string; error: string }[]
  label?: string
}

export function BatchActionsBar({ selectedIds, onClear, onSuccess, plans = [] }: BatchActionsBarProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [assignPlanId, setAssignPlanId] = useState<string>("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogStep, setDialogStep] = useState(0)
  const [dialogProgressText, setDialogProgressText] = useState("")
  const [dialogResult, setDialogResult] = useState<BatchResult | null>(null)
  const count = selectedIds.size

  const runBatchWithDialog = useCallback(async (
    action: string,
    label: string,
    fn: () => Promise<BatchResult>
  ) => {
    setLoading(action)
    setDialogResult(null)
    setDialogStep(0)
    setDialogOpen(true)

    const interval = setInterval(() => {
      setDialogStep((prev) => (prev < 3 ? prev + 1 : prev))
    }, 700)

    try {
      const result = await fn()
      clearInterval(interval)
      setDialogStep(4)
      setDialogResult({ ...result, label })
      if (result.succeeded > 0) {
        toast.success(`${result.succeeded} membre(s) ${label.toLowerCase()}`)
      }
      if (result.failed > 0) {
        toast.error(`${result.failed} erreur(s)`)
      }
      onClear()
      onSuccess()
    } catch {
      clearInterval(interval)
      toast.error("Impossible de contacter le serveur. Vérifiez votre connexion.")
      setDialogOpen(false)
    } finally {
      setLoading(null)
    }
  }, [onClear, onSuccess])

  const batchAction = useCallback(async (action: string, body: Record<string, unknown>, label: string) => {
    await runBatchWithDialog(action, label, async () => {
      const res = await fetch("/api/admin/members", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: Array.from(selectedIds), ...body }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erreur")
      return {
        total: count,
        succeeded: data.count || 0,
        skipped: count - (data.count || 0),
        failed: 0,
      }
    })
  }, [selectedIds, count, runBatchWithDialog])

  const batchAssignToPlan = useCallback(async () => {
    if (!assignPlanId) { toast.error("Sélectionnez un plan"); return }
    const planName = plans.find((p) => p.id === assignPlanId)?.name || "ce plan"
    setLoading("assign_plan")
    setDialogResult(null)
    setDialogStep(0)
    setDialogProgressText("Envoi de la requête...")
    setDialogOpen(true)

    try {
      const res = await fetch("/api/admin/access-requests/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: Array.from(selectedIds), planId: assignPlanId }),
      })

      await readBatchStream(res, {
        onProgress: (data) => {
          setDialogStep(Math.min(3, Math.round((data.succeeded + data.failed) / data.total * 3)))
          setDialogProgressText(data.step)
        },
        onDone: (result) => {
          setDialogStep(4)
          setDialogProgressText("Terminé")
          setDialogResult({ ...result, label: `assigné(s) au plan « ${planName} »` })
          if (result.succeeded > 0) toast.success(`${result.succeeded} membre(s) assigné(s) au plan « ${planName} »`)
          if (result.failed > 0) toast.error(`${result.failed} erreur(s)`)
          setAssignPlanId("")
          onClear()
          onSuccess()
        },
        onError: (msg) => {
          toast.error(msg)
          setDialogOpen(false)
        },
      })
    } catch {
      toast.error("Impossible de contacter le serveur")
      setDialogOpen(false)
    } finally {
      setLoading(null)
    }
  }, [assignPlanId, selectedIds, plans, onClear, onSuccess])

  const batchDelete = useCallback(async () => {
    const confirmed = confirm(
      `Supprimer ${count} membre${count > 1 ? "s" : ""} ?\n\n` +
      `Seuls les membres inactifs seront supprimés. Cette action est irréversible.`
    )
    if (!confirmed) return

    await runBatchWithDialog("delete", "supprimé(s)", async () => {
      const res = await fetch("/api/admin/members/batch-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: Array.from(selectedIds) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erreur")
      return {
        total: count,
        succeeded: data.deleted || data.count || 0,
        skipped: 0,
        failed: count - (data.deleted || data.count || 0),
      }
    })
  }, [selectedIds, count, runBatchWithDialog])

  if (count === 0) return null

  return (
    <>
      <div className="sticky top-0 z-40 -mx-2 px-2 animate-in slide-in-from-top-2 duration-200">
        <div className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-4 py-2.5 shadow-lg backdrop-blur-sm">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="inline-flex size-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              {count}
            </span>
            <span className="text-sm font-medium text-foreground truncate">
              {count} membre{count > 1 ? "s" : ""} sélectionné{count > 1 ? "s" : ""}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => batchAction("activate", { isActive: true }, "activé(s)")}
              disabled={loading !== null}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-emerald-600 hover:bg-emerald-500/10 transition-colors disabled:opacity-50 cursor-pointer"
              title="Activer les membres sélectionnés"
            >
              {loading === "activate" ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCheck className="size-3.5" />}
              <span className="hidden sm:inline">Activer</span>
            </button>

            <button
              onClick={() => batchAction("suspend", { isActive: false }, "suspendu(s)")}
              disabled={loading !== null}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-amber-600 hover:bg-amber-500/10 transition-colors disabled:opacity-50 cursor-pointer"
              title="Suspendre les membres sélectionnés"
            >
              {loading === "suspend" ? <Loader2 className="size-3.5 animate-spin" /> : <Ban className="size-3.5" />}
              <span className="hidden sm:inline">Suspendre</span>
            </button>

            <button
              onClick={() => batchAction("force_onboarding", { onboardingStatus: "ACTIVE" }, "onboarding forcé")}
              disabled={loading !== null}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-500/10 transition-colors disabled:opacity-50 cursor-pointer"
              title="Forcer l'onboarding des membres sélectionnés"
            >
              {loading === "force_onboarding" ? <Loader2 className="size-3.5 animate-spin" /> : <RotateCw className="size-3.5" />}
              <span className="hidden sm:inline">Onboarding</span>
            </button>

            {plans.length > 0 && (
              <div className="flex items-center gap-1">
                <select
                  value={assignPlanId}
                  onChange={(e) => setAssignPlanId(e.target.value)}
                  className="text-[11px] border border-border rounded-md bg-background px-2 py-1 text-foreground outline-none focus:border-primary/50 cursor-pointer max-w-[130px] truncate"
                >
                  <option value="">Plan...</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <button
                  onClick={batchAssignToPlan}
                  disabled={loading !== null || !assignPlanId}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-violet-600 hover:bg-violet-500/10 transition-colors disabled:opacity-50 cursor-pointer"
                  title="Assigner les membres sélectionnés à un plan"
                >
                  {loading === "assign_plan" ? <Loader2 className="size-3.5 animate-spin" /> : <UserPlus className="size-3.5" />}
                  <span className="hidden sm:inline">Ajouter</span>
                </button>
              </div>
            )}

            <button
              onClick={batchDelete}
              disabled={loading !== null}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-500/10 transition-colors disabled:opacity-50 cursor-pointer"
              title="Supprimer les membres inactifs sélectionnés"
            >
              {loading === "delete" ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
              <span className="hidden sm:inline">Supprimer</span>
            </button>

            <div className="w-px h-5 bg-border mx-1" />

            <button
              onClick={onClear}
              disabled={loading !== null}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-50 cursor-pointer"
              title="Désélectionner tout"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) { setDialogOpen(false); setDialogResult(null) } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {dialogResult ? "Résultat" : "Traitement en cours"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!dialogResult ? (
              <div className="flex flex-col items-center gap-3 py-4">
                <Loader2 className="size-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground text-center">
                  Traitement de {count} membre{count > 1 ? "s" : ""}...
                </p>
                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-500 rounded-full"
                    style={{ width: `${Math.min(100, (dialogStep / 4) * 100)}%` }}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">{dialogProgressText || "Traitement en cours..."}</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="size-4 text-emerald-500" />
                  <span>{dialogResult.succeeded} {dialogResult.label || "traité(s)"}</span>
                </div>
                {dialogResult.skipped > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <SkipForward className="size-4 text-amber-500" />
                    <span>{dialogResult.skipped} ignoré{dialogResult.skipped > 1 ? "s" : ""}</span>
                  </div>
                )}
                {dialogResult.failed > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <XCircle className="size-4 text-rose-500" />
                      <span>{dialogResult.failed} erreur{dialogResult.failed > 1 ? "s" : ""}</span>
                    </div>
                    {dialogResult.errors && (
                      <div className="max-h-24 overflow-y-auto space-y-0.5">
                        {dialogResult.errors.slice(0, 5).map((e, i) => (
                          <p key={i} className="text-[10px] text-muted-foreground pl-6">
                            {e.id.slice(0, 8)}... — {e.error}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <p className="text-[10px] text-muted-foreground pt-1 border-t border-border">
                  Les données ont été propagées en base.
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
