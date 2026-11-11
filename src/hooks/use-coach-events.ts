"use client"

import { useEffect, useState, useRef } from "react"
import { onCoachMessage } from "@nba/lib/coach/events"
import type { CoachMessage } from "@nba/lib/coach/providers/types"

/**
 * Hook pour consommer les messages du Coach IA (CT3).
 * Retourne la liste des messages reçus et une fonction pour en ignorer un.
 *
 * `opts` est un objet littéral recréé à chaque render côté appelant : on ne
 * dépend donc jamais de `opts` directement (cf. TECH-05), pour éviter de
 * se réabonner en boucle. `onMessage` est lu via une ref.
 */
export function useCoachEvents(opts?: { max?: number; onMessage?: (msg: CoachMessage) => void }) {
  const max = opts?.max ?? 5
  const onMessageRef = useRef(opts?.onMessage)
  useEffect(() => {
    onMessageRef.current = opts?.onMessage
  }, [opts?.onMessage])

  const [messages, setMessages] = useState<CoachMessage[]>([])
  const seenRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    return onCoachMessage((msg) => {
      if (seenRef.current.has(msg.id)) return
      seenRef.current.add(msg.id)
      onMessageRef.current?.(msg)
      setMessages((prev) => [msg, ...prev].slice(0, max))
    })
  }, [max])

  const dismiss = (id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id))
  }

  return { messages, dismiss }
}
