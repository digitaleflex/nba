"use client"

import { useEffect, useState } from "react"
import { RefreshCw } from "lucide-react"

const ATTEMPTS = [5, 10, 20, 40]

/**
 * Compte à rebours automatique avec backoff exponentiel.
 * Tente jusqu'à 4 fois avec des délais croissants (5s, 10s, 20s, 40s).
 * Rassure l'utilisateur : la page se répare souvent toute seule.
 */
export function AutoRetryCountdown({
  onRetry,
  label = "nouvelle tentative",
}: {
  seconds?: never
  onRetry: () => void
  label?: string
}) {
  const [attempt, setAttempt] = useState(0)
  const [remaining, setRemaining] = useState(ATTEMPTS[0])
  const maxed = attempt >= ATTEMPTS.length

  useEffect(() => {
    if (maxed) return
    if (remaining <= 0) {
      onRetry()
      if (attempt + 1 < ATTEMPTS.length) {
        setAttempt((a) => a + 1)
        setRemaining(ATTEMPTS[attempt + 1])
      } else {
        setAttempt(ATTEMPTS.length)
      }
      return
    }
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000)
    return () => clearTimeout(t)
  }, [remaining, maxed, onRetry, attempt])

  if (maxed) return null

  return (
    <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
      <RefreshCw className="size-3.5 animate-spin" />
      {label} automatique dans {remaining}s…
    </p>
  )
}
