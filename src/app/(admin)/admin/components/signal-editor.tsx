"use client"

import { useEffect, useRef, useState } from "react"
import { 
  Bold, Italic, List, Image as ImageIcon, Trash2, Send, Loader2, 
  Save, Calendar, Check, X, Plus, FileText, Info, Laptop, Phone, Sparkles
} from "lucide-react"
import { Button, Card, CardContent, Checkbox, Badge, Input, cn } from "@nba/design-system"
import { parseSimpleMarkdown } from "@nba/lib/utils"

interface Plan {
  id: string
  name: string
  _count?: {
    users?: number
  }
}

export function SignalEditor({ onSignalCreated }: { onSignalCreated?: () => void }) {
  // Form fields states
  const [content, setContent] = useState("")
  const [imageUrls, setImageUrls] = useState<string[]>([])
  
  // Diffusion groups
  const [plans, setPlans] = useState<Plan[]>([])
  const [selectedPlans, setSelectedPlans] = useState<string[]>([])

  // Global states
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState<"DRAFT" | "PUBLISHED" | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  // Confirmation modal states
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [targetStatus, setTargetStatus] = useState<"DRAFT" | "PUBLISHED">("PUBLISHED")
  const [isEstimating, setIsEstimating] = useState(false)
  const [estimationResult, setEstimationResult] = useState<{ total: number; breakdown: Record<string, number> } | null>(null)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch plans
  useEffect(() => {
    fetch("/api/public/plans")
      .then((r) => r.json())
      .then((data) => {
        setPlans(data)
        // Auto-select all plans by default
        if (data.length > 0) {
          setSelectedPlans(data.map((p: Plan) => p.id))
        }
      })
      .catch((err) => console.error("Failed to load plans:", err))
  }, [])

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = "auto"
      textarea.style.height = `${textarea.scrollHeight}px`
    }
  }, [content])

  // Handle image upload
  async function handleImageUpload(file: File) {
    if (imageUrls.length >= 5) {
      alert("Vous pouvez télécharger jusqu'à 5 images maximum.")
      return
    }
    setIsUploading(true)
    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch("/api/admin/signals/upload", {
        method: "POST",
        body: formData,
      })
      if (!res.ok) throw new Error("Upload failed")
      const data = await res.json()
      setImageUrls((prev) => [...prev, data.path])
    } catch (err) {
      console.error(err)
      alert("Erreur lors du téléchargement de l'image")
    } finally {
      setIsUploading(false)
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    const remainingSlots = 5 - imageUrls.length
    if (remainingSlots <= 0) {
      alert("Vous pouvez télécharger jusqu'à 5 images maximum.")
      return
    }
    const toUpload = files.slice(0, remainingSlots)
    for (const file of toUpload) {
      handleImageUpload(file)
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(true)
  }

  function handleDragLeave() {
    setIsDragging(false)
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    const images = files.filter((f: File) => f.type.startsWith("image/"))
    if (images.length === 0) return

    const remainingSlots = 5 - imageUrls.length
    if (remainingSlots <= 0) {
      alert("Vous pouvez télécharger jusqu'à 5 images maximum.")
      return
    }

    const toUpload = images.slice(0, remainingSlots)
    for (const img of toUpload) {
      await handleImageUpload(img)
    }
  }

  async function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const items = Array.from(e.clipboardData.items)
    const imageItems = items.filter((item: DataTransferItem) => item.type.startsWith("image/"))
    if (imageItems.length === 0) return

    const remainingSlots = 5 - imageUrls.length
    if (remainingSlots <= 0) {
      e.preventDefault()
      alert("Vous pouvez télécharger jusqu'à 5 images maximum.")
      return
    }

    e.preventDefault()
    const toUpload = imageItems.slice(0, remainingSlots)
    for (const item of toUpload) {
      const file = item.getAsFile()
      if (file) {
        await handleImageUpload(file)
      }
    }
  }

  function insertFormat(prefix: string, suffix = "") {
    const textarea = textareaRef.current
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = textarea.value
    const selected = text.substring(start, end)
    const formatted = prefix + selected + suffix
    setContent(text.substring(0, start) + formatted + text.substring(end))
    
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length)
    }, 0)
  }

  // Open confirmation modal
  async function openConfirmation(status: "DRAFT" | "PUBLISHED") {
    if (!content.trim()) {
      alert("Veuillez rédiger ou coller le contenu de votre signal.")
      return
    }
    if (selectedPlans.length === 0) {
      alert("Veuillez sélectionner au moins un groupe de diffusion.")
      return
    }

    setTargetStatus(status)
    setShowConfirmModal(true)
    setIsEstimating(true)
    setEstimationResult(null)

    try {
      const planQuery = selectedPlans.map(id => `planIds=${id}`).join("&")
      const res = await fetch(`/api/admin/signals/estimate?${planQuery}`)
      if (res.ok) {
        const data = await res.json()
        setEstimationResult(data)
      }
    } catch (err) {
      console.error("Failed to estimate recipients:", err)
    } finally {
      setIsEstimating(false)
    }
  }

  // Submit Signal directly
  async function handleConfirmSubmit() {
    setShowConfirmModal(false)
    setIsSubmitting(targetStatus)

    try {
      const res = await fetch("/api/admin/signals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          imageUrls,
          planIds: selectedPlans,
          status: targetStatus,
          scheduledAt: null, // publication immédiate
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Submission failed")
      }

      // Success Reset
      setContent("")
      setImageUrls([])
      alert(targetStatus === "DRAFT" ? "Brouillon enregistré avec succès." : "Signal publié avec succès.")
      if (onSignalCreated) onSignalCreated()
    } catch (err: any) {
      console.error(err)
      alert(`Erreur : ${err.message || err}`)
    } finally {
      setIsSubmitting(null)
    }
  }

  // Toggle selected plan
  function togglePlan(planId: string) {
    if (selectedPlans.includes(planId)) {
      setSelectedPlans((prev) => prev.filter((id) => id !== planId))
    } else {
      setSelectedPlans((prev) => [...prev, planId])
    }
  }

  return (
    <div className="space-y-6">
      {/* Title bar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Créer un nouveau signal</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Collez votre analyse ou alerte et diffusez-la instantanément à vos abonnés.
          </p>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid gap-6 lg:grid-cols-5">
        
        {/* COLUMN LEFT - WRITING AREA (3 columns wide) */}
        <div className="lg:col-span-3 space-y-4">
          
          <Card className="border-border/50 bg-card/60 backdrop-blur-md shadow-sm">
            <CardContent className="p-4 space-y-4">
              
              {/* Unique copy-paste message area */}
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Message du signal</label>
                
                {/* Textarea editor with mini toolbar */}
                <div className="border rounded-xl bg-background overflow-hidden">
                  <div className="flex items-center gap-1.5 p-2 bg-muted/40 border-b">
                    <Button type="button" variant="ghost" size="sm" className="size-7 p-0 rounded-lg hover:bg-muted text-muted-foreground" onClick={() => insertFormat("**", "**")} title="Gras"><Bold className="size-3.5" /></Button>
                    <Button type="button" variant="ghost" size="sm" className="size-7 p-0 rounded-lg hover:bg-muted text-muted-foreground" onClick={() => insertFormat("*", "*")} title="Italique"><Italic className="size-3.5" /></Button>
                    <Button type="button" variant="ghost" size="sm" className="size-7 p-0 rounded-lg hover:bg-muted text-muted-foreground" onClick={() => insertFormat("- ")} title="Liste"><List className="size-3.5" /></Button>
                    <span className="w-px h-4 bg-border" />
                    <Button type="button" variant="ghost" size="sm" className="size-7 p-0 rounded-lg hover:bg-muted text-muted-foreground" onClick={() => fileInputRef.current?.click()} title="Joindre des images"><ImageIcon className="size-3.5" /></Button>
                  </div>
                  
                  <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onPaste={handlePaste}
                    placeholder="Collez ou rédigez votre signal ici... (ex: BUY EUR/USD, Entry, TP, SL, analyses...)"
                    className="w-full min-h-[180px] max-h-[400px] p-3 text-xs leading-relaxed outline-none border-0 resize-none bg-transparent"
                  />
                  
                  <div className="px-3 py-1 bg-muted/20 text-[9px] text-right text-muted-foreground border-t">
                    {content.length} caractères
                  </div>
                </div>
              </div>

              {/* Drag & Drop Upload Zone & Horizontal Gallery */}
              <div className="space-y-2">
                <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Images et captures d'écran</label>
                
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleFileChange} />
                
                {/* Horizontal previews gallery */}
                <div className="flex flex-wrap gap-2.5 items-center">
                  {imageUrls.map((url, idx) => (
                    <div key={idx} className="relative group size-16 rounded-xl overflow-hidden border bg-muted shrink-0">
                      <img src={`/api/files/${url}`} alt="" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setImageUrls((prev) => prev.filter((_, i) => i !== idx))}
                        className="absolute top-1 right-1 size-4 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black transition-colors"
                      >
                        <X className="size-2.5" />
                      </button>
                    </div>
                  ))}
                  
                  {imageUrls.length < 5 && (
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={cn(
                        "size-16 rounded-xl border border-dashed flex flex-col items-center justify-center hover:border-primary hover:bg-primary/5 transition-all text-muted-foreground hover:text-primary cursor-pointer shrink-0",
                        isDragging && "border-primary bg-primary/5"
                      )}
                    >
                      <Plus className="size-5 mb-0.5" />
                      <span className="text-[8px] font-bold">Ajouter</span>
                    </div>
                  )}
                  
                  {imageUrls.length === 0 && (
                    <span className="text-[10px] text-muted-foreground ml-1">
                      Glissez vos captures d'écran directement ici (max: 5 images, PNG, JPG, WEBP).
                    </span>
                  )}
                </div>
              </div>

            </CardContent>
          </Card>

        </div>

        {/* COLUMN RIGHT - DIFFUSION GROUPS & INBOX PREVIEW (2 columns wide) */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* APERCU INBOX MEMBRE */}
          <div className="space-y-1.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-primary" />
              Aperçu Inbox Membre
            </h3>
            <Card className="relative overflow-hidden border border-primary/20 bg-primary/5/10 shadow-md">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between border-b pb-2 border-border/50 text-[9px] text-muted-foreground">
                  <span className="flex items-center gap-1 font-bold">
                    <span className="size-1 rounded-full bg-emerald-500 animate-pulse" />
                    NBA VIP
                  </span>
                  <span>Aujourd'hui, 14:30</span>
                </div>
                
                {/* Message body preview */}
                <div 
                  className="text-xs text-foreground leading-relaxed whitespace-pre-wrap break-words min-h-[40px]"
                  dangerouslySetInnerHTML={{ __html: parseSimpleMarkdown(content.trim() || "Votre message formaté s'affichera ici...") }}
                />

                {/* Images grid preview */}
                {imageUrls.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/40">
                    {imageUrls.map((url, idx) => (
                      <div key={idx} className="relative aspect-video rounded-lg overflow-hidden border bg-muted">
                        <img src={`/api/files/${url}`} alt="" className="h-full w-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* GROUPS OF DIFFUSION CARD LIST */}
          <Card className="border-border/50 bg-card/60 backdrop-blur-md shadow-sm">
            <CardContent className="p-4 space-y-4">
              <h3 className="font-bold text-sm border-b pb-2">Groupes de diffusion</h3>

              <div className="grid gap-2">
                {plans.length === 0 ? (
                  <div className="text-center py-4 text-xs text-muted-foreground">Aucun groupe trouvé.</div>
                ) : (
                  plans.map((plan) => {
                    const isSelected = selectedPlans.includes(plan.id)
                    return (
                      <div
                        key={plan.id}
                        onClick={() => togglePlan(plan.id)}
                        className={cn(
                          "cursor-pointer text-xs p-3 rounded-xl border transition-all duration-200 flex items-center justify-between select-none",
                          isSelected
                            ? "border-primary/30 bg-primary/5 text-foreground font-semibold shadow-xs"
                            : "border-border hover:bg-muted/30 text-muted-foreground"
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => {}} // handled by div onClick
                          />
                          <span>Signals {plan.name}</span>
                        </div>
                        <Badge variant="outline" className="text-[9px] font-normal border-border/80 bg-background/50">
                          {plan._count?.users !== undefined ? `${plan._count.users} membres` : "— membres"}
                        </Badge>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Main Submit Actions */}
              <div className="flex flex-col gap-2 pt-2 border-t">
                <Button 
                  variant="default" 
                  size="sm" 
                  className="w-full h-10 text-xs rounded-xl font-bold bg-primary hover:bg-primary/95 text-primary-foreground flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  disabled={!content.trim() || isSubmitting !== null}
                  onClick={() => openConfirmation("PUBLISHED")}
                >
                  <Send className="size-4" />
                  Publier le signal immédiatement
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full h-10 text-xs rounded-xl cursor-pointer"
                  disabled={!content.trim() || isSubmitting !== null}
                  onClick={() => openConfirmation("DRAFT")}
                >
                  <Save className="size-4 mr-1.5" />
                  Enregistrer en brouillon
                </Button>
              </div>

            </CardContent>
          </Card>

        </div>

      </div>

      {/* Confirmation Modal overlay */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-background border rounded-2xl max-w-sm w-full shadow-2xl p-5 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-semibold text-base">Confirmation de publication</h3>
              <button onClick={() => setShowConfirmModal(false)} className="text-muted-foreground hover:text-foreground"><X className="size-4" /></button>
            </div>

            {isEstimating ? (
              <div className="flex flex-col items-center justify-center py-6 gap-3">
                <Loader2 className="size-8 animate-spin text-primary" />
                <p className="text-xs text-muted-foreground">Estimation des destinataires...</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground leading-normal">
                  Ce signal sera envoyé aux membres des groupes sélectionnés :
                </p>

                {estimationResult && (
                  <div className="space-y-1.5 rounded-xl bg-muted/40 p-3 border text-xs">
                    {Object.entries(estimationResult.breakdown).map(([planName, count]) => (
                      <div key={planName} className="flex justify-between text-muted-foreground">
                        <span>Signals {planName}</span>
                        <span className="font-medium text-foreground">{count} membres</span>
                      </div>
                    ))}
                    <div className="flex justify-between font-bold border-t pt-1.5 mt-1.5 text-primary">
                      <span>Total (uniques)</span>
                      <span>✓ {estimationResult.total} membres</span>
                    </div>
                  </div>
                )}
                
                <p className="text-[10px] text-amber-600 bg-amber-500/10 border border-amber-500/20 p-2 rounded-lg flex items-start gap-1.5">
                  <Info className="size-3.5 shrink-0 mt-0.5" />
                  <span>Cette action diffusera immédiatement le signal à tous les abonnés de ces canaux.</span>
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2 border-t pt-3">
              <Button variant="outline" size="sm" onClick={() => setShowConfirmModal(false)}>Annuler</Button>
              <Button onClick={handleConfirmSubmit} size="sm" disabled={isSubmitting !== null} className="gap-1.5">
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    Envoi...
                  </>
                ) : (
                  <>
                    <Send className="size-3.5" />
                    Confirmer l'envoi
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
