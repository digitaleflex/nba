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

    const wsUrl = url || (window.location.protocol === "https:" ? window.location.origin : `http://${window.location.hostname}:3001`)

    if (socketRef.current?.connected) return

    setStatus("connecting")

    const socket = io(wsUrl, {
      path,
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      timeout: 10000,
      autoConnect: false,
    })

    socketRef.current = socket

    socket.on("connect", () => {
      setStatus("connected")
      onConnectRef.current?.()
    })

    socket.on("disconnect", (reason) => {
      setStatus("disconnected")
      onDisconnectRef.current?.(reason)
    })

    socket.on("connect_error", (err) => {
      setStatus("error")
      console.warn("[useSocket] connect_error:", err.message)
    })

    socket.on("notification", (data: unknown) => {
      onNotificationRef.current?.(data)
      // Dispatch aux handlers enregistrés via subscribe()
      const set = handlersRef.current.get("notification")
      if (set) set.forEach((h) => h(data))
    })

    if (autoConnect) socket.connect()
  }, [url, path, autoConnect])

  useEffect(() => {
    connect()
    return () => {
      socketRef.current?.disconnect()
      socketRef.current = null
    }
  }, [connect])

  const subscribe = useCallback(<T = unknown,>(event: string, handler: (data: T) => void) => {
    if (!handlersRef.current.has(event)) {
      handlersRef.current.set(event, new Set())
    }
    handlersRef.current.get(event)!.add(handler as (data: unknown) => void)

    // Si on a déjà un socket connecté, on ajoute le listener
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
    socketRef.current?.disconnect()
    socketRef.current?.connect()
  }, [])

  return { status, socket: socketRef, subscribe, emit, reconnect }
}
