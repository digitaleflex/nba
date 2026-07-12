"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useSocket } from "@nba/lib/hooks/use-socket"
import { authClient } from "@nba/lib/auth-client"
import { MarkdownMessage, plainPreview } from "@nba/lib/markdown"
import { MessageComposer, type SendPayload } from "@nba/components/message-composer"
import { Card, CardContent, Input, Button, Avatar, AvatarFallback, Badge, Dialog, DialogContent, DialogHeader, DialogTitle } from "@nba/design-system"
import { MessageSquare, Loader2, Search, Plus, X, Circle, Check, CheckCheck, Send } from "lucide-react"

interface Other {
  id: string
  name: string
  email: string
}

interface Conversation {
  id: string
  other: Other | null
  lastMessage: { id: string; type: string; content: string; senderId: string; createdAt: string } | null
  unreadCount: number
  updatedAt: string
}

interface Message {
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
  createdAt: string
}

interface Member {
  id: string
  name: string
  email: string
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
}
function formatDay(iso: string) {
  const d = new Date(iso)
  const today = new Date()
  if (d.toDateString() === today.toDateString()) return "Aujourd'hui"
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })
}
function initials(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()
}

type ScrollIntent = "none" | "bottom" | "keep"

export default function AdminMessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [query, setQuery] = useState("")
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [members, setMembers] = useState<Member[]>([])
  const [searching, setSearching] = useState(false)
  const [newText, setNewText] = useState("")
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [peerTyping, setPeerTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const peerTypingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const scrollIntentRef = useRef<ScrollIntent>("none")
  const prevScrollRef = useRef<{ top: number; height: number }>({ top: 0, height: 0 })
  const loadingOlderRef = useRef(false)
  const { data: sessionData } = authClient.useSession()
  const myId = sessionData?.user?.id ?? ""

  const { subscribe, emit, status } = useSocket({
    onConnect: () => {
      loadConversations()
      if (selectedIdRef.current) openConversation(selectedIdRef.current)
    },
  })

  const selectedIdRef = useRef<string | null>(null)
  const selectedOtherRef = useRef<Other | null>(null)
  useEffect(() => {
    selectedIdRef.current = selectedId
    selectedOtherRef.current = conversations.find((c) => c.id === selectedId)?.other ?? null
  }, [selectedId, conversations])

  const filteredConversations = conversations.filter((c) => {
    if (unreadOnly && c.unreadCount === 0) return false
    if (!query.trim()) return true
    const q = query.trim().toLowerCase()
    return (
      c.other?.name?.toLowerCase().includes(q) || c.other?.email?.toLowerCase().includes(q)
    )
  })

  const loadConversations = useCallback(async () => {
    const res = await fetch("/api/admin/messages")
    if (res.ok) {
      const data = await res.json()
      setConversations(data.conversations)
    }
  }, [])

  const openConversation = useCallback(async (id: string) => {
    setSelectedId(id)
    setPeerTyping(false)
    setMessages([])
    const res = await fetch(`/api/admin/messages/${id}`)
    if (res.ok) {
      const data = await res.json()
      setMessages(data.messages)
      setHasMore(data.hasMore)
      scrollIntentRef.current = "bottom"
      setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c)))
    }
  }, [])

  const loadOlder = useCallback(async () => {
    const id = selectedIdRef.current
    if (!id || loadingOlderRef.current || !hasMore) return
    const el = scrollRef.current
    if (!el || messages.length === 0) return
    const oldest = messages[0]
    loadingOlderRef.current = true
    setLoadingOlder(true)
    prevScrollRef.current = { top: el.scrollTop, height: el.scrollHeight }
    scrollIntentRef.current = "keep"
    const res = await fetch(`/api/admin/messages/${id}?before=${encodeURIComponent(oldest.createdAt)}`)
    if (res.ok) {
      const data = await res.json()
      setMessages((prev) => [...data.messages, ...prev])
      setHasMore(data.hasMore)
    }
    loadingOlderRef.current = false
    setLoadingOlder(false)
  }, [hasMore, messages])

  const appendMessage = useCallback((msg: Message) => {
    const el = scrollRef.current
    const nearBottom = !!el && el.scrollHeight - el.scrollTop - el.clientHeight < 120
    setMessages((prev) => {
      if (prev.some((m) => m.id === msg.id)) return prev
      return [...prev, msg]
    })
    scrollIntentRef.current = nearBottom ? "bottom" : "none"
  }, [])

  const handleSend = useCallback(
    async (payload: SendPayload) => {
      if (!selectedId || sending) return
      const { type, content, attachment } = payload
      const tempId = `temp-${Date.now()}`
      const optimistic: Message = {
        id: tempId,
        conversationId: selectedId,
        senderId: myId,
        senderName: "Vous",
        type,
        content,
        attachmentUrl: attachment?.url ?? null,
        attachmentMime: attachment?.mime ?? null,
        attachmentName: attachment?.name ?? null,
        attachmentSize: attachment?.size ?? null,
        readAt: null,
        createdAt: new Date().toISOString(),
      }
      appendMessage(optimistic)
      scrollIntentRef.current = "bottom"
      if (selectedOtherRef.current) {
        emit("typing", { to: selectedOtherRef.current.id, conversationId: selectedId, typing: false })
      }
      setSending(true)
      const res = await fetch(`/api/admin/messages/${selectedId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, content, attachment: attachment ?? undefined }),
      })
      setSending(false)
      if (res.ok) {
        const data = await res.json()
        setMessages((prev) => prev.map((m) => (m.id === tempId ? data.message : m)))
        loadConversations()
      } else {
        setMessages((prev) => prev.filter((m) => m.id !== tempId))
      }
    },
    // eslint-disable-next-line react-hooks/preserve-manual-memoization
    [selectedId, sending, myId, emit, appendMessage, loadConversations],
  )

  const handleTyping = useCallback(
    (typing: boolean) => {
      const other = selectedOtherRef.current
      const convId = selectedIdRef.current
      if (other) emit("typing", { to: other.id, conversationId: convId, typing })
    },
    [emit],
  )

  const startConversation = useCallback(
    async (memberId: string) => {
      if (!newText.trim()) return
      const res = await fetch("/api/admin/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, content: newText.trim() }),
      })
      if (res.ok) {
        const data = await res.json()
        setPickerOpen(false)
        setNewText("")
        setSearch("")
        setMembers([])
        setSelectedMember(null)
        await loadConversations()
        openConversation(data.conversationId)
      }
    },
    // eslint-disable-next-line react-hooks/preserve-manual-memoization
    [newText, loadConversations, openConversation],
  )

  useEffect(() => {
    loadConversations().finally(() => setLoading(false))
  }, [loadConversations])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    if (scrollIntentRef.current === "bottom") {
      el.scrollTop = el.scrollHeight
    } else if (scrollIntentRef.current === "keep") {
      el.scrollTop = prevScrollRef.current.top + (el.scrollHeight - prevScrollRef.current.height)
    }
    scrollIntentRef.current = "none"
  }, [messages])

  const onScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    if (el.scrollTop <= 40) loadOlder()
  }, [loadOlder])

  useEffect(() => {
    const offMsg = subscribe<{ conversationId: string; message: Message }>("message", (payload) => {
      const { conversationId, message } = payload
      if (conversationId === selectedIdRef.current) appendMessage(message)
      loadConversations()
    })
    const offTyping = subscribe<{ conversationId: string; from: string; typing: boolean }>("typing", (payload) => {
      if (payload.conversationId === selectedIdRef.current && payload.from !== myId && payload.typing) {
        setPeerTyping(true)
        if (peerTypingTimer.current) clearTimeout(peerTypingTimer.current)
        peerTypingTimer.current = setTimeout(() => setPeerTyping(false), 2500)
      }
    })
    const offMsgRead = subscribe<{ conversationId: string; messageIds: string[] }>("message_read", (payload) => {
      if (payload.conversationId !== selectedIdRef.current) return
      const ids = new Set(payload.messageIds)
      const now = new Date().toISOString()
      setMessages((prev) => prev.map((m) => (ids.has(m.id) ? { ...m, readAt: now } : m)))
    })
    return () => {
      offMsg()
      offTyping()
      offMsgRead()
    }
  }, [subscribe, appendMessage, loadConversations, myId])

  useEffect(() => {
    if (!search.trim()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMembers([])
      return
    }
    setSearching(true)
    const t = setTimeout(async () => {
      const res = await fetch(`/api/admin/members?q=${encodeURIComponent(search)}&limit=8`)
      if (res.ok) {
        const data = await res.json()
        setMembers(data.members ?? [])
      }
      setSearching(false)
    }, 300)
    return () => clearTimeout(t)
  }, [search])

  const selected = conversations.find((c) => c.id === selectedId) ?? null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Discutez directement avec les membres
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`flex items-center gap-1.5 text-xs ${status === "connected" ? "text-success" : "text-muted-foreground"}`}
          >
            <Circle className={`size-2 ${status === "connected" ? "fill-success" : "fill-muted-foreground"}`} />
            {status === "connected" ? "Temps réel" : "Hors ligne"}
          </span>
          <Button onClick={() => setPickerOpen(true)} className="gap-2">
            <Plus className="size-4" /> Nouveau message
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="grid md:grid-cols-[320px_1fr] min-h-[70vh]">
            <div className="border-r border-border/60 flex flex-col max-h-[70vh]">
              <div className="p-3 border-b border-border/60 space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="pl-9 bg-background"
                  />
                </div>
                <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={unreadOnly}
                    onChange={(e) => setUnreadOnly(e.target.checked)}
                    className="size-3.5 accent-primary"
                  />
                  Non lus uniquement
                </label>
              </div>
              <div className="overflow-y-auto flex-1">
                {loading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="size-6 animate-spin text-primary" />
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-16 text-center px-4">
                    <MessageSquare className="size-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {conversations.length === 0 ? "Aucune conversation." : "Aucun résultat."}
                    </p>
                    <Button variant="outline" size="sm" onClick={() => setPickerOpen(true)} className="mt-2 gap-1.5">
                      <Plus className="size-4" /> Démarrer
                    </Button>
                  </div>
                ) : (
                  filteredConversations.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => openConversation(c.id)}
                      className={`w-full flex items-center gap-3 px-3 py-3 text-left border-b border-border/40 transition-colors ${
                        c.id === selectedId ? "bg-primary/10" : "hover:bg-muted/50"
                      }`}
                    >
                      <Avatar className="size-10 shrink-0">
                        <AvatarFallback>{initials(c.other?.name ?? "?")}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{c.other?.name ?? "Inconnu"}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {c.lastMessage
                            ? c.lastMessage.type === "VIDEO"
                              ? "🎥 Vidéo"
                              : plainPreview(c.lastMessage.content)
                            : "Pas encore de message"}
                        </p>
                      </div>
                      {c.unreadCount > 0 && (
                        <Badge className="shrink-0 bg-primary text-primary-foreground">{c.unreadCount}</Badge>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="flex flex-col min-h-[70vh]">
              {!selected ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center text-muted-foreground">
                  <MessageSquare className="size-10" />
                  <p className="text-sm">Sélectionnez une conversation ou démarrez-en une nouvelle.</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-border/60">
                    <Avatar className="size-9">
                      <AvatarFallback>{initials(selected.other?.name ?? "?")}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold leading-none">{selected.other?.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {peerTyping ? "en train d'écrire…" : selected.other?.email}
                      </p>
                    </div>
                  </div>

                  <div ref={scrollRef} onScroll={onScroll} className="flex-1 overflow-y-auto p-4 space-y-3">
                    {loadingOlder && (
                      <div className="flex justify-center py-2">
                        <Loader2 className="size-4 animate-spin text-muted-foreground" />
                      </div>
                    )}
                    {messages.map((m, i) => {
                      const isMine = m.senderId === myId
                      const showDay = i === 0 || formatDay(messages[i - 1].createdAt) !== formatDay(m.createdAt)
                      return (
                        <div key={m.id}>
                          {showDay && (
                            <div className="text-center text-[11px] text-muted-foreground my-2">
                              {formatDay(m.createdAt)}
                            </div>
                          )}
                          <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                            <div
                              className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                                isMine ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted rounded-bl-sm"
                              }`}
                            >
                              {m.type === "VIDEO" && m.attachmentUrl ? (
                                <video
                                  src={`/api/files/${m.attachmentUrl}`}
                                  controls
                                  className="max-w-[260px] rounded-lg mb-1 bg-black/20"
                                />
                              ) : null}
                              {m.content.trim().length > 0 && (
                                <div className={m.type === "VIDEO" ? "mt-1" : ""}>
                                  <MarkdownMessage content={m.content} />
                                </div>
                              )}
                              <p className={`text-[10px] mt-1 flex items-center gap-1 ${isMine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                                {formatTime(m.createdAt)}
                                {isMine &&
                                  (m.readAt ? (
                                    <CheckCheck className="size-3" />
                                  ) : (
                                    <Check className="size-3" />
                                  ))}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <MessageComposer
                    uploadUrl="/api/admin/messages/attachment"
                    onSend={handleSend}
                    onTypingChange={handleTyping}
                    disabled={!selected}
                  />
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouveau message</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un membre (nom, email)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="max-h-56 overflow-y-auto space-y-1">
              {searching && (
                <div className="flex justify-center py-4">
                  <Loader2 className="size-5 animate-spin text-primary" />
                </div>
              )}
              {!searching && members.length === 0 && search.trim() && (
                <p className="text-sm text-muted-foreground text-center py-4">Aucun membre trouvé.</p>
              )}
              {members.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMember(m)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/60 text-left"
                >
                  <Avatar className="size-8">
                    <AvatarFallback>{initials(m.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{m.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                  </div>
                </button>
              ))}
            </div>

            {selectedMember && (
              <div className="pt-3 border-t border-border space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">À :</span>
                  <span className="font-medium">{selectedMember.name}</span>
                  <button
                    onClick={() => setSelectedMember(null)}
                    className="ml-auto text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-4" />
                  </button>
                </div>
                <textarea
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  rows={3}
                  placeholder="Votre message..."
                  className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50"
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setPickerOpen(false)}>
                    Annuler
                  </Button>
                  <Button onClick={() => startConversation(selectedMember.id)} disabled={!newText.trim()}>
                    <Send className="size-4" /> Envoyer
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
