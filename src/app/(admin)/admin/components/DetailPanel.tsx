"use client"

import { X } from "lucide-react"
import { cn } from "@nba/design-system"

interface DetailPanelProps {
  title: string
  severity?: "low" | "medium" | "high" | "critical"
  description: string
  evidence: string[]
  actions?: Array<{ label: string; variant?: "destructive" | "default" | "outline"; onClick: () => void }>
  onClose?: () => void
}

const SEVERITY_BADGE: Record<string, { label: string; className: string }> = {
  low: { label: "Faible", className: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  medium: { label: "Moyen", className: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  high: { label: "Haut", className: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
  critical: { label: "Critique", className: "bg-red-500/10 text-red-600 border-red-500/20" },
}

export function DetailPanel({ title, severity, description, evidence, actions, onClose }: DetailPanelProps) {
  const badge = severity ? SEVERITY_BADGE[severity] : null

  return (
    <div className="rounded-2xl border bg-card/80 p-5 shadow-sm space-y-4 detail-expand">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground">{title}</h3>
            {badge && (
              <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold border", badge.className)}>
                {badge.label}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted/50 transition-colors shrink-0 cursor-pointer" aria-label="Fermer">
            <X className="size-4" />
          </button>
        )}
      </div>

      {evidence.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Évidence</p>
          {evidence.map((e, i) => (
            <p key={i} className="text-xs font-mono text-foreground bg-muted/30 p-2 rounded-lg">{e}</p>
          ))}
        </div>
      )}

      {actions && actions.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {actions.map((action) => (
            <button
              key={action.label}
              onClick={action.onClick}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer",
                action.variant === "destructive" && "bg-red-500/10 text-red-600 hover:bg-red-500/20 border border-red-500/20",
                action.variant === "outline" && "border border-border hover:bg-muted/50 text-muted-foreground",
                (!action.variant || action.variant === "default") && "bg-primary/10 text-primary hover:bg-primary/20",
              )}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
