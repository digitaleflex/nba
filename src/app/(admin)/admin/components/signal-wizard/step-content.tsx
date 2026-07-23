"use client"

import { useRef, useEffect, useState } from "react"
import { Bold, Italic, List, Image as ImageIcon, X, Plus } from "lucide-react"
import { Button, Card, CardContent, cn } from "@nba/design-system"
import { MarkdownMessage } from "@nba/lib/markdown"

interface StepContentProps {
  content: string
  setContent: (v: string) => void
  imageUrls: string[]
  setImageUrls: (v: string[]) => void
  isUploading: boolean
  onUpload: (file: File) => void
  onFileInput: (files: FileList | null) => void
}

export function StepContent({
  content,
  setContent,
  imageUrls,
  setImageUrls,
  isUploading,
  onUpload,
  onFileInput,
}: StepContentProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = "auto"
      textarea.style.height = `${textarea.scrollHeight}px`
    }
  }, [content])

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

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"))
    files.forEach((f) => onUpload(f))
  }

  async function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const items = Array.from(e.clipboardData.items).filter((i) => i.type.startsWith("image/"))
    if (items.length === 0) return
    e.preventDefault()
    items.forEach((item) => {
      const file = item.getAsFile()
      if (file) onUpload(file)
    })
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Message du signal</label>
        <div className="border rounded-xl bg-background overflow-hidden">
          <div className="flex items-center gap-1.5 p-2 bg-muted/40 border-b">
            <Button type="button" variant="ghost" size="sm" className="size-9 p-0 rounded-lg hover:bg-muted text-muted-foreground" onClick={() => insertFormat("**", "**")} title="Gras" aria-label="Gras"><Bold className="size-4" /></Button>
            <Button type="button" variant="ghost" size="sm" className="size-9 p-0 rounded-lg hover:bg-muted text-muted-foreground" onClick={() => insertFormat("*", "*")} title="Italique" aria-label="Italique"><Italic className="size-4" /></Button>
            <Button type="button" variant="ghost" size="sm" className="size-9 p-0 rounded-lg hover:bg-muted text-muted-foreground" onClick={() => insertFormat("- ")} title="Liste" aria-label="Liste"><List className="size-4" /></Button>
            <span className="w-px h-4 bg-border" />
            <Button type="button" variant="ghost" size="sm" className="size-9 p-0 rounded-lg hover:bg-muted text-muted-foreground" onClick={() => fileInputRef.current?.click()} title="Joindre des images" aria-label="Joindre des images"><ImageIcon className="size-4" /></Button>
          </div>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onPaste={handlePaste}
            placeholder="Collez ou rédigez votre signal ici... (ex: BUY EUR/USD, Entry, TP, SL, analyses...)"
            className="w-full min-h-[180px] max-h-[400px] p-3 text-xs leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 border-0 resize-none bg-transparent"
          />
          <div className="px-3 py-1 bg-muted/20 text-[9px] text-right text-muted-foreground border-t">
            {content.length} caractères
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Images et captures d'écran</label>
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={(e) => onFileInput(e.target.files)} />
        <div className="flex flex-wrap gap-2.5 items-center">
          {imageUrls.map((url, idx) => (
            <div key={idx} className="relative group size-16 rounded-xl overflow-hidden border bg-muted shrink-0">
              <img src={`/api/files/${url}`} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => setImageUrls(imageUrls.filter((_, i) => i !== idx))}
                className="absolute top-1 right-1 size-4 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black transition-colors"
                aria-label="Supprimer l'image"
              >
                <X className="size-2.5" />
              </button>
            </div>
          ))}
          {imageUrls.length < 5 && (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInputRef.current?.click() } }}
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
              Glissez vos captures ici (max: 5, PNG, JPG, WEBP).
            </span>
          )}
        </div>
      </div>

      {/* Live inbox preview */}
      <Card className="relative overflow-hidden border border-primary/20 bg-primary/5">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between border-b pb-2 border-border/50 text-[9px] text-muted-foreground">
            <span className="flex items-center gap-1 font-bold">
              <span className="size-1 rounded-full bg-emerald-500 animate-pulse" />
              NBA VIP
            </span>
            <span>Aujourd'hui</span>
          </div>
          <div className="text-xs text-foreground leading-relaxed whitespace-pre-wrap break-words min-h-[40px]">
            <MarkdownMessage content={content.trim() || "Votre message formaté s'affichera ici..."} />
          </div>
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
  )
}
