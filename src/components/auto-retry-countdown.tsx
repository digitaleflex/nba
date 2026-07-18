"use client"

import { useEffect, useState } from "react"
import { RefreshCw } from "lucide-react"

/**
 * Compte à rebours automatique qui relance une action (reset / reload)
 * après `seconds` secondes. Rassure l'utilisateur : la page se répare
 * souvent toute seule, sans action de sa part.
 */
export function AutoRetryCountdown({
  seconds = 10,
  onRetry,
  label = "nouvelle tentative",
}: {
  seconds?: number
  onRetry: () => void
  label?: string
}) {
  const [remaining, setRemaining] = useState(seconds)

  useEffect(() => {
    if (remaining <= 0) {
      onRetry()
      return
    }
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000)
    return () => clearTimeout(t)
  }, [remaining, onRetry])

  return (
    <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
      <RefreshCw className="size-3.5 animate-spin" />
      {label} automatique dans {remaining}s…
    </p>
  )
}
