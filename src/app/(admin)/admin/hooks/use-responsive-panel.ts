"use client"

import { useEffect, useState } from "react"

export type PanelVariant = "side" | "fullscreen"

/**
 * Renvoie la variante de panneau adaptée au viewport :
 * - "side" (desktop) : panneau ancré à droite, backdrop blur
 * - "fullscreen" (mobile) : push-from-right plein écran avec breadcrumb
 */
export function useResponsivePanel(): PanelVariant {
  const [variant, setVariant] = useState<PanelVariant>("side")

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)")
    const update = () => setVariant(mq.matches ? "fullscreen" : "side")
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])

  return variant
}
