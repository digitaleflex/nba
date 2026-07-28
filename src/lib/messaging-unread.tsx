"use client"

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { useRouter, usePathname } from "next/navigation"
import { toast } from "sonner"
import { useSocket, type ConnectionStatus } from "@nba/lib/hooks/use-socket"

type ConversationSeed = { id: string; unreadCount: number }

interface IncomingMessage {
  conversationId: string
  message: {
    id: string
    senderId: string
    senderName: string
    content: string
    readAt: string | null
    createdAt: string
  }
}

interface MessagingUnreadContextValue {
  /** Total des messages non lus toutes conversations confondues */
  unreadTotal: number
  status: ConnectionStatus
  subscribe: <T = unknown>(event: string, handler: (data: T) => void) => () => void
  emit: (event: string, data?: unknown) => void
  /** Indique au store quelle conversation est ouverte à l'écran (donc "lue") */
  setActiveConversation: (id: string | null) => void
  /** Réconcilie les compteurs avec l'état serveur (liste des conversations) */
  syncFromServer: (conversations: ConversationSeed[]) => void
  /** Remet à zéro le compteur d'une conversation (quand elle est ouverte) */
  clearConversation: (id: string) => void
  /** Enregistre un callback exécuté à chaque (re)connexion du socket */
  setOnConnect: (cb: (() => void) | null) => void
}

const MessagingUnreadContext = createContext<MessagingUnreadContextValue | null>(null)

export function MessagingUnreadProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [counts, setCounts] = useState<Record<string, number>>({})
  const activeRef = useRef<string | null>(null)
  const onConnectRef = useRef<(() => void) | null>(null)

  const { subscribe, emit, status } = useSocket({
    onConnect: () => {
      onConnectRef.current?.()
    },
  })

  const setActiveConversation = useCallback((id: string | null) => {
    activeRef.current = id
  }, [])

  const clearConversation = useCallback((id: string) => {
    setCounts((prev) => {
      if (!prev[id]) return prev
      const next = { ...prev }
      delete next[id]
      return next
    })
  }, [])

  const syncFromServer = useCallback((conversations: ConversationSeed[]) => {
    setCounts((prev) => {
      const next = { ...prev }
      for (const c of conversations) {
        // La conversation ouverte à l'écran est considérée comme déjà lue
        if (c.id === activeRef.current) {
          delete next[c.id]
        } else {
          next[c.id] = c.unreadCount
        }
      }
      return next
    })
  }, [])

  const unreadTotal = Object.values(counts).reduce((a, b) => a + b, 0)

  // Tab title badge : "(3) 📬" dans le titre du navigateur
  const originalTitle = useRef<string>("")
  useEffect(() => {
    if (typeof document === "undefined") return
    if (!originalTitle.current) originalTitle.current = document.title
    if (unreadTotal > 0) {
      document.title = `(${unreadTotal}) ${originalTitle.current}`
    } else {
      document.title = originalTitle.current
    }
  }, [unreadTotal])

  useEffect(() => {
    const off = subscribe<IncomingMessage>("message", (payload) => {
      const { conversationId, message } = payload
      // Si l'utilisateur a la conversation ouverte, il la voit en direct : pas de compteur
      if (activeRef.current === conversationId) return

      setCounts((prev) => ({ ...prev, [conversationId]: (prev[conversationId] ?? 0) + 1 }))

      // Notification bureau (si autorisée et page en arrière-plan)
      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted" && document.hidden) {
        try {
          const name = message.senderName || "L'équipe"
          new Notification(`💬 Nouveau message de ${name}`, {
            body: message.content.length > 100 ? `${message.content.slice(0, 100)}…` : message.content,
            icon: "/favicon.ico",
            tag: conversationId,
          })
        } catch {}
      }

      // On ne toast que si l'utilisateur n'est pas déjà sur la page Messages
      // (la liste des conversations y est visible, le badge suffit).
      const isOnMessagesPage =
        pathname?.startsWith("/dashboard/messages") || pathname?.startsWith("/admin/messages")
      if (isOnMessagesPage) return

      const isAdmin = pathname?.startsWith("/admin")
      const baseUrl = isAdmin ? "/admin/messages" : "/dashboard/messages"

      const name = message.senderName || "L'équipe"
      toast(`💬 Nouveau message de ${name}`, {
        description:
          message.content.length > 80 ? `${message.content.slice(0, 80)}…` : message.content,
        action: {
          label: "Voir",
          onClick: () => router.push(`${baseUrl}?conv=${conversationId}`),
        },
        duration: 6000,
      })
    })
    return off
  }, [subscribe, router, pathname])

  // Seed initial : on arrive parfois directement sur le dashboard (pas sur Messages).
  // On récupère les compteurs serveur pour afficher le badge dès le premier rendu.
  useEffect(() => {
    let cancelled = false
    const isAdmin = pathname?.startsWith("/admin")
    const url = isAdmin ? "/api/admin/messages" : "/api/dashboard/messages"
    fetch(url)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data?.conversations) syncFromServer(data.conversations)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [syncFromServer, pathname])

  const value: MessagingUnreadContextValue = {
    unreadTotal,
    status,
    subscribe,
    emit,
    setActiveConversation,
    syncFromServer,
    clearConversation,
    setOnConnect: (cb) => {
      onConnectRef.current = cb
    },
  }

  return (
    <MessagingUnreadContext.Provider value={value}>{children}</MessagingUnreadContext.Provider>
  )
}

export function useMessagingUnread(): MessagingUnreadContextValue {
  const ctx = useContext(MessagingUnreadContext)
  if (!ctx) {
    throw new Error("useMessagingUnread doit être utilisé dans <MessagingUnreadProvider>")
  }
  return ctx
}
