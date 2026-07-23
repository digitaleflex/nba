"use client"

import { cn } from "@nba/design-system"

interface NotificationBadgeProps {
  count: number
  severity: "info" | "warning" | "critical"
  className?: string
}

export function NotificationBadge({ count, severity, className }: NotificationBadgeProps) {
  if (count === 0) return null

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center size-4 rounded-full text-[9px] font-bold text-white",
        severity === "critical" && "bg-red-500 animate-pulse",
        severity === "warning" && "bg-amber-500",
        severity === "info" && "bg-blue-500",
        className
      )}
      aria-label={`${count} notification${count > 1 ? "s" : ""}`}
    >
      {count > 9 ? "9+" : count}
    </span>
  )
}
