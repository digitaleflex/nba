"use client"

import { useRef, useState, useEffect } from "react"
import { Button } from "@nba/design-system"
import {
  Bold,
  Italic,
  List,
  Link2,
  Video,
  X,
  Loader2,
  Send,
} from "lucide-react"

export interface SendPayload {
  type: "TEXT" | "VIDEO"
  content: string
  attachment: { url: string; mime: string; name?: string; size?: number } | null
}

interface MessageComposerProps {
  uploadUrl: string
  onSend: (payload: SendPayload) => void
  onTypingChange?: (typing: boolean) => void
  disabled?: boolean
  placeholder?: string
}

export function MessageComposer({
  uploadUrl,
  onSend,
  onTypingChange,
  disabled,
  placeholder = "Écrivez un message...",
}: MessageComposerProps) {
  const [text, setText] = useState("")
  const [uploading, setUploading] = useState(false)
  const [pendingVideo, setPendingVideo] = useState<SendPayload["attachment"]>(null)
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (typingTimer.current) clearTimeout(typingTimer.current)
    }
  }, [])

  const canSend = !disabled && !uploading && (text.trim().length > 0 || !!pendingVideo)

  function wrapSelection(el: HTMLTextAreaElement | null, before: string, after: string, placeholderText = "texte") {
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const selected = text.slice(start, end) || placeholderText
    const next = text.slice(0, start) + before + selected + after + text.slice(end)
    setText(next)
    requestAnimationFrame(() => {
      el.focus()
      el.selectionStart = start + before.length
      el.selectionEnd = start + before.length + selected.length
    })
  }

  function prefixLines(el: HTMLTextAreaElement | null, prefix: string) {
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const block = text.slice(start, end) || text
    const transformed = block
      .split("\n")
      .map((l) => (l.startsWith(prefix) ? l : prefix + l))
      .join("\n")
    const next = text.slice(0, start) + transformed + text.slice(end)
    setText(next)
    requestAnimationFrame(() => el.focus())
  }

  function insertLink(el: HTMLTextAreaElement | null) {
    const url = window.prompt("URL du lien (https://...)")
    if (!url) return
    const start = el?.selectionStart ?? text.length
    const end = el?.selectionEnd ?? text.length
    const label = text.slice(start, end) || "lien"
    const snippet = `[${label}](${url})`
    setText(text.slice(0, start) + snippet + text.slice(end))
  }

  function notifyTyping() {
    if (!onTypingChange) return
    onTypingChange(true)
    if (typingTimer.current) clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(() => onTypingChange?.(false), 700)
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    setError(null)
    setUploading(true)
    try {
      const form = new FormData()
      form.append("file", file)
      const res = await fetch(uploadUrl, { method: "POST", body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Échec de l'envoi de la vidéo")
      setPendingVideo({ url: data.path, mime: data.mimeType, name: data.name, size: data.size })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur")
    } finally {
      setUploading(false)
    }
  }

  function doSend() {
    if (!canSend) return
    onSend({
      type: pendingVideo ? "VIDEO" : "TEXT",
      content: text,
      attachment: pendingVideo,
    })
    setText("")
    setPendingVideo(null)
    setError(null)
  }

  return (
    <div className="border-t border-border/60 p-3">
      {error && <p className="text-xs text-destructive mb-2">{error}</p>}

      {pendingVideo && (
        <div className="mb-2 flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-2">
          <Video className="size-5 text-primary shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium truncate">{pendingVideo.name || "Vidéo"}</p>
            <p className="text-[10px] text-muted-foreground">Vidéo prête à envoyer</p>
          </div>
          <button
            type="button"
            onClick={() => setPendingVideo(null)}
            className="text-muted-foreground hover:text-destructive transition-colors"
            aria-label="Retirer la vidéo"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      <div className="flex items-center gap-1 mb-2">
        <button
          type="button"
          onClick={() => wrapSelection(textareaRef.current, "**", "**", "gras")}
          disabled={!!pendingVideo}
          title="Gras"
          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-40"
        >
          <Bold className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => wrapSelection(textareaRef.current, "*", "*", "italique")}
          disabled={!!pendingVideo}
          title="Italique"
          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-40"
        >
          <Italic className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => prefixLines(textareaRef.current, "- ")}
          disabled={!!pendingVideo}
          title="Liste"
          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-40"
        >
          <List className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => insertLink(textareaRef.current)}
          disabled={!!pendingVideo}
          title="Lien"
          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-40"
        >
          <Link2 className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading || !!pendingVideo}
          title="Joindre une vidéo"
          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-40"
        >
          {uploading ? <Loader2 className="size-4 animate-spin" /> : <Video className="size-4" />}
        </button>
        <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={handleFile} />
      </div>

      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            notifyTyping()
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              doSend()
            }
          }}
          rows={1}
          placeholder={pendingVideo ? "Ajouter une légende (optionnel)..." : placeholder}
          disabled={disabled}
          className="flex-1 resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50 max-h-32"
        />
        <Button size="icon" onClick={doSend} disabled={!canSend}>
          {uploading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        </Button>
      </div>
    </div>
  )
}
