"use client"

import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface TrendIndicatorProps {
  value: number
  direction: "up" | "down" | "stable"
  label?: string
}

export function TrendIndicator({ value, direction, label = "vs hier" }: TrendIndicatorProps) {
  if (direction === "stable") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Minus className="size-3" />
        Stable {label}
      </span>
    )
  }

  const Icon = direction === "up" ? TrendingUp : TrendingDown
  const color = direction === "up" ? "text-red-500" : "text-emerald-500"
  const sign = direction === "up" ? "+" : "-"

  return (
    <span className={`inline-flex items-center gap-1 text-xs ${color}`}>
      <Icon className="size-3" />
      {sign}{value} {label}
    </span>
  )
}
