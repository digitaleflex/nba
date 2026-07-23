"use client"

import { cn } from "@nba/design-system"

interface SeverityBadgeProps {
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO"
  className?: string
}

const severityStyles = {
  CRITICAL: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  HIGH: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  MEDIUM: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  LOW: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  INFO: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
}

export function SeverityBadge({ severity, className }: SeverityBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold",
        severityStyles[severity],
        severity === "CRITICAL" && "animate-pulse",
        className,
      )}
    >
      {severity}
    </span>
  )
}
