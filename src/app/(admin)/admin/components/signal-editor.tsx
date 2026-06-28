"use client"

import { useEffect, useRef, useState } from "react"
import { 
  Bold, Italic, List, Image as ImageIcon, Trash2, Send, Loader2, Sparkles, 
  Eye, Save, Calendar, Check, X, Copy, Plus, FileText, ChevronDown, Laptop, Phone 
} from "lucide-react"
import { Button, Card, CardContent, Checkbox, Badge, Input, cn } from "@nba/design-system"
import { parseSimpleMarkdown } from "@nba/lib/utils"

interface Plan {
  id: string
  name: string
}

export function SignalEditor({ onSignalCreated }: { onSignalCreated?: () => void }) {
  const [content, setContent] = useState("")
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [selectedPlans, setSelectedPlans] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState<"DRAFT" | "PUBLISHED" | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  // Scheduling state
  const [isScheduling, setIsScheduling] = useState(false)
  const [scheduleDate, setScheduleDate] = useState("")
  const [scheduleTime, setScheduleTime] = useState("")

  // Preview options
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop")

  // Templates state
  const [templates, setTemplates] = useState<any[]>([])
  const [showTemplates, setShowTemplates] = useState(false)
  const [newTemplateName, setNewTemplateName] = useState("")
  const [isSavingTemplate, setIsSavingTemplate] = useState(false)

  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [targetStatus, setTargetStatus] = useState<"DRAFT" | "PUBLISHED">("PUBLISHED")
  const [isEstimating, setIsEstimating] = useState(false)
  const [estimationResult, setEstimationResult] = useState<{ total: number; breakdown: Record<string, number> } | null>(null)
  
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch plans (diffusion groups)
  useEffect(() => {
    fetch("/api/public/plans")
      .then((r) => r.json())
      .then(setPlans)
      .catch((err) => console.error("Failed to load plans:", err))
  }, [])

  // Fetch templates
  async function fetchTemplates() {
    try {
      const res = await fetch("/api/admin/signals/templates")
      if (res.ok) {
        const data = await res.json()
        setTemplates(data)
      }
    } catch (err) {
      console.error("Failed to load templates:", err)
    }
  }

  useEffect(() => {
    fetchTemplates()
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

  // Handle file input change
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

  // Handle Drag & Drop
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
    const images = files.filter((f) => f.type.startsWith("image/"))
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

  // Handle Paste (Screenshot)
  async function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const items = Array.from(e.clipboardData.items)
    const imageItems = items.filter((item) => item.type.startsWith("image/"))
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

  // Keyboard shortcut Ctrl+Enter to publish
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      openConfirmation("PUBLISHED")
    }
  }

  // Insert formatting tags
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

  // Scheduling initialization/toggling
  function handleToggleScheduling() {
    if (isScheduling) {
      setIsScheduling(false)
      setScheduleDate("")
      setScheduleTime("")
    } else {
      setIsScheduling(true)
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      setScheduleDate(`${year}-${month}-${day}`)
      
      now.setHours(now.getHours() + 1)
      const hours = String(now.getHours()).padStart(2, '0')
      const minutes = String(now.getMinutes()).padStart(2, '0')
      setScheduleTime(`${hours}:${minutes}`)
    }
  }

  // Templates Management
  async function handleSaveTemplate() {
    if (!newTemplateName.trim()) {
      alert("Veuillez entrer un nom pour le modèle.")
      return
    }
    if (!content.trim()) {
      alert("Veuillez rédiger du contenu à enregistrer comme modèle.")
      return
    }

    try {
      const res = await fetch("/api/admin/signals/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTemplateName.trim(),
          content: content.trim(),
        }),
      })
      if (res.ok) {
        setNewTemplateName("")
        setIsSavingTemplate(false)
        fetchTemplates()
      } else {
        const err = await res.json()
        alert(`Erreur : ${err.error || "Impossible d'enregistrer le modèle"}`)
      }
    } catch (err) {
      console.error(err)
      alert("Erreur lors de la sauvegarde du modèle")
    }
  }

  async function handleDeleteTemplate(id: string) {
    if (!confirm("Voulez-vous vraiment supprimer ce modèle ?")) return
    try {
      const res = await fetch(`/api/admin/signals/templates/${id}`, {
        method: "DELETE",
      })
      if (res.ok) {
        fetchTemplates()
      } else {
        alert("Impossible de supprimer le modèle")
      }
    } catch (err) {
      console.error(err)
      alert("Erreur lors de la suppression")
    }
  }

  // Confirmation Modal and Estimate
  async function openConfirmation(status: "DRAFT" | "PUBLISHED") {
    if (!content.trim()) return
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

  // Submit Signal
  async function handleConfirmSubmit() {
    setShowConfirmModal(false)
    setIsSubmitting(targetStatus)

    let scheduledAt: string | null = null
    if (isScheduling && scheduleDate && scheduleTime) {
      scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`).toISOString()
    }

    try {
      const res = await fetch("/api/admin/signals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          imageUrls,
          planIds: selectedPlans,
          status: targetStatus,
          scheduledAt,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Submission failed")
      }

      // Success: Reset form
      setContent("")
      setImageUrls([])
      setSelectedPlans([])
      setIsScheduling(false)
      setScheduleDate("")
      setScheduleTime("")
      if (onSignalCreated) onSignalCreated()
    } catch (err: any) {
      console.error(err)
      alert(`Erreur : ${err.message}`)
    } finally {
      setIsSubmitting(null)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Editor Panel */}
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Rédiger un signal</h2>
          <p className="text-sm text-muted-foreground">
            Écrivez en texte libre, glissez-déposez des graphiques et publiez en quelques secondes.
          </p>
        </div>

        <Card 
          className={cn(
            "relative border transition-all duration-200",
            isDragging ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <CardContent className="p-4 space-y-4">
            {/* Formatting Toolbar */}
            <div className="flex items-center gap-1 border-b pb-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="size-8 p-0"
                onClick={() => insertFormat("**", "**")}
                title="Gras (Ctrl+B)"
              >
                <Bold className="size-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="size-8 p-0"
                onClick={() => insertFormat("*", "*")}
                title="Italique"
              >
                <Italic className="size-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="size-8 p-0"
                onClick={() => insertFormat("- ")}
                title="Liste à puces"
              >
                <List className="size-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="size-8 p-0"
                onClick={() => fileInputRef.current?.click()}
                title="Ajouter une image"
              >
                <ImageIcon className="size-4" />
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                multiple
                onChange={handleFileChange}
              />
            </div>

            {/* Editor Textarea */}
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onPaste={handlePaste}
              onKeyDown={handleKeyDown}
              placeholder="Écrivez votre signal de trading ici... (ex: 📈 EUR/USD BUY NOW...)"
              className="w-full min-h-[160px] max-h-[400px] resize-none bg-transparent text-sm leading-relaxed outline-none border-0 ring-0 focus:ring-0 focus:outline-hidden"
              disabled={isSubmitting !== null}
            />

            {/* Multi-Image Gallery Grid */}
            {imageUrls.length > 0 && (
              <div className="grid grid-cols-5 gap-2 border-t pt-3">
                {imageUrls.map((url, idx) => (
                  <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-border bg-muted">
                    <img
                      src={`/api/files/${url}`}
                      alt={`Upload ${idx + 1}`}
                      className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="size-7 rounded-full p-0"
                        onClick={() => setImageUrls((prev) => prev.filter((_, i) => i !== idx))}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {isUploading && (
              <div className="flex items-center gap-2 rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground animate-pulse">
                <Loader2 className="size-4 animate-spin text-primary" />
                <span>Téléchargement du graphique...</span>
              </div>
            )}

            {/* Scheduling Config Panel */}
            {isScheduling && (
              <div className="border-t pt-4 space-y-3 animate-in fade-in-50 duration-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Planifier la publication</h4>
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => handleToggleScheduling()}>
                    Annuler
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">Date</label>
                    <Input
                      type="date"
                      min={new Date().toISOString().split("T")[0]}
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">Heure</label>
                    <Input
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Templates Panel */}
            {showTemplates && (
              <div className="border-t pt-4 space-y-3 animate-in fade-in-50 duration-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Modèles de signal</h4>
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setShowTemplates(false)}>
                    Fermer
                  </Button>
                </div>

                {templates.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">Aucun modèle disponible.</p>
                ) : (
                  <div className="grid gap-2 max-h-[160px] overflow-y-auto pr-1">
                    {templates.map((t) => (
                      <div key={t.id} className="flex items-center justify-between p-2 rounded-lg border bg-muted/20 text-xs">
                        <button
                          type="button"
                          onClick={() => {
                            setContent(t.content)
                            setShowTemplates(false)
                          }}
                          className="flex-1 text-left font-medium hover:text-primary transition-colors truncate pr-2"
                        >
                          {t.name}
                        </button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="size-7 p-0 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteTemplate(t.id)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Save template action */}
                {isSavingTemplate ? (
                  <div className="border-t pt-3 flex flex-col gap-2">
                    <Input
                      placeholder="Nom du modèle (ex: Forex, Deriv...)"
                      value={newTemplateName}
                      onChange={(e) => setNewTemplateName(e.target.value)}
                      className="h-8 text-xs"
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setIsSavingTemplate(false)}>
                        Annuler
                      </Button>
                      <Button size="sm" className="h-7 text-xs" onClick={handleSaveTemplate}>
                        Enregistrer le modèle
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="border-t pt-3 flex justify-end">
                    <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => setIsSavingTemplate(true)} disabled={!content.trim()}>
                      <Plus className="size-3.5" />
                      Enregistrer comme modèle
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Bottom Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4 mt-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 px-3 gap-1.5 text-xs rounded-xl"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={imageUrls.length >= 5 || isUploading}
                >
                  <ImageIcon className="size-4 text-muted-foreground" />
                  <span>Image {imageUrls.length > 0 && `(${imageUrls.length}/5)`}</span>
                </Button>

                <Button
                  type="button"
                  variant={showTemplates ? "secondary" : "outline"}
                  size="sm"
                  className="h-9 px-3 gap-1.5 text-xs rounded-xl"
                  onClick={() => {
                    setShowTemplates(!showTemplates)
                    setIsScheduling(false)
                  }}
                >
                  <FileText className="size-4 text-muted-foreground" />
                  <span>Modèles</span>
                  <ChevronDown className="size-3 text-muted-foreground transition-transform duration-200" style={{ transform: showTemplates ? 'rotate(180deg)' : 'none' }} />
                </Button>

                <Button
                  type="button"
                  variant={isScheduling ? "secondary" : "outline"}
                  size="sm"
                  className={cn(
                    "h-9 px-3 gap-1.5 text-xs rounded-xl",
                    isScheduling && "text-amber-500 border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10"
                  )}
                  onClick={() => {
                    handleToggleScheduling()
                    setShowTemplates(false)
                  }}
                >
                  <Calendar className="size-4" />
                  <span>Programmer</span>
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 text-xs rounded-xl text-muted-foreground hover:text-foreground"
                  disabled={!content.trim() || isSubmitting !== null}
                  onClick={() => openConfirmation("DRAFT")}
                >
                  <Save className="size-4 mr-1.5" />
                  Brouillon
                </Button>

                <Button
                  size="sm"
                  className="h-9 text-xs rounded-xl px-4 font-semibold"
                  disabled={!content.trim() || isSubmitting !== null}
                  onClick={() => openConfirmation("PUBLISHED")}
                >
                  <Send className="size-4 mr-1.5" />
                  {isScheduling ? "Planifier" : "Publier maintenant"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Diffusion Groups Selection */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Groupes de diffusion</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {plans.map((plan) => (
              <label
                key={plan.id}
                className={cn(
                  "flex items-center gap-3 cursor-pointer text-sm p-3 rounded-xl border transition-all duration-200",
                  selectedPlans.includes(plan.id)
                    ? "border-primary/30 bg-primary/5 text-foreground ring-1 ring-primary/10"
                    : "border-border hover:bg-muted/40 text-muted-foreground"
                )}
              >
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
                <span className="select-none font-medium text-foreground/90">{plan.name}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Live Preview Panel */}
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight flex items-center gap-1.5">
              <Sparkles className="size-4 text-primary" />
              Aperçu en direct
            </h2>
            <p className="text-sm text-muted-foreground">
              Visualisez le signal sur ordinateur ou mobile.
            </p>
          </div>

          {/* Desktop/Mobile switcher */}
          <div className="flex items-center gap-1 border rounded-lg p-1 bg-muted/30">
            <button
              onClick={() => setPreviewDevice("desktop")}
              className={cn(
                "p-1.5 rounded-md hover:bg-muted transition-colors",
                previewDevice === "desktop" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground"
              )}
              title="Aperçu Bureau"
            >
              <Laptop className="size-4" />
            </button>
            <button
              onClick={() => setPreviewDevice("mobile")}
              className={cn(
                "p-1.5 rounded-md hover:bg-muted transition-colors",
                previewDevice === "mobile" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground"
              )}
              title="Aperçu Mobile"
            >
              <Phone className="size-4" />
            </button>
          </div>
        </div>

        {previewDevice === "mobile" ? (
          /* Smartphone Mockup */
          <div className="mx-auto w-[340px] border-[10px] border-neutral-800 rounded-[38px] overflow-hidden bg-neutral-950 shadow-2xl relative animate-in zoom-in-95 duration-200">
            {/* Notch */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-5 bg-neutral-800 rounded-full z-20 flex items-center justify-center">
              <div className="w-10 h-1 bg-neutral-950 rounded-full mr-2" />
              <div className="size-1.5 bg-neutral-950 rounded-full" />
            </div>
            
            <div className="pt-9 pb-6 px-3 bg-background min-h-[500px]">
              {/* Inner preview */}
              <div className="space-y-4">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground border-b pb-2">
                  <span className="flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Direct
                  </span>
                  <Badge variant="outline" className="text-[9px] py-0 px-1 border-primary/20 bg-primary/5 text-primary">
                    Signal
                  </Badge>
                </div>

                {content.trim() ? (
                  <div 
                    className="text-xs font-medium text-foreground whitespace-pre-wrap leading-relaxed space-y-1.5 break-words"
                    dangerouslySetInnerHTML={{ __html: parseSimpleMarkdown(content) }}
                  />
                ) : (
                  <p className="text-xs text-muted-foreground italic text-center py-8">
                    Rédigez pour voir l'aperçu...
                  </p>
                )}

                {imageUrls.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {imageUrls.map((url, idx) => (
                      <div key={idx} className="overflow-hidden rounded-lg border bg-muted/10">
                        <img 
                          src={`/api/files/${url}`} 
                          alt="" 
                          className="w-full object-cover max-h-[160px]" 
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Desktop Card Preview */
          <div className="sticky top-24 animate-in zoom-in-95 duration-200">
            <Card className="relative overflow-hidden border border-primary/20 bg-primary/5/10 shadow-lg shadow-primary/5">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
              
              <CardContent className="p-5 space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between text-xs text-muted-foreground border-b border-border/40 pb-3">
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block size-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Aujourd'hui
                  </span>
                  <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary text-[10px] tracking-wider font-extrabold uppercase py-0.5 px-2">
                    Nouveau signal
                  </Badge>
                </div>
                
                {/* Content body */}
                {content.trim() ? (
                  <div 
                    className="text-sm font-medium text-foreground whitespace-pre-wrap leading-relaxed space-y-2 break-words"
                    dangerouslySetInnerHTML={{ __html: parseSimpleMarkdown(content) }}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    Commencez à rédiger pour voir l'aperçu du signal...
                  </p>
                )}
                
                {/* Attached Graphics Carousel/List */}
                {imageUrls.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    {imageUrls.map((url, idx) => (
                      <div key={idx} className="relative overflow-hidden rounded-xl border border-border bg-background/50 aspect-video">
                        <img 
                          src={`/api/files/${url}`} 
                          alt="" 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Plans target tags */}
                {selectedPlans.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {selectedPlans.map((id) => {
                      const plan = plans.find((p) => p.id === id)
                      return plan ? (
                        <Badge key={id} variant="secondary" className="text-[10px] px-1.5 py-0">
                          {plan.name}
                        </Badge>
                      ) : null
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Confirmation Modal overlay */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-background border rounded-2xl max-w-md w-full shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-semibold text-lg">Confirmation d'envoi</h3>
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            {isEstimating ? (
              <div className="flex flex-col items-center justify-center py-6 gap-3">
                <Loader2 className="size-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Estimation des destinataires...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Ce signal sera envoyé aux membres des groupes de diffusion sélectionnés.
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

                {isScheduling && scheduleDate && scheduleTime && (
                  <div className="text-xs text-amber-500 bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg flex items-center gap-2">
                    <Calendar className="size-4 animate-pulse" />
                    <span>Planifié pour le : <strong>{new Date(`${scheduleDate}T${scheduleTime}`).toLocaleString("fr-FR")}</strong></span>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 border-t pt-4">
              <Button variant="outline" onClick={() => setShowConfirmModal(false)}>
                Annuler
              </Button>
              <Button 
                onClick={handleConfirmSubmit} 
                disabled={isSubmitting !== null}
                className="gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Envoi...
                  </>
                ) : (
                  <>
                    <Send className="size-4" />
                    Confirmer et {isScheduling ? "planifier" : "publier"}
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
