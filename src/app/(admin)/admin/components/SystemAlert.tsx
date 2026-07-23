"use client"

import { AlertTriangle, X } from "lucide-react"
import { cn } from "@nba/design-system"

interface SystemAlertProps {
  alert: {
    id: string
    severity: "critical" | "warning"
    title: string
    description: string
    actionLabel?: string
    onAction?: () => void
  }
  onDismiss: (id: string) => void
}

export function SystemAlert({ alert, onDismiss }: SystemAlertProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex items-center justify-between gap-4 px-4 py-3 rounded-xl border animate-slide-down",
        alert.severity === "critical" && "bg-red-500/10 border-red-500/30",
        alert.severity === "warning" && "bg-amber-500/10 border-amber-500/30",
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <AlertTriangle className={cn("size-4 shrink-0", alert.severity === "critical" ? "text-red-600" : "text-amber-600")} />
        <div className="min-w-0">
          <p className={cn("text-sm font-medium", alert.severity === "critical" ? "text-red-700" : "text-amber-700")}>
            {alert.title}
          </p>
          <p className={cn("text-xs opacity-80", alert.severity === "critical" ? "text-red-600" : "text-amber-600")}>
            {alert.description}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {alert.actionLabel && alert.onAction && (
          <button
            onClick={alert.onAction}
            className={cn(
              "px-3 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer",
              alert.severity === "critical" ? "bg-red-600 text-white hover:bg-red-700" : "bg-amber-600 text-white hover:bg-amber-700",
            )}
          >
            {alert.actionLabel}
          </button>
        )}
        <button onClick={() => onDismiss(alert.id)} className="opacity-60 hover:opacity-100 transition-opacity p-1 cursor-pointer" aria-label="Fermer">
          <X className="size-4" />
        </button>
      </div>
    </div>
  )
}
