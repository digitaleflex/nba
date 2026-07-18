"use client"

import { Fragment, useCallback, useEffect, useRef, useState } from "react"
import { authClient } from "@nba/lib/auth-client"
import { useMessagingUnread } from "@nba/lib/messaging-unread"
import { plainPreview } from "@nba/lib/markdown"
import { MessageComposer, type SendPayload } from "@nba/components/message-composer"
import { ChatMessage, type ChatMessageData, type QuotedRef } from "@nba/components/chat-message"
import { Card, CardContent, Input, Button, Avatar, AvatarFallback, Badge, Dialog, DialogContent, DialogHeader, DialogTitle } from "@nba/design-system"
import { MessageSquare, Loader2, Search, Plus, X, Circle, Send } from "lucide-react"
import { toast } from "sonner"

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

interface Admin {
  id: string
  name: string
  email: string
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

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessageData[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [query, setQuery] = useState("")
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [peerTyping, setPeerTyping] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [adminQuery, setAdminQuery] = useState("")
  const [admins, setAdmins] = useState<Admin[]>([])
  const [searchingAdmins, setSearchingAdmins] = useState(false)
  const [newText, setNewText] = useState("")
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null)
  const [quoted, setQuoted] = useState<QuotedRef | null>(null)
  const [composerQuoted, setComposerQuoted] = useState<{ id: string; senderName: string; preview: string } | null>(null)
  const [hiddenForMe, setHiddenForMe] = useState<Set<string>>(new Set())
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
  const scrollRef = useRef<HTMLDivElement>(null)
  const composerRef = useRef<HTMLDivElement>(null)
  const peerTypingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const scrollIntentRef = useRef<ScrollIntent>("none")
  const prevScrollRef = useRef<{ top: number; height: number }>({ top: 0, height: 0 })
  const loadingOlderRef = useRef(false)
  const { data: sessionData } = authClient.useSession()
  const myId = sessionData?.user?.id ?? ""

  const {
    subscribe,
    emit,
    status,
    setActiveConversation,
    syncFromServer,
    clearConversation,
    setOnConnect,
  } = useMessagingUnread()

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
    const res = await fetch("/api/dashboard/messages")
    if (res.ok) {
      const data = await res.json()
      setConversations(Array.isArray(data.conversations) ? data.conversations : [])
      syncFromServer(Array.isArray(data.conversations) ? data.conversations : [])
    }
  }, [syncFromServer])

  const openConversation = useCallback(async (id: string) => {
    setSelectedId(id)
    setPeerTyping(false)
    setMessages([])
    setHiddenForMe(new Set())
    setQuoted(null)
    setComposerQuoted(null)
    setActiveConversation(id)
    clearConversation(id)
    const res = await fetch(`/api/dashboard/messages/${id}`)
    if (res.ok) {
      const data = await res.json()
      setMessages(Array.isArray(data.messages) ? data.messages : [])
      setHasMore(data.hasMore ?? false)
      scrollIntentRef.current = "bottom"
      setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c)))
    }
  }, [setActiveConversation, clearConversation])

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
    const res = await fetch(`/api/dashboard/messages/${id}?before=${encodeURIComponent(oldest.createdAt)}`)
    if (res.ok) {
      const data = await res.json()
      setMessages((prev) => [...(Array.isArray(data.messages) ? data.messages : []), ...prev])
      setHasMore(data.hasMore)
    }
    loadingOlderRef.current = false
    setLoadingOlder(false)
  }, [hasMore, messages])

  const appendMessage = useCallback((msg: ChatMessageData) => {
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
      const { type, content, attachment, quotedMessageId } = payload
      const tempId = `temp-${Date.now()}`
      const optimistic: ChatMessageData = {
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
        editedAt: null,
        deletedAt: null,
        quotedMessageId: quotedMessageId ?? null,
        quoted: quoted
          ? { id: quoted.id, senderName: quoted.senderName, content: quoted.content, type: quoted.type, attachmentMime: quoted.attachmentMime }
          : null,
        reactions: [],
        createdAt: new Date().toISOString(),
      }
      appendMessage(optimistic)
      scrollIntentRef.current = "bottom"
      if (selectedOtherRef.current) {
        emit("typing", { to: selectedOtherRef.current.id, conversationId: selectedId, typing: false })
      }
      setSending(true)
      const res = await fetch(`/api/dashboard/messages/${selectedId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, content, attachment: attachment ?? undefined, quotedMessageId: quotedMessageId ?? undefined }),
      })
      setSending(false)
      if (res.ok) {
        const data = await res.json()
        setMessages((prev) => prev.map((m) => (m.id === tempId && data.message ? data.message : m)))
        setQuoted(null)
        setComposerQuoted(null)
        loadConversations()
      } else {
        setMessages((prev) => prev.filter((m) => m.id !== tempId))
      }
    },
    [selectedId, sending, myId, emit, appendMessage, loadConversations, quoted],
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
    async (adminId: string) => {
      if (!newText.trim()) return
      const res = await fetch("/api/dashboard/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId, content: newText.trim() }),
      })
      if (res.ok) {
        const data = await res.json()
        setPickerOpen(false)
        setNewText("")
        setAdminQuery("")
        setAdmins([])
        setSelectedAdmin(null)
        await loadConversations()
        openConversation(data.conversationId)
      }
    },
    [newText, loadConversations, openConversation],
  )

  const handleQuote = useCallback((m: ChatMessageData) => {
    setQuoted({ id: m.id, senderName: m.senderName, content: m.content, type: m.type, attachmentMime: m.attachmentMime })
    const preview = m.attachmentMime?.startsWith("image/")
      ? "🖼️ Image"
      : m.attachmentMime?.startsWith("video/")
        ? "🎥 Vidéo"
        : plainPreview(m.content)
    setComposerQuoted({ id: m.id, senderName: m.senderName, preview })
    requestAnimationFrame(() => composerRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }))
  }, [])

  const handleReact = useCallback(async (messageId: string, emoji: string | null) => {
    const current = messages.find((m) => m.id === messageId)
    const mine = current?.reactions.find((r) => r.userId === myId)?.emoji ?? null
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId) return m
        const others = m.reactions.filter((r) => r.userId !== myId)
        const next = emoji && emoji !== mine ? [...others, { userId: myId, emoji }] : others
        return { ...m, reactions: next }
      }),
    )
    const id = selectedIdRef.current
    if (!id) return
    await fetch(`/api/dashboard/messages/${id}/${messageId}/reactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emoji }),
    })
  }, [messages, myId])

  const handleEdit = useCallback(async (messageId: string, content: string) => {
    const id = selectedIdRef.current
    if (!id) return
    setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, content, editedAt: new Date().toISOString() } : m)))
    await fetch(`/api/dashboard/messages/${id}/${messageId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    })
  }, [])

  const handleDelete = useCallback(async (messageId: string, forEveryone: boolean) => {
    if (forEveryone) {
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, deletedAt: new Date().toISOString(), content: "" } : m)))
    } else {
      setHiddenForMe((prev) => new Set(prev).add(messageId))
    }
    const id = selectedIdRef.current
    if (!id) return
    await fetch(`/api/dashboard/messages/${id}/${messageId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ forEveryone }),
    })
  }, [])

  const scrollToMessage = useCallback((messageId: string) => {
    const el = document.getElementById(`msg-${messageId}`)
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" })
      el.classList.add("ring-2", "ring-primary", "rounded-xl")
      setTimeout(() => el.classList.remove("ring-2", "ring-primary", "rounded-xl"), 1500)
    }
  }, [])

  const handleReport = useCallback(async (messageId: string, reason: string) => {
    const id = selectedIdRef.current
    if (!id) return
    try {
      const res = await fetch(`/api/dashboard/messages/${id}/${messageId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      })
      if (res.ok) toast.success("Message signalé à l'équipe de modération")
      else toast.error("Impossible de signaler ce message")
    } catch {
      toast.error("Impossible de signaler ce message")
    }
  }, [])

  // Chargement initial de la liste, indépendant du socket : évite un spinner
  // infini si le WebSocket est indisponible (la liste doit s'afficher quand même).
  useEffect(() => {
    loadConversations().finally(() => setLoading(false))
  }, [loadConversations])

  useEffect(() => {
    setOnConnect(() => {
      loadConversations().finally(() => setLoading(false))
      if (selectedIdRef.current) openConversation(selectedIdRef.current)
    })
    return () => setOnConnect(null)
  }, [setOnConnect, loadConversations, openConversation])

  useEffect(() => {
    const convId = new URLSearchParams(window.location.search).get("conv")
    if (convId) requestAnimationFrame(() => openConversation(convId))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
    const offMsg = subscribe<{ type?: string; conversationId: string; message?: ChatMessageData; messageId?: string; content?: string; editedAt?: string; emoji?: string | null; reactions?: { userId: string; emoji: string }[]; forEveryone?: boolean }>("message", (payload) => {
      const { conversationId, type } = payload
      if (conversationId !== selectedIdRef.current) {
        loadConversations()
        return
      }
      if (type === "MESSAGE" && payload.message) {
        appendMessage(payload.message)
      } else if (type === "MESSAGE_REACTION" && payload.messageId) {
        setMessages((prev) => prev.map((m) => (m.id === payload.messageId ? { ...m, reactions: payload.reactions ?? [] } : m)))
      } else if (type === "MESSAGE_UPDATED" && payload.messageId) {
        setMessages((prev) => prev.map((m) => (m.id === payload.messageId ? { ...m, content: payload.content ?? m.content, editedAt: payload.editedAt ?? m.editedAt } : m)))
      } else if (type === "MESSAGE_DELETED" && payload.messageId) {
        setMessages((prev) => prev.map((m) => (m.id === payload.messageId ? { ...m, deletedAt: new Date().toISOString(), content: "" } : m)))
      } else {
        loadConversations()
      }
    })
    const offTyping = subscribe<{ conversationId: string; from: string; typing: boolean }>("typing", (payload) => {
      if (
        payload.conversationId === selectedIdRef.current &&
        payload.from !== myId &&
        payload.typing
      ) {
        setPeerTyping(true)
        if (peerTypingTimer.current) clearTimeout(peerTypingTimer.current)
        peerTypingTimer.current = setTimeout(() => setPeerTyping(false), 2500)
      }
    })
    const offRead = subscribe<{ conversationId: string; messageIds: string[] }>("message_read", (payload) => {
      if (payload.conversationId !== selectedIdRef.current) return
      const ids = new Set(payload.messageIds)
      const now = new Date().toISOString()
      setMessages((prev) => prev.map((m) => (ids.has(m.id) ? { ...m, readAt: now } : m)))
    })
    const offPresence = subscribe<{ userId: string; online: boolean }>("presence", (payload) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev)
        if (payload.online) next.add(payload.userId)
        else next.delete(payload.userId)
        return next
      })
    })
    const offPresenceInit = subscribe<string[]>("presence:init", (ids) => setOnlineUsers(new Set(ids)))
    return () => {
      offMsg()
      offTyping()
      offRead()
      offPresence()
      offPresenceInit()
    }
  }, [subscribe, appendMessage, loadConversations, myId])

  useEffect(() => {
    return () => {
      if (peerTypingTimer.current) clearTimeout(peerTypingTimer.current)
      setActiveConversation(null)
    }
  }, [setActiveConversation])

  useEffect(() => {
    if (!adminQuery.trim()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAdmins([])
      return
    }
    setSearchingAdmins(true)
    const t = setTimeout(async () => {
      const res = await fetch(`/api/dashboard/admins?q=${encodeURIComponent(adminQuery)}`)
      if (res.ok) {
        const data = await res.json()
        setAdmins(data.admins ?? [])
      }
      setSearchingAdmins(false)
    }, 300)
    return () => clearTimeout(t)
  }, [adminQuery])

  const selected = conversations.find((c) => c.id === selectedId) ?? null
  const online = status === "connected"

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Vos conversations avec l&apos;équipe NeverBrokeAgain
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`flex items-center gap-1.5 text-xs ${online ? "text-success" : "text-muted-foreground"}`}
          >
            <Circle className={`size-2 ${online ? "fill-success" : "fill-muted-foreground"}`} />
            {online ? "Temps réel" : "Hors ligne"}
          </span>
          <Button onClick={() => setPickerOpen(true)} className="gap-2">
            <Plus className="size-4" /> Nouveau message
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="grid md:grid-cols-[320px_1fr] min-h-[70vh]">
            {/* Liste des conversations */}
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
                      {conversations.length === 0
                        ? "Aucune conversation pour le moment."
                        : "Aucun résultat."}
                    </p>
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
                      <div className="relative shrink-0">
                        <Avatar className="size-10">
                          <AvatarFallback>{initials(c.other?.name ?? "?")}</AvatarFallback>
                        </Avatar>
                        {c.other && onlineUsers.has(c.other.id) && (
                          <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-green-500 border-2 border-background" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{c.other?.name ?? "Inconnu"}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {c.lastMessage
                            ? c.lastMessage.type === "VIDEO"
                              ? "🎥 Vidéo"
                              : c.lastMessage.type === "IMAGE"
                                ? "🖼️ Image"
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

            {/* Fil de discussion */}
            <div className="flex flex-col min-h-[70vh]">
              {!selected ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center text-muted-foreground">
                  <MessageSquare className="size-10" />
                  <p className="text-sm">Sélectionnez une conversation ou démarrez-en une nouvelle.</p>
                  <Button variant="outline" size="sm" onClick={() => setPickerOpen(true)} className="mt-1 gap-1.5">
                    <Plus className="size-4" /> Démarrer
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-border/60">
                    <div className="relative">
                      <Avatar className="size-9">
                        <AvatarFallback>{initials(selected.other?.name ?? "?")}</AvatarFallback>
                      </Avatar>
                      {selected.other && onlineUsers.has(selected.other.id) && (
                        <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-green-500 border-2 border-background" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold leading-none">{selected.other?.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {peerTyping ? "en train d'écrire…" : onlineUsers.has(selected.other?.id ?? "") ? "en ligne" : selected.other?.email}
                      </p>
                    </div>
                  </div>

                  <div ref={scrollRef} onScroll={onScroll} className="flex-1 overflow-y-auto p-4 space-y-3">
                    {loadingOlder && (
                      <div className="flex justify-center py-2">
                        <Loader2 className="size-4 animate-spin text-muted-foreground" />
                      </div>
                    )}
                    {messages
                      .filter((m) => !hiddenForMe.has(m.id))
                      .map((m, i) => {
                        const showDay = i === 0 || formatDay(messages[i - 1].createdAt) !== formatDay(m.createdAt)
                        return (
                          <Fragment key={m.id}>
                            {showDay && (
                              <div className="text-center text-[11px] text-muted-foreground my-2">
                                {formatDay(m.createdAt)}
                              </div>
                            )}
                            <ChatMessage
                              message={m}
                              myId={myId}
                              isMine={m.senderId === myId}
                              onQuote={handleQuote}
                              onReact={handleReact}
                              onEdit={handleEdit}
                              onDelete={handleDelete}
                              onReport={handleReport}
                              onScrollTo={scrollToMessage}
                            />
                          </Fragment>
                        )
                      })}
                  </div>

                  <div ref={composerRef}>
                    <MessageComposer
                      uploadUrl="/api/dashboard/messages/attachment"
                      onSend={handleSend}
                      onTypingChange={handleTyping}
                      disabled={!selected}
                      quotedMessage={composerQuoted}
                      onClearQuote={() => {
                        setQuoted(null)
                        setComposerQuoted(null)
                      }}
                    />
                  </div>
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
                placeholder="Rechercher un admin (nom, email)..."
                value={adminQuery}
                onChange={(e) => setAdminQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="max-h-56 overflow-y-auto space-y-1">
              {searchingAdmins && (
                <div className="flex justify-center py-4">
                  <Loader2 className="size-5 animate-spin text-primary" />
                </div>
              )}
              {!searchingAdmins && admins.length === 0 && adminQuery.trim() && (
                <p className="text-sm text-muted-foreground text-center py-4">Aucun admin trouvé.</p>
              )}
              {admins.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setSelectedAdmin(a)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/60 text-left"
                >
                  <Avatar className="size-8">
                    <AvatarFallback>{initials(a.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{a.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{a.email}</p>
                  </div>
                </button>
              ))}
            </div>

            {selectedAdmin && (
              <div className="pt-3 border-t border-border space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">À :</span>
                  <span className="font-medium">{selectedAdmin.name}</span>
                  <button
                    onClick={() => setSelectedAdmin(null)}
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
                  <Button onClick={() => startConversation(selectedAdmin.id)} disabled={!newText.trim()}>
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
