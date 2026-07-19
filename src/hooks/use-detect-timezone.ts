"use client"

import { useEffect, useRef } from "react"

/**
 * Détecte le fuseau horaire du navigateur et le synchronise avec le profil
 * utilisateur si nécessaire. S'exécute une fois au montage.
 */
export function useDetectTimezone(serverTimezone?: string | null) {
  const done = useRef(false)
  const serverValue = useRef(serverTimezone)

  useEffect(() => {
    if (done.current) return

    const sync = (current: string | null | undefined) => {
      if (done.current) return
      done.current = true

      let detected: string
      try {
        detected = Intl.DateTimeFormat().resolvedOptions().timeZone
      } catch {
        return
      }
      if (!detected) return

      // Déjà synchronisé
      if (current && current === detected) return

      // Ne pas écraser un fuseau explicite (différent du défaut) déjà enregistré
      if (current && current !== "Europe/Paris" && current !== detected) return

      fetch("/api/dashboard/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timezone: detected }),
      }).catch(() => {
        // Silencieux : best-effort
      })
    }

    if (serverValue.current !== undefined) {
      sync(serverValue.current)
    } else {
      // Récupère le profil pour connaître le fuseau serveur
      fetch("/api/dashboard/profile")
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => sync(d?.user?.timezone))
        .catch(() => sync(null))
    }
  }, [])
}
