"use client"

import { useEffect, useRef, useState, useCallback, type MutableRefObject } from "react"
import { io, Socket } from "socket.io-client"

export type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error"

interface UseSocketOptions {
  url?: string
  path?: string
  autoConnect?: boolean
  onNotification?: (notification: unknown) => void
  onConnect?: () => void
  onDisconnect?: (reason: string) => void
}

interface UseSocketReturn {
  status: ConnectionStatus
  /** Ref vers le socket (accéder à .current hors render, ex: dans callbacks) */
  socket: MutableRefObject<Socket | null>
  subscribe: <T = unknown>(event: string, handler: (data: T) => void) => () => void
  emit: (event: string, data?: unknown) => void
  reconnect: () => void
}

/**
 * Hook React pour se connecter au serveur WebSocket Socket.IO.
 * Envoie automatiquement les cookies de session pour l'authentification.
 *
 * @example
 * const { status, subscribe } = useSocket({
 *   onNotification: (n) => console.log("Nouvelle notif:", n)
 * })
 *
 * useEffect(() => {
 *   const off = subscribe("notification", (n) => addNotification(n))
 *   return off
 * }, [subscribe])
 */
// Singleton partagé : une seule connexion Socket.IO par onglet, quel que soit
// le nombre de composants utilisant useSocket(). Évite de multiplier les
// sockets (un par hook) et préserve les handlers entre les montages.
interface SocketSingleton {
  socket: Socket
  handlers: Map<string, Set<(data: unknown) => void>>
  refCount: number
}
const socketSingleton: { current: SocketSingleton | null } = { current: null }

function getWsUrl(options: UseSocketOptions): string {
  const url = options.url || process.env.NEXT_PUBLIC_WS_URL
  if (url) return url
  if (typeof window === "undefined") return "http://localhost:3001"
  return window.location.protocol === "https:"
    ? window.location.origin
    : `http://${window.location.hostname}:3001`
}

function acquireSocket(options: UseSocketOptions): SocketSingleton {
  if (socketSingleton.current) {
    socketSingleton.current.refCount += 1
    return socketSingleton.current
  }

  const socket = io(getWsUrl(options), {
  path: options.path ?? "/socket.io/",
  withCredentials: true,
  transports: ["polling"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
    timeout: 10000,
    autoConnect: false,
  })

  const singleton: SocketSingleton = {
    socket,
    handlers: new Map(),
    refCount: 1,
  }
  socketSingleton.current = singleton

  socket.on("connect", () => {
    // Ré-attache tous les handlers enregistrés (même si subscribe a été
    // appelé avant la connexion).
    for (const [event, set] of singleton.handlers) {
      set.forEach((h) => socket.on(event, h as (...args: unknown[]) => void))
    }
  })

  socket.on("disconnect", (reason) => {
    if (reason !== "io client disconnect") {
      // Socket.IO tente une reconnexion automatique
    }
  })

  socket.on("connect_error", (err) => {
    console.warn("[useSocket] connect_error:", err.message)
  })

  socket.io.on("reconnect_attempt", () => {
    // état géré par les consommateurs via status
  })

  socket.io.on("reconnect_failed", () => {
    // état géré par les consommateurs
  })

  socket.on("notification", (data: unknown) => {
    const set = singleton.handlers.get("notification")
    if (set) set.forEach((h) => h(data))
  })

  if (options.autoConnect !== false) socket.connect()
  return singleton
}

function releaseSocket(): void {
  const s = socketSingleton.current
  if (!s) return
  s.refCount -= 1
  if (s.refCount <= 0) {
    s.socket.removeAllListeners()
    s.socket.disconnect()
    socketSingleton.current = null
  }
}

export function useSocket(options: UseSocketOptions = {}): UseSocketReturn {
  const {
    url,
    path = "/socket.io/",
    autoConnect = true,
    onNotification,
    onConnect,
    onDisconnect,
  } = options

  const [status, setStatus] = useState<ConnectionStatus>("connecting")
  const socketRef = useRef<Socket | null>(null)
  const handlersRef = useRef<Map<string, Set<(data: unknown) => void>>>(new Map())

  // Refs pour les callbacks (évitent de recréer la connexion à chaque render)
  const onNotificationRef = useRef(onNotification)
  const onConnectRef = useRef(onConnect)
  const onDisconnectRef = useRef(onDisconnect)
  useEffect(() => {
    onNotificationRef.current = onNotification
    onConnectRef.current = onConnect
    onDisconnectRef.current = onDisconnect
  }, [onNotification, onConnect, onDisconnect])

  const connect = useCallback(() => {
    if (typeof window === "undefined") return
    const singleton = acquireSocket({ url, path, autoConnect })
    socketRef.current = singleton.socket
    handlersRef.current = singleton.handlers

    if (singleton.socket.connected) {
      setStatus("connected")
    } else {
      setStatus("connecting")
    }
  }, [url, path, autoConnect])

  useEffect(() => {
    connect()
    const sock = socketRef.current
    if (!sock) return

    const onConnect = () => {
      setStatus("connected")
      onConnectRef.current?.()
    }
    const onDisconnect = (reason: string) => {
      if (reason !== "io client disconnect") {
        setStatus("connecting")
        onDisconnectRef.current?.(reason)
      } else {
        setStatus("disconnected")
        onDisconnectRef.current?.(reason)
      }
    }
    const onReconnectAttempt = () => setStatus("connecting")
    const onReconnectFailed = () => setStatus("error")

    sock.on("connect", onConnect)
    sock.on("disconnect", onDisconnect)
    sock.io.on("reconnect_attempt", onReconnectAttempt)
    sock.io.on("reconnect_failed", onReconnectFailed)

    return () => {
      sock.off("connect", onConnect)
      sock.off("disconnect", onDisconnect)
      sock.io.off("reconnect_attempt", onReconnectAttempt)
      sock.io.off("reconnect_failed", onReconnectFailed)
      releaseSocket()
      socketRef.current = null
    }
  }, [connect])

  const subscribe = useCallback(<T = unknown,>(event: string, handler: (data: T) => void) => {
    if (!handlersRef.current.has(event)) {
      handlersRef.current.set(event, new Set())
    }
    handlersRef.current.get(event)!.add(handler as (data: unknown) => void)

    if (socketRef.current) {
      socketRef.current.on(event, handler as (...args: unknown[]) => void)
    }

    return () => {
      handlersRef.current.get(event)?.delete(handler as (data: unknown) => void)
      socketRef.current?.off(event, handler as (...args: unknown[]) => void)
    }
  }, [])

  const emit = useCallback((event: string, data?: unknown) => {
    socketRef.current?.emit(event, data)
  }, [])

  const reconnect = useCallback(() => {
    releaseSocket()
    socketRef.current = null
    connect()
  }, [connect])

  return { status, socket: socketRef, subscribe, emit, reconnect }
}
