"use client"

import type { ComponentType, ReactNode } from "react"
import { Card, CardContent, Skeleton, cn } from "@nba/design-system"

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

/** Titre de section standard (remplace les SectionTitle locaux). */
export function SectionTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h3 className={cn("text-xs font-bold uppercase tracking-wider text-muted-foreground pb-4 border-b border-border/40", className)}>
      {children}
    </h3>
  )
}

interface StatCardProps {
  icon: ComponentType<{ className?: string }>
  label: string
  value: ReactNode
  /** Ligne secondaire sous la valeur (ex : « +12 % vs mois dernier »). */
  sub?: ReactNode
  /** Colore la valeur selon un ton sémantique. */
  tone?: Tone
  className?: string
}

/** Carte KPI unique pour toute l'admin — remplace les 5 StatCard/KpiCard locaux. */
export function StatCard({ icon: Icon, label, value, sub, tone, className }: StatCardProps) {
  const valueTone =
    tone === "success" ? "text-success"
    : tone === "destructive" ? "text-destructive"
    : tone === "warning" ? "text-warning-foreground"
    : tone === "info" ? "text-primary"
    : "text-foreground"
  return (
    <Card className={cn("border-border/60 bg-card shadow-sm", className)}>
      <CardContent className="p-4 flex items-center justify-between">
        <div className="space-y-0.5 min-w-0">
          <p className="text-xs uppercase font-bold text-muted-foreground tracking-widest truncate">{label}</p>
          <p className={cn("text-xl font-bold tabular-nums", valueTone)}>{value}</p>
          {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
        </div>
        <Icon className="size-5 text-muted-foreground/40 shrink-0 ml-2" />
      </CardContent>
    </Card>
  )
}

/** État de chargement standard des onglets — squelette au lieu du spinner abstrait. */
export function TabLoading({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-4" role="status" aria-label="Chargement…">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={`r${i}`} className="h-14 rounded-xl" />
      ))}
    </div>
  )
}
