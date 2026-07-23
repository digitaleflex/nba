"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import {
  Send, Loader2, Save, X, Check, Phone, Laptop, ChevronLeft, ChevronRight,
} from "lucide-react"
import { Button, Card, CardContent, cn, useMediaQuery } from "@nba/design-system"
import { toast } from "sonner"
import { StepContent } from "./signal-wizard/step-content"
import { StepAudience } from "./signal-wizard/step-audience"
import { StepSchedule } from "./signal-wizard/step-schedule"

interface Plan {
  id: string
  name: string
  _count?: { users?: number; accessRequests?: number }
}

const STEPS = ["Quoi", "À qui", "Quand"] as const

export function SignalEditor({ onSignalCreated }: { onSignalCreated?: () => void }) {
  // Form fields
  const [content, setContent] = useState("")
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [selectedPlans, setSelectedPlans] = useState<string[]>([])
  const [search, setSearch] = useState("")

  // Schedule
  const [scheduled, setScheduled] = useState(false)
  const [scheduledAt, setScheduledAt] = useState("")

  // UI state
  const [step, setStep] = useState(0)
  const [uploadingCount, setUploadingCount] = useState(0)
  const isUploading = uploadingCount > 0
  const [isSubmitting, setIsSubmitting] = useState<"DRAFT" | "PUBLISHED" | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [targetStatus, setTargetStatus] = useState<"DRAFT" | "PUBLISHED">("PUBLISHED")

  // Live estimate
  const [isEstimating, setIsEstimating] = useState(false)
  const [estimation, setEstimation] = useState<{
    total: number; overrideCount: number; breakdown: { planId: string; name: string; count: number }[]
  } | null>(null)
  const estimateRef = useRef<AbortController | null>(null)

  // Draft persistence
  const [draftId, setDraftId] = useState<string | null>(null)
  const isDesktop = useMediaQuery("(min-width: 768px)")

  // ---- Plenty of shared upload/estimate logic ----
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch("/api/public/plans").then((r) => r.json()).then(setPlans).catch((e) => console.error("plans", e))
    // Restore an in-progress draft (most recent DRAFT)
    fetch("/api/admin/signals?status=DRAFT&limit=1")
      .then((r) => r.json())
      .then((data) => {
        const list = data?.signals ?? data ?? []
        const d = Array.isArray(list) ? list[0] : null
        if (d && (d.content || (d.imageUrls?.length ?? 0) > 0 || (d.audience?.length ?? 0) > 0)) {
          setDraftId(d.id)
          setContent(d.content ?? "")
          setImageUrls(d.imageUrls ?? [])
          setSelectedPlans((d.audience ?? []).map((a: { planId: string }) => a.planId))
          if (d.scheduledAt) { setScheduled(true); setScheduledAt(new Date(d.scheduledAt).toISOString().slice(0, 16)) }
        }
      })
      .catch(() => {})
  }, [])

  // Live estimate (debounced)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (selectedPlans.length === 0) { setEstimation(null); return }
    setIsEstimating(true)
    const handle = setTimeout(async () => {
      const controller = new AbortController()
      estimateRef.current?.abort()
      estimateRef.current = controller
      try {
        const res = await fetch(`/api/admin/signals/estimate?planIds=${selectedPlans.join(",")}`, { signal: controller.signal })
        if (res.ok) {
          const data = await res.json()
          if (!controller.signal.aborted) setEstimation(data)
        }
      } catch (e) {
        if ((e as { name?: string })?.name !== "AbortError") console.error("estimate", e)
      } finally {
        if (!controller.signal.aborted) setIsEstimating(false)
      }
    }, 350)
    return () => clearTimeout(handle)
  }, [selectedPlans])

  // Autosave draft (debounced 1s)
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
    autosaveTimer.current = setTimeout(async () => {
      // Only autosave when there is something meaningful
      if (!content.trim() && imageUrls.length === 0 && selectedPlans.length === 0) return
      try {
        const res = await fetch("/api/admin/signals/draft", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: draftId ?? undefined,
            content,
            imageUrls,
            planIds: selectedPlans,
            scheduledAt: scheduled && scheduledAt ? new Date(scheduledAt).toISOString() : null,
          }),
        })
        if (res.ok) {
          const { id } = await res.json()
          if (id) setDraftId(id)
        }
      } catch (e) { /* silent autosave failure */ }
    }, 1000)
    return () => { if (autosaveTimer.current) clearTimeout(autosaveTimer.current) }
  }, [content, imageUrls, selectedPlans, scheduled, scheduledAt, draftId])

  const uploadSingleImage = useCallback(async (file: File): Promise<string | null> => {
    setUploadingCount((c) => c + 1)
    const formData = new FormData()
    formData.append("file", file)
    try {
      const res = await fetch("/api/admin/signals/upload", { method: "POST", body: formData })
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || "Upload échoué") }
      const data = await res.json()
      return data.path as string
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur d'upload")
      return null
    } finally {
      setUploadingCount((c) => c - 1)
    }
  }, [])

  function onUpload(file: File) {
    if (imageUrls.length >= 5) { toast.warning("Maximum 5 images."); return }
    void uploadSingleImage(file).then((p) => p && setImageUrls((prev) => [...prev, p]))
  }
  function onFileInput(files: FileList | null) {
    const arr = Array.from(files || []).slice(0, 5 - imageUrls.length)
    arr.forEach(onUpload)
  }
  function togglePlan(id: string) {
    setSelectedPlans((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  function openConfirmation(status: "DRAFT" | "PUBLISHED") {
    if (!content.trim()) { toast.warning("Veuillez rédiger le contenu du signal."); return }
    if (selectedPlans.length === 0) { toast.warning("Veuillez sélectionner au moins un groupe."); return }
    if (scheduled && (!scheduledAt || new Date(scheduledAt).getTime() <= Date.now())) {
      toast.warning("Choisissez une date de planification future."); return
    }
    setTargetStatus(status)
    setShowConfirm(true)
  }

  async function submit() {
    setShowConfirm(false)
    setIsSubmitting(targetStatus)
    try {
      let result: { queueFailed?: boolean } = {}
      if (targetStatus === "DRAFT") {
        // Reuse the draft endpoint (and existing draftId) instead of
        // creating a second DRAFT row via the strict create endpoint.
        const res = await fetch("/api/admin/signals/draft", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: draftId ?? undefined,
            content: content.trim(),
            imageUrls,
            planIds: selectedPlans,
            scheduledAt: scheduled && scheduledAt ? new Date(scheduledAt).toISOString() : null,
          }),
        })
        if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || "Échec") }
        const data: { id?: string } = await res.json()
        if (data.id) setDraftId(data.id)
        toast.success("Brouillon enregistré.")
        if (onSignalCreated) onSignalCreated()
        return
      }

      const res = await fetch("/api/admin/signals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          imageUrls,
          planIds: selectedPlans,
          status: targetStatus,
          scheduledAt: scheduled && scheduledAt ? new Date(scheduledAt).toISOString() : null,
        }),
      })
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || "Échec") }
      result = await res.json()
      // Draft consumed
      if (draftId) { try { await fetch(`/api/admin/signals/${draftId}`, { method: "DELETE" }) } catch {} }
      setDraftId(null)
      setContent(""); setImageUrls([]); setSelectedPlans([]); setScheduled(false); setScheduledAt("")
      if (result.queueFailed) toast.warning("Signal publié mais notifications push échouées (Redis/BullMQ).", { duration: 8000 })
      else toast.success("Signal publié avec succès.")
      if (onSignalCreated) onSignalCreated()
    } catch (err) {
      toast.error(`Erreur : ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setIsSubmitting(null)
    }
  }

  const canNext = step === 0 ? content.trim().length > 0 : step === 1 ? selectedPlans.length > 0 : true
  const isLast = step === STEPS.length - 1

  // Desktop: centered 600px card wizard. Mobile: full-screen per-step with horizontal slide.
  const stepBody = (
    <>
      {step === 0 && (
        <StepContent
          content={content}
          setContent={setContent}
          imageUrls={imageUrls}
          setImageUrls={setImageUrls}
          isUploading={isUploading}
          onUpload={onUpload}
          onFileInput={onFileInput}
        />
      )}
      {step === 1 && (
        <StepAudience
          plans={plans}
          selectedPlans={selectedPlans}
          togglePlan={togglePlan}
          search={search}
          setSearch={setSearch}
          estimation={estimation}
          isEstimating={isEstimating}
        />
      )}
      {step === 2 && (
        <StepSchedule scheduled={scheduled} setScheduled={setScheduled} scheduledAt={scheduledAt} setScheduledAt={setScheduledAt} />
      )}
    </>
  )

  const footer = (
    <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/60">
      <Button
        variant="ghost"
        size="sm"
        className="text-xs"
        disabled={step === 0}
        onClick={() => setStep((s) => Math.max(0, s - 1))}
      >
        <ChevronLeft className="size-4" /> Précédent
      </Button>

      <div className="flex items-center gap-1.5">
        {STEPS.map((_, i) => (
          <span key={i} className={cn("size-1.5 rounded-full transition-colors", i === step ? "bg-primary" : "bg-border")} />
        ))}
      </div>

      {isLast ? (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="text-[10px] h-8" disabled={isSubmitting !== null} onClick={() => openConfirmation("DRAFT")}>
            <Save className="size-3.5" /> Brouillon
          </Button>
          <Button size="sm" className="text-[10px] h-8" disabled={isSubmitting !== null} onClick={() => openConfirmation("PUBLISHED")}>
            <Send className="size-3.5" /> Publier
          </Button>
        </div>
      ) : (
        <Button
          size="sm"
          className="text-xs"
          disabled={!canNext}
          onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
        >
          Suivant <ChevronRight className="size-4" />
        </Button>
      )}
    </div>
  )

  // ---------- Mobile: full screen with horizontal slide ----------
  if (!isDesktop) {
    return (
      <div className="lg:hidden">
        <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
          <div>
            <h1 className="text-lg font-bold tracking-tight">Nouveau signal</h1>
            <p className="text-[11px] text-muted-foreground">Étape {step + 1}/{STEPS.length} — {STEPS[step]}</p>
          </div>
          <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Phone className="size-3" /> Mobile</span>
        </div>

        <div className="overflow-hidden">
          <div
            className="flex transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${step * 100}%)` }}
          >
            {STEPS.map((_, i) => (
              <div key={i} className="w-full shrink-0 px-0.5">
                {step === i && stepBody}
              </div>
            ))}
          </div>
        </div>

        {footer}

        {showConfirm && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            role="dialog" aria-modal="true" aria-labelledby="confirm-title-mobile"
            onKeyDown={(e) => { if (e.key === "Escape") setShowConfirm(false) }}
          >
            <div className="bg-background border rounded-2xl max-w-sm w-full shadow-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 id="confirm-title-mobile" className="font-semibold text-base">Confirmation</h3>
                <button onClick={() => setShowConfirm(false)} className="text-muted-foreground" aria-label="Fermer"><X className="size-4" /></button>
              </div>
              <p className="text-xs text-muted-foreground">
                {targetStatus === "DRAFT" ? "Enregistrer ce brouillon ?" : `Diffuser à ${estimation?.total ?? selectedPlans.length} membre(s) ?`}
              </p>
              <div className="flex justify-end gap-2 border-t pt-3">
                <Button variant="outline" size="sm" onClick={() => setShowConfirm(false)}>Annuler</Button>
                <Button size="sm" disabled={isSubmitting !== null} onClick={submit}>
                  {isSubmitting ? <><Loader2 className="size-3.5 animate-spin" /> Envoi...</> : <><Check className="size-3.5" /> Confirmer</>}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ---------- Desktop: centered 600px wizard ----------
  return (
    <div className="hidden lg:block max-w-[600px] mx-auto space-y-5">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Créer un nouveau signal</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Flow guidé en 3 étapes.</p>
        </div>
        <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Laptop className="size-3" /> Desktop</span>
      </div>

      <div className="flex items-center gap-2">
        {STEPS.map((label, i) => (
          <button
            key={label}
            onClick={() => setStep(i)}
            className={cn(
              "flex-1 flex items-center gap-2 px-3 py-2 rounded-xl border text-xs transition-colors",
              i === step ? "border-primary/30 bg-primary/5 text-foreground font-semibold" : "border-border text-muted-foreground hover:bg-muted/30"
            )}
          >
            <span className={cn("size-5 rounded-full flex items-center justify-center text-[10px]", i === step ? "bg-primary text-primary-foreground" : "bg-muted")}>{i + 1}</span>
            {label}
          </button>
        ))}
      </div>

      <Card className="border-border/50 bg-card/60 backdrop-blur-md">
        <CardContent className="p-5 space-y-5 min-h-[320px]">
          {stepBody}
        </CardContent>
      </Card>

      {footer}

      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          role="dialog" aria-modal="true" aria-labelledby="confirm-title-desktop"
          onKeyDown={(e) => { if (e.key === "Escape") setShowConfirm(false) }}
        >
          <div className="bg-background border rounded-2xl max-w-sm w-full shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 id="confirm-title-desktop" className="font-semibold text-base">Confirmation de publication</h3>
              <button onClick={() => setShowConfirm(false)} className="text-muted-foreground" aria-label="Fermer"><X className="size-4" /></button>
            </div>
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">Ce signal sera envoyé aux membres des groupes sélectionnés.</p>
              {estimation && (
                <div className="space-y-1.5 rounded-xl bg-muted/40 p-3 border text-xs">
                  {estimation.breakdown.map((b) => (
                    <div key={b.planId} className="flex justify-between text-muted-foreground">
                      <span className="truncate pr-2">{b.name}</span>
                      <span className="font-medium text-foreground">{b.count}</span>
                    </div>
                  ))}
                  {estimation.overrideCount > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Accès global (override)</span>
                      <span className="font-medium text-foreground">{estimation.overrideCount}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold border-t pt-1.5 mt-1.5 text-primary">
                    <span>Total (uniques)</span>
                    <span>✓ {estimation.total}</span>
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 border-t pt-3">
              <Button variant="outline" size="sm" onClick={() => setShowConfirm(false)}>Annuler</Button>
              <Button size="sm" disabled={isSubmitting !== null} onClick={submit}>
                {isSubmitting ? <><Loader2 className="size-3.5 animate-spin" /> Envoi...</> : <><Check className="size-3.5" /> Confirmer</>}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
