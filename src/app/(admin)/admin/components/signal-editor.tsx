"use client"

import { useEffect, useRef, useState } from "react"
import { Bold, Italic, List, Image as ImageIcon, Trash2, Send, Loader2, Sparkles } from "lucide-react"
import { Button, Card, CardContent, Checkbox, Badge, cn } from "@nba/design-system"
import { parseSimpleMarkdown } from "@nba/lib/utils"

interface Plan {
  id: string
  name: string
}

export function SignalEditor({ onSignalCreated }: { onSignalCreated?: () => void }) {
  const [content, setContent] = useState("")
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [selectedPlans, setSelectedPlans] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState<"DRAFT" | "PUBLISHED" | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch plans (diffusion groups)
  useEffect(() => {
    fetch("/api/public/plans")
      .then((r) => r.json())
      .then(setPlans)
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
      setImageUrl(data.path)
    } catch (err) {
      console.error(err)
      alert("Erreur lors du téléchargement de l'image")
    } finally {
      setIsUploading(false)
    }
  }

  // Handle file input change
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleImageUpload(file)
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
    const image = files.find((f) => f.type.startsWith("image/"))
    if (image) await handleImageUpload(image)
  }

  // Handle Paste (Screenshot)
  async function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const items = Array.from(e.clipboardData.items)
    const imageItem = items.find((item) => item.type.startsWith("image/"))
    if (imageItem) {
      const file = imageItem.getAsFile()
      if (file) {
        e.preventDefault()
        await handleImageUpload(file)
      }
    }
  }

  // Keyboard shortcut Ctrl+Enter to publish
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSubmit("PUBLISHED")
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

  // Submit Signal
  async function handleSubmit(status: "DRAFT" | "PUBLISHED") {
    if (!content.trim()) return
    if (selectedPlans.length === 0) {
      alert("Veuillez sélectionner au moins un groupe de diffusion.")
      return
    }

    setIsSubmitting(status)
    try {
      const res = await fetch("/api/admin/signals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          imageUrl,
          planIds: selectedPlans,
          status,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Submission failed")
      }

      // Success: Reset form
      setContent("")
      setImageUrl(null)
      setSelectedPlans([])
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
            Écrivez en texte libre, collez des graphiques et publiez en moins de 20 secondes.
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
              className="w-full min-h-[160px] max-h-[400px] resize-none bg-transparent text-sm leading-relaxed outline-none"
              disabled={isSubmitting !== null}
            />

            {/* Attached Image Preview */}
            {isUploading && (
              <div className="flex items-center gap-2 rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground animate-pulse">
                <Loader2 className="size-4 animate-spin text-primary" />
                <span>Téléchargement de la capture d'écran...</span>
              </div>
            )}

            {imageUrl && !isUploading && (
              <div className="relative group overflow-hidden rounded-lg border max-w-full">
                <img
                  src={`/api/files/${imageUrl}`}
                  alt="Pièce jointe du signal"
                  className="max-h-[180px] w-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => setImageUrl(null)}
                  >
                    <Trash2 className="size-3.5" />
                    Supprimer l'image
                  </Button>
                </div>
              </div>
            )}
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

        {/* Publish Actions */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <span className="text-xs text-muted-foreground hidden sm:inline-flex items-center gap-1.5">
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground shadow-sm">
              Ctrl+Entrée
            </kbd>
            pour publier
          </span>

          <div className="flex gap-3 ml-auto">
            <Button
              variant="outline"
              disabled={isSubmitting !== null || !content.trim()}
              onClick={() => handleSubmit("DRAFT")}
            >
              {isSubmitting === "DRAFT" ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-1.5" />
                  Sauvegarde...
                </>
              ) : (
                "Sauvegarder brouillon"
              )}
            </Button>
            <Button
              disabled={isSubmitting !== null || !content.trim()}
              onClick={() => handleSubmit("PUBLISHED")}
              className="gap-1.5"
            >
              {isSubmitting === "PUBLISHED" ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-1.5" />
                  Publication...
                </>
              ) : (
                <>
                  <Send className="size-4" />
                  Publier maintenant
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Live Preview Panel */}
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold tracking-tight flex items-center gap-1.5">
            <Sparkles className="size-4 text-primary" />
            Aperçu en direct
          </h2>
          <p className="text-sm text-muted-foreground">
            Voici exactement ce que verront les membres sur leur tableau de bord.
          </p>
        </div>

        <div className="sticky top-24">
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
                  className="text-sm font-medium text-foreground whitespace-pre-wrap leading-relaxed space-y-2"
                  dangerouslySetInnerHTML={{ __html: parseSimpleMarkdown(content) }}
                />
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Commencez à rédiger pour voir l'aperçu du signal...
                </p>
              )}
              
              {/* Attached Graphic */}
              {imageUrl && (
                <div className="relative overflow-hidden rounded-xl border border-border bg-background/50">
                  <img 
                    src={`/api/files/${imageUrl}`} 
                    alt="Graphique du signal" 
                    className="w-full max-h-[320px] object-cover" 
                  />
                </div>
              )}

              {/* Plans target tag */}
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
      </div>
    </div>
  )
}
