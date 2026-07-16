"use client"

import * as React from "react"
import { useIsMobile } from "../hooks/use-is-mobile"

interface ResponsiveProps {
  /** AffichÃ© sur mobile uniquement (< md) */
  mobile?: React.ReactNode
  /** AffichÃ© sur tablette et desktop (>= md) */
  desktop?: React.ReactNode
  /** Mode explicite : "mobile" ou "desktop" */
  show?: "mobile" | "desktop" | "both"
  /** Alias pour show="mobile" */
  children?: React.ReactNode
}

/**
 * Composant utilitaire pour le dual-render mobile/desktop.
 *
 * Usage 1 — par breakpoint implicite :
 *   <Responsive mobile={<Card />} desktop={<Table />} />
 *
 * Usage 2 — par mode explicite :
 *   <Responsive show="mobile"><Card /></Responsive>
 *   <Responsive show="desktop"><Table /></Responsive>
 */
export function Responsive({ mobile, desktop, show, children }: ResponsiveProps) {
  const isMobile = useIsMobile()

  if (show === "mobile") return isMobile ? <>{children}</> : null
  if (show === "desktop") return isMobile ? null : <>{children}</>
  if (show === "both" || !show) return <>{children}</>

  // Mode par breakpoint
  return isMobile ? <>{mobile}</> : <>{desktop}</>
}
