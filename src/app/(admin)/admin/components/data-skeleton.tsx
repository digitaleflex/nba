"use client"

import { type ComponentProps } from "react"
import { cn } from "@nba/design-system"
import { Skeleton } from "@nba/design-system"

interface DataSkeletonProps extends ComponentProps<"div"> {
  variant?: "card-grid" | "table" | "timeline" | "detail-panel" | "single-card"
  count?: number
}

function CardGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" role="status" aria-label="Chargement des données">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-2">
          <Skeleton variant="shimmer" className="h-4 w-20" />
          <Skeleton variant="shimmer" className="h-8 w-16" />
          <Skeleton variant="shimmer" className="h-3 w-12" />
        </div>
      ))}
    </div>
  )
}

function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden" role="status" aria-label="Chargement du tableau">
      <div className="border-b border-border bg-muted/30 px-4 py-3 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} variant="shimmer" className="h-3.5 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="border-b border-border/50 px-4 py-3 flex gap-4">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} variant="shimmer" className={`h-3.5 ${c === 0 ? "w-1/4" : "flex-1"}`} />
          ))}
        </div>
      ))}
    </div>
  )
}

function TimelineSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Chargement de la timeline">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <div className="flex flex-col items-center gap-1">
            <Skeleton variant="shimmer" className="size-8 rounded-full" />
            <div className="w-px flex-1 bg-muted/30" />
          </div>
          <div className="flex-1 space-y-2 pb-6">
            <Skeleton variant="shimmer" className="h-4 w-48" />
            <Skeleton variant="shimmer" className="h-3 w-32" />
            <Skeleton variant="shimmer" className="h-12 w-full rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  )
}

function DetailPanelSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-label="Chargement du panneau">
      <Skeleton variant="shimmer" className="h-6 w-40" />
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton variant="shimmer" className="size-8 rounded-lg" />
            <div className="flex-1 space-y-1.5">
              <Skeleton variant="shimmer" className="h-3 w-1/3" />
              <Skeleton variant="shimmer" className="h-3.5 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SingleCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border border-border bg-card p-5 space-y-3", className)} role="status" aria-label="Chargement">
      <Skeleton variant="shimmer" className="h-4 w-24" />
      <Skeleton variant="shimmer" className="h-8 w-16" />
      <Skeleton variant="shimmer" className="h-3 w-32" />
    </div>
  )
}

export function DataSkeleton({ variant = "card-grid", count, className, ...props }: DataSkeletonProps) {
  switch (variant) {
    case "card-grid":
      return <CardGridSkeleton count={count} />
    case "table":
      return <TableSkeleton rows={count} />
    case "timeline":
      return <TimelineSkeleton />
    case "detail-panel":
      return <DetailPanelSkeleton />
    case "single-card":
      return <SingleCardSkeleton className={className} />
    default:
      return <CardGridSkeleton count={count} />
  }
}
