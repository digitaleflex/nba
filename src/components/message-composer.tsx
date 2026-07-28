"use client"

import { useRef, useState, useEffect } from "react"
import { Button } from "@nba/design-system"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@nba/design-system"
import { EmojiPicker } from "@nba/components/emoji-picker"
import {
  Bold,
  Italic,
  List,
  Link2,
  Paperclip,
  X,
  Loader2,
  Send,
  Quote,
  Smile,
} from "lucide-react"

export interface AttachmentPayload {
  url: string
  mime: string
  name?: string
  size?: number
}

export interface SendPayload {
  type: "TEXT" | "VIDEO" | "IMAGE"
  content: string
  attachment: AttachmentPayload | null
  quotedMessageId?: string | null
}

export interface QuotedRef {
  id: string
  senderName: string
  preview: string
}

interface MessageComposerProps {
  uploadUrl: string
  onSend: (payload: SendPayload) => void
  onTypingChange?: (typing: boolean) => void
  disabled?: boolean
  placeholder?: string
  quotedMessage?: QuotedRef | null
  onClearQuote?: () => void
}

export function MessageComposer({
  uploadUrl,
  onSend,
  onTypingChange,
  disabled,
  placeholder = "Écrivez un message...",
  quotedMessage,
  onClearQuote,
}: MessageComposerProps) {
  const [text, setText] = useState("")
  const [uploading, setUploading] = useState(false)
  const [pending, setPending] = useState<AttachmentPayload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [emojiOpen, setEmojiOpen] = useState(false)
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (typingTimer.current) clearTimeout(typingTimer.current)
    }
  }, [])

  const canSend = !disabled && !uploading && (text.trim().length > 0 || !!pending)

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
    setLinkUrl("")
    setLinkDialogOpen(true)
  }

  function confirmInsertLink() {
    if (!linkUrl.trim()) return
    const el = textareaRef.current
    const start = el?.selectionStart ?? text.length
    const end = el?.selectionEnd ?? text.length
    const label = text.slice(start, end) || "lien"
    const snippet = `[${label}](${linkUrl.trim()})`
    setText(text.slice(0, start) + snippet + text.slice(end))
    setLinkDialogOpen(false)
    setLinkUrl("")
  }

  function notifyTyping() {
    if (!onTypingChange) return
    onTypingChange(true)
    if (typingTimer.current) clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(() => onTypingChange?.(false), 700)
  }

  function insertEmoji(emoji: string) {
    const el = textareaRef.current
    if (!el) {
      setText((t) => t + emoji)
      return
    }
    const start = el.selectionStart
    const end = el.selectionEnd
    const next = text.slice(0, start) + emoji + text.slice(end)
    setText(next)
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(start + emoji.length, start + emoji.length)
    })
  }

  const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/webm", "video/quicktime"]

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setError("Format non supporté. Utilisez JPEG, PNG, WebP, GIF, MP4 ou WebM.")
      return
    }
    setError(null)
    setUploading(true)
    try {
      const form = new FormData()
      form.append("file", file)
      const res = await fetch(uploadUrl, { method: "POST", body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Échec de l'envoi de la pièce jointe")
      setPending({ url: data.path, mime: data.mimeType, name: data.name, size: data.size })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur")
    } finally {
      setUploading(false)
    }
  }

  function doSend() {
    if (!canSend) return
    const type: SendPayload["type"] = pending
      ? pending.mime.startsWith("video/")
        ? "VIDEO"
        : "IMAGE"
      : "TEXT"
    onSend({
      type,
      content: text,
      attachment: pending,
      quotedMessageId: quotedMessage?.id ?? null,
    })
    setText("")
    setPending(null)
    setError(null)
    onClearQuote?.()
  }

  const isImage = pending?.mime.startsWith("image/")

  return (
    <div className="border-t border-border/60 p-3">
      {error && <p role="alert" className="text-xs text-destructive mb-2">{error}</p>}

      {quotedMessage && (
        <div className="mb-2 flex items-center gap-2 rounded-xl border-l-2 border-primary bg-muted/40 px-3 py-2">
          <Quote className="size-4 text-primary shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-primary">{quotedMessage.senderName}</p>
            <p className="text-xs text-muted-foreground truncate">{quotedMessage.preview}</p>
          </div>
          <button
            type="button"
            onClick={onClearQuote}
            className="text-muted-foreground hover:text-destructive transition-colors"
            aria-label="Retirer la citation"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {pending && (
        <div className="mb-2 flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-2">
          {isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={pending.url} alt={pending.name || "image"} className="size-12 rounded-lg object-cover shrink-0" />
          ) : (
            <Paperclip className="size-5 text-primary shrink-0" />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium truncate">{pending.name || (isImage ? "Image" : "Vidéo")}</p>
            <p className="text-[10px] text-muted-foreground">Prêt à envoyer</p>
          </div>
          <button
            type="button"
            onClick={() => setPending(null)}
            className="text-muted-foreground hover:text-destructive transition-colors"
            aria-label="Retirer la pièce jointe"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      <div className="relative flex items-center gap-1 mb-2">
        <button
          type="button"
          onClick={() => wrapSelection(textareaRef.current, "**", "**", "gras")}
          disabled={!!pending}
          title="Gras"
          className="flex size-10 md:size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-40"
          aria-label="Gras"
        >
          <Bold className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => wrapSelection(textareaRef.current, "*", "*", "italique")}
          disabled={!!pending}
          aria-label="Italique"
          className="flex size-10 md:size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-40"
        >
          <Italic className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => prefixLines(textareaRef.current, "- ")}
          disabled={!!pending}
          aria-label="Liste"
          className="flex size-10 md:size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-40"
        >
          <List className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => insertLink(textareaRef.current)}
          disabled={!!pending}
          title="Lien"
          className="flex size-10 md:size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-40"
        >
          <Link2 className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading || !!pending}
          title="Joindre une image ou vidéo"
          className="flex size-10 md:size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-40"
        >
          {uploading ? <Loader2 className="size-4 animate-spin" /> : <Paperclip className="size-4" />}
        </button>
        <button
          type="button"
          onClick={() => setEmojiOpen((v) => !v)}
          title="Emojis"
          className={`flex size-10 md:size-8 items-center justify-center rounded-lg transition-colors disabled:opacity-40 ${
            emojiOpen ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <Smile className="size-4" />
        </button>
        {emojiOpen && (
          <EmojiPicker
            onSelect={(e) => {
              insertEmoji(e)
              setEmojiOpen(false)
            }}
            onClose={() => setEmojiOpen(false)}
          />
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={handleFile}
        />
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
          placeholder={pending ? "Ajouter une légende (optionnel)..." : placeholder}
          disabled={disabled}
          className="flex-1 resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50 max-h-32"
        />
        <Button size="icon" onClick={doSend} disabled={!canSend} aria-label="Envoyer le message">
          {uploading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        </Button>
      </div>

      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insérer un lien</DialogTitle>
          </DialogHeader>
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://..."
            autoFocus
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); confirmInsertLink() } }}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50"
          />
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setLinkDialogOpen(false)}>
              Annuler
            </Button>
            <Button size="sm" onClick={confirmInsertLink} disabled={!linkUrl.trim()}>
              Insérer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
