"use client"

import { useState, useRef, useEffect } from "react"
import { MarkdownMessage, plainPreview } from "@nba/lib/markdown"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@nba/design-system"
import {
  Check,
  CheckCheck,
  Smile,
  Quote,
  Pencil,
  Trash2,
  Flag,
  X,
  Loader2,
} from "lucide-react"

export interface Reaction {
  userId: string
  emoji: string
}

export interface QuotedRef {
  id: string
  senderName: string
  content: string
  type: string
  attachmentMime?: string | null
}

export interface ChatMessageData {
  id: string
  conversationId: string
  senderId: string
  senderName: string
  type: string
  content: string
  attachmentUrl?: string | null
  attachmentMime?: string | null
  attachmentName?: string | null
  attachmentSize?: number | null
  readAt: string | null
  editedAt: string | null
  deletedAt: string | null
  quotedMessageId?: string | null
  quoted?: QuotedRef | null
  reactions: Reaction[]
  createdAt: string
}

const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🎉"]

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
}

interface ChatMessageProps {
  message: ChatMessageData
  myId: string
  isMine: boolean
  canModerate?: boolean
  onQuote: (m: ChatMessageData) => void
  onReact: (messageId: string, emoji: string | null) => void
  onEdit: (messageId: string, content: string) => Promise<void>
  onDelete: (messageId: string, forEveryone: boolean) => Promise<void>
  onReport?: (messageId: string, reason: string) => void
  onScrollTo: (messageId: string) => void
}

export function ChatMessage({
  message,
  myId,
  isMine,
  canModerate = false,
  onQuote,
  onReact,
  onEdit,
  onDelete,
  onReport,
  onScrollTo,
}: ChatMessageProps) {
  const [showEmoji, setShowEmoji] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(message.content)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [reporting, setReporting] = useState(false)
  const [reportReason, setReportReason] = useState("")
  const emojiRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) setShowEmoji(false)
    }
    document.addEventListener("mousedown", onDocClick)
    return () => document.removeEventListener("mousedown", onDocClick)
  }, [])

  if (message.deletedAt) {
    return (
      <div className="flex justify-center my-1">
        <p className="text-xs italic text-muted-foreground">Message supprimé</p>
      </div>
    )
  }

  const myReaction = message.reactions.find((r) => r.userId === myId)?.emoji ?? null
  const grouped = message.reactions.reduce<Record<string, number>>((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] ?? 0) + 1
    return acc
  }, {})

  function toggleEmoji(emoji: string) {
    onReact(message.id, myReaction === emoji ? null : emoji)
    setShowEmoji(false)
  }

  async function saveEdit() {
    if (!editText.trim() || saving) return
    setSaving(true)
    await onEdit(message.id, editText.trim())
    setSaving(false)
    setEditing(false)
  }

  return (
    <div id={`msg-${message.id}`} className="group relative">
      {message.quoted && (
        <button
          onClick={() => onScrollTo(message.quoted!.id)}
          className="mb-1 ml-auto max-w-[75%] flex items-center gap-2 rounded-lg border-l-2 border-primary/60 bg-muted/40 px-2 py-1 text-left hover:bg-muted/70 transition-colors"
          style={isMine ? { marginLeft: "auto" } : { marginRight: "auto" }}
        >
          <Quote className="size-3 text-primary shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] font-medium text-primary">{message.quoted.senderName}</p>
            <p className="text-[11px] text-muted-foreground truncate">
              {message.quoted.attachmentMime?.startsWith("image/")
                ? "🖼️ Image"
                : message.quoted.attachmentMime?.startsWith("video/")
                  ? "🎥 Vidéo"
                  : plainPreview(message.quoted.content)}
            </p>
          </div>
        </button>
      )}

      <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
        <div
          className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
            isMine ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted rounded-bl-sm"
          }`}
        >
          {editing ? (
            <div className="space-y-2">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={2}
                autoFocus
                className="w-full resize-none rounded-lg border border-border bg-background px-2 py-1 text-sm text-foreground outline-none focus:border-primary/50"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setEditing(false)
                    setEditText(message.content)
                  }}
                  className="text-[11px] text-muted-foreground hover:text-foreground"
                >
                  Annuler
                </button>
                <button
                  onClick={saveEdit}
                  disabled={saving || !editText.trim()}
                  className="text-[11px] font-medium text-primary hover:underline disabled:opacity-40"
                >
                  {saving ? "…" : "Enregistrer"}
                </button>
              </div>
            </div>
          ) : (
            <>
              {message.type === "VIDEO" && message.attachmentUrl ? (
                <video
                  src={`/api/files/${message.attachmentUrl}`}
                  controls
                  className="max-w-[260px] rounded-lg mb-1 bg-black/20"
                />
              ) : null}
              {message.type === "IMAGE" && message.attachmentUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/api/files/${message.attachmentUrl}`}
                  alt={message.attachmentName || "image"}
                  className="max-w-[260px] rounded-lg mb-1 cursor-pointer"
                  onClick={() => window.open(`/api/files/${message.attachmentUrl}`, "_blank")}
                />
              ) : null}
              {message.content.trim().length > 0 && (
                <div className={message.type !== "TEXT" ? "mt-1" : ""}>
                  <MarkdownMessage content={message.content} />
                </div>
              )}
              <p
                className={`text-[10px] mt-1 flex items-center gap-1 ${
                  isMine ? "text-primary-foreground/70" : "text-muted-foreground"
                }`}
              >
                {formatTime(message.createdAt)}
                {message.editedAt && <span className="opacity-70">(modifié)</span>}
                {isMine &&
                  (message.readAt ? (
                    <span className="flex items-center gap-0.5">
                      <CheckCheck className="size-3" />
                      Vu à {formatTime(message.readAt)}
                    </span>
                  ) : (
                    <Check className="size-3" />
                  ))}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Réactions */}
      {Object.keys(grouped).length > 0 && (
        <div className={`flex flex-wrap gap-1 mt-1 ${isMine ? "justify-end" : "justify-start"}`}>
          {Object.entries(grouped).map(([emoji, count]) => {
            const mine = message.reactions.some((r) => r.userId === myId && r.emoji === emoji)
            return (
              <button
                key={emoji}
                onClick={() => toggleEmoji(emoji)}
                className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] transition-colors ${
                  mine ? "border-primary bg-primary/15" : "border-border bg-muted/40 hover:bg-muted"
                }`}
              >
                <span>{emoji}</span>
                <span className="text-muted-foreground">{count}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* Barre d'actions au survol (desktop) / au tap (mobile) */}
      {!editing && (
        <div
          className={`absolute top-0 ${
            isMine ? "left-0 -translate-x-full pl-1" : "right-0 translate-x-full pr-1"
          } opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center gap-0.5`}
        >
          <div className="relative" ref={emojiRef}>
            <button
              onClick={() => setShowEmoji((s) => !s)}
              title="Réagir"
              className="flex size-7 items-center justify-center rounded-full border border-border bg-background text-muted-foreground hover:text-foreground"
            >
              <Smile className="size-3.5" />
            </button>
            {showEmoji && (
              <div className="absolute bottom-8 z-10 flex gap-1 rounded-full border border-border bg-background p-1 shadow-md">
                {QUICK_EMOJIS.map((e) => (
                  <button
                    key={e}
                    onClick={() => toggleEmoji(e)}
                    className="size-7 rounded-full text-base hover:bg-muted transition-colors"
                  >
                    {e}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => onQuote(message)}
            title="Citer"
            className="flex size-7 items-center justify-center rounded-full border border-border bg-background text-muted-foreground hover:text-foreground"
          >
            <Quote className="size-3.5" />
          </button>
          {onReport && (
            <button
              onClick={() => setReporting(true)}
              title="Signaler"
              className="flex size-7 items-center justify-center rounded-full border border-border bg-background text-muted-foreground hover:text-destructive"
            >
              <Flag className="size-3.5" />
            </button>
          )}
          {isMine && (
            <button
              onClick={() => {
                setEditText(message.content)
                setEditing(true)
              }}
              title="Modifier"
              className="flex size-7 items-center justify-center rounded-full border border-border bg-background text-muted-foreground hover:text-foreground"
            >
              <Pencil className="size-3.5" />
            </button>
          )}
          <button
            onClick={() => setConfirmDelete(true)}
            title="Supprimer"
            className="flex size-7 items-center justify-center rounded-full border border-border bg-background text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      )}

      {/* Confirmation suppression */}
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="size-4 text-destructive" />
              Supprimer le message ?
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => {
                setConfirmDelete(false)
                onDelete(message.id, false)
              }}
              className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted transition-colors"
            >
              Me le masquer
            </button>
            {(isMine || canModerate) && (
              <button
                onClick={() => {
                  setConfirmDelete(false)
                  onDelete(message.id, true)
                }}
                className="rounded-lg bg-destructive px-3 py-2 text-sm text-destructive-foreground hover:opacity-90 transition-opacity"
              >
                Supprimer pour tout le monde
              </button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Signalement */}
      <Dialog open={reporting} onOpenChange={setReporting}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flag className="size-4 text-destructive" />
              Signaler ce message
            </DialogTitle>
          </DialogHeader>
          <textarea
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            rows={3}
            placeholder="Motif du signalement..."
            className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50"
          />
          <div className="mt-3 flex justify-end gap-2">
            <button
              onClick={() => setReporting(false)}
              className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted transition-colors"
            >
              Annuler
            </button>
            <button
              disabled={reportReason.trim().length < 3}
              onClick={() => {
                setReporting(false)
                onReport?.(message.id, reportReason.trim())
                setReportReason("")
              }}
              className="rounded-lg bg-destructive px-3 py-2 text-sm text-destructive-foreground hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              Envoyer
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function ChatMessageSkeleton() {
  return (
    <div className="flex justify-center py-2">
      <Loader2 className="size-4 animate-spin text-muted-foreground" />
    </div>
  )
}
