"use client"

import { useEffect, useState } from "react"

/**
 * Détecte si l'utilisateur est sur un device avec pointer coarse (tactile).
 * SSR-safe : renvoie `false` côté serveur, puis se met à jour au mount.
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 767px), (pointer: coarse) and (max-width: 1023px)")
    const onChange = () => setIsMobile(mql.matches)
    onChange()
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return isMobile
}
