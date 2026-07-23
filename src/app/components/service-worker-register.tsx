"use client"

import { useEffect } from "react"

const SW_URL = "/sw.js"

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return
    if (!("serviceWorker" in navigator)) return

    let mounted = true

    navigator.serviceWorker.register(SW_URL).then((reg) => {
      if (!mounted) return

      reg.addEventListener("updatefound", () => {
        const installing = reg.installing
        if (!installing) return

        installing.addEventListener("statechange", () => {
          if (installing.state === "installed" && navigator.serviceWorker.controller) {
            console.log("[SW] Nouvelle version disponible — rechargement recommandé")
          }
        })
      })
    }).catch((err) => {
      console.warn("[SW] Registration failed:", err)
    })

    return () => { mounted = false }
  }, [])

  return null
}
