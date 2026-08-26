"use client"

import type { ReactNode } from "react"
import { cn } from "@nba/design-system"

/**
 * Kit UI partagé des onglets admin — Phase 1 (fondations).
 *
 * Échelle typographique officielle :
 *   - Données / corps de tableau : text-sm
 *   - Labels, méta, secondaire   : text-xs   (plancher absolu — bannir [10px]/[11px])
 *   - Titre d'onglet             : text-xl
 *
 * Densités de tableau officielles :
 *   - comfortable : listes principales lisibles
 *   - compact     : sous-tableaux et vues denses
 */

export type Tone = "success" | "warning" | "destructive" | "info" | "neutral"

/** Palettes de statut centralisées — tokens sémantiques theme-aware (clair/sombre automatiques). */
const TONE_CLASSES: Record<Tone, string> = {
  success: "bg-success/10 text-success border-success/25",
  warning: "bg-warning/15 text-warning-foreground border-warning/30",
  destructive: "bg-destructive/10 text-destructive border-destructive/25",
  info: "bg-primary/10 text-primary border-primary/25",
  neutral: "bg-muted text-muted-foreground border-border",
}

interface StatusBadgeProps {
  tone: Tone
  children: ReactNode
  className?: string
  title?: string
}

/** Badge de statut unique pour toute l'admin. Les labels restent locaux aux tabs. */
export function StatusBadge({ tone, children, className, title }: StatusBadgeProps) {
  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-semibold",
        TONE_CLASSES[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

/** Cellules de tableau : exactement deux densités autorisées. */
export const TABLE_CELL = {
  comfortable: "px-4 py-3",
  compact: "px-3 py-2",
} as const

export type TableDensity = keyof typeof TABLE_CELL

/** En-tête de tableau assorti à la densité choisie. */
export const TABLE_HEAD: Record<TableDensity, string> = {
  comfortable: "px-4 py-3",
  compact: "px-3 py-2",
}

/**
 * Map générique statut → ton. Chaque tab peut y ajouter ses libellés,
 * mais les tons restent centralisés ici.
 */
export const COMMON_STATUS_TONES: Record<string, Tone> = {
  APPROVED: "success",
  ACTIVE: "success",
  WIN: "success",
  OK: "success",
  PENDING: "warning",
  PENDING_EMAIL: "neutral",
  REVIEW_PENDING: "warning",
  SUSPENDED: "warning",
  EXPIRED: "warning",
  REJECTED: "destructive",
  REVOKED: "destructive",
  LOSS: "destructive",
  BANNED: "destructive",
  INACTIVE: "neutral",
  BREAKEVEN: "neutral",
}
