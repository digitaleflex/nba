"use client"

import { useEffect, useRef, useState } from "react"
import { 
  Bold, Italic, List, Image as ImageIcon, Trash2, Send, Loader2, 
  Save, Calendar, Check, X, Plus, FileText, Info
} from "lucide-react"
import { Button, Card, CardContent, Checkbox, Badge, Input, cn } from "@nba/design-system"

interface Plan {
  id: string
  name: string
  _count?: {
    users?: number
  }
}

export function SignalEditor({ onSignalCreated }: { onSignalCreated?: () => void }) {
  // Form fields states
  const [title, setTitle] = useState("")
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

    // Build the content payload (Title + Message, or Message directly if title is omitted)
    const formattedContent = title.trim() 
      ? `### ${title.trim()}\n\n${content.trim()}`
      : content.trim()

    try {
      const res = await fetch("/api/admin/signals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: formattedContent,
          imageUrls,
          planIds: selectedPlans,
          status: targetStatus,
          scheduledAt: null, // simplification : direct dispatch
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Submission failed")
      }

      // Success Reset
      setTitle("")
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

  return (
    <div className="space-y-6">
      {/* Title bar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Créer un nouveau signal</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Collez votre texte libre et choisissez les groupes de diffusion.
          </p>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid gap-6 lg:grid-cols-5">
        
        {/* COLUMN LEFT - COPY PASTE TEXT FORM (3 columns wide) */}
        <div className="lg:col-span-3 space-y-4">
          
          <Card className="border-border/50 bg-card/60 backdrop-blur-md shadow-sm">
            <CardContent className="p-4 space-y-4">
              
              {/* Optional Title input */}
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Titre du signal (Optionnel)</label>
                <Input 
                  placeholder="Ex: EUR/USD - Achat support clé" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-xs"
                />
              </div>

              {/* Unique copy-paste message area */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Message ou Signal (Texte libre)</label>
                </div>
                
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
                    className="w-full min-h-[160px] max-h-[400px] p-3 text-xs leading-relaxed outline-none border-0 resize-none bg-transparent"
                  />
                  
                  <div className="px-3 py-1 bg-muted/20 text-[9px] text-right text-muted-foreground border-t">
                    {content.length} caractères
                  </div>
                </div>
              </div>

              {/* Upload section discrete button and gallery */}
              <div className="space-y-1.5">
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleFileChange} />
                
                {imageUrls.length > 0 && (
                  <div className="grid grid-cols-5 gap-3 w-full border rounded-xl p-3 bg-muted/10">
                    {imageUrls.map((url, idx) => (
                      <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border bg-muted">
                        <img src={`/api/files/${url}`} alt="" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setImageUrls((prev) => prev.filter((_, i) => i !== idx))}
                          className="absolute top-1 right-1 size-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black transition-colors"
                        >
                          <X className="size-3" />
                        </button>
                      </div>
                    ))}
                    {imageUrls.length < 5 && (
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-square rounded-lg border border-dashed flex flex-col items-center justify-center hover:border-primary hover:bg-primary/5 transition-all text-muted-foreground hover:text-primary cursor-pointer"
                      >
                        <Plus className="size-4 mb-0.5" />
                        <span className="text-[9px] font-bold">Ajouter</span>
                      </div>
                    )}
                  </div>
                )}
                
                {imageUrls.length === 0 && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="h-9 text-xs rounded-xl"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Plus className="size-4 mr-1.5" />
                    Associer des graphiques / images ({imageUrls.length}/5)
                  </Button>
                )}
              </div>

            </CardContent>
          </Card>

        </div>

        {/* COLUMN RIGHT - DIFFUSION GROUPS & SUBMIT (2 columns wide) */}
        <div className="lg:col-span-2 space-y-4">
          
          <Card className="border-border/50 bg-card/60 backdrop-blur-md shadow-sm">
            <CardContent className="p-4 space-y-4">
              <h3 className="font-bold text-sm border-b pb-2">Groupes de diffusion</h3>

              <div className="space-y-2">
                {plans.length === 0 ? (
                  <div className="text-center py-4 text-xs text-muted-foreground">Aucun groupe trouvé.</div>
                ) : (
                  plans.map((plan) => (
                    <label
                      key={plan.id}
                      className={cn(
                        "flex items-center justify-between cursor-pointer text-xs p-3 rounded-xl border transition-all duration-200",
                        selectedPlans.includes(plan.id)
                          ? "border-primary/20 bg-primary/5 text-foreground font-semibold"
                          : "border-border hover:bg-muted/30 text-muted-foreground"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <Checkbox
                          checked={selectedPlans.includes(plan.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedPlans((prev) => [...prev, plan.id])
                            } else {
                              setSelectedPlans((prev) => prev.filter((id) => id !== plan.id))
                            }
                          }}
                        />
                        <span>Signals {plan.name}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground/80 font-normal">
                        {plan._count?.users !== undefined ? `${plan._count.users} membres` : "— membres"}
                      </span>
                    </label>
                  ))
                )}
              </div>

              {/* Main Submit Actions directly inside the Card */}
              <div className="flex flex-col gap-2 pt-2 border-t">
                <Button 
                  variant="default" 
                  size="sm" 
                  className="w-full h-10 text-xs rounded-xl font-bold bg-primary hover:bg-primary/95 text-primary-foreground flex items-center justify-center gap-1.5 cursor-pointer"
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
          <div className="bg-background border rounded-2xl max-w-md w-full shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-semibold text-lg">Confirmation de publication</h3>
              <button onClick={() => setShowConfirmModal(false)} className="text-muted-foreground hover:text-foreground"><X className="size-5" /></button>
            </div>

            {isEstimating ? (
              <div className="flex flex-col items-center justify-center py-6 gap-3">
                <Loader2 className="size-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Estimation des destinataires...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Le message de signal sera envoyé à tous les abonnés actifs des groupes suivants :
                </p>

                {estimationResult && (
                  <div className="space-y-2 rounded-xl bg-muted/40 p-4 border text-sm">
                    <div className="flex justify-between font-semibold border-b pb-2 mb-2">
                      <span>Groupe</span>
                      <span>Destinataires</span>
                    </div>
                    {Object.entries(estimationResult.breakdown).map(([planName, count]) => (
                      <div key={planName} className="flex justify-between text-xs text-muted-foreground">
                        <span>{planName}</span>
                        <span className="font-medium text-foreground">{count} membres</span>
                      </div>
                    ))}
                    <div className="flex justify-between font-bold border-t pt-2 mt-2 text-primary">
                      <span>Total (uniques)</span>
                      <span>{estimationResult.total} membres</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 border-t pt-4">
              <Button variant="outline" onClick={() => setShowConfirmModal(false)}>Annuler</Button>
              <Button onClick={handleConfirmSubmit} disabled={isSubmitting !== null} className="gap-1.5">
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Publication...
                  </>
                ) : (
                  <>
                    <Send className="size-4" />
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
