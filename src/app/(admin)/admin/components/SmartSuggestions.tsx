"use client"

import { useState, useEffect, useCallback } from "react"
import { Lightbulb, X, AlertTriangle, Info, ArrowRight } from "lucide-react"
import { cn } from "@nba/design-system"
import type { Suggestion } from "../lib/suggestion-rules"
import { evaluateSuggestions } from "../lib/suggestion-rules"

interface SmartSuggestionsProps {
  events?: Array<{
    type: string
    userId: string
    ipAddress: string | null
    createdAt: string
    severity: string
    user?: { name: string; email: string } | null
    details?: Record<string, unknown>
  }>
}

const TYPE_STYLES: Record<string, { icon: any; bg: string; border: string }> = {
  action: { icon: AlertTriangle, bg: "bg-red-500/5", border: "border-red-500/20" },
  warning: { icon: AlertTriangle, bg: "bg-amber-500/5", border: "border-amber-500/20" },
  info: { icon: Info, bg: "bg-blue-500/5", border: "border-blue-500/20" },
}

export function SmartSuggestions({ events = [] }: SmartSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  useEffect(() => {
    const results = evaluateSuggestions(events)
    setSuggestions(results)
  }, [events])

  const dismissAll = useCallback(() => {
    setDismissed(new Set(suggestions.map((s) => s.id)))
  }, [suggestions])

  const dismiss = useCallback((id: string) => {
    setDismissed((prev) => new Set([...prev, id]))
  }, [])

  const visible = suggestions.filter((s) => !dismissed.has(s.id))

  if (visible.length === 0) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
          <Lightbulb className="size-3" />
          Actions suggérées
        </h3>
        <button
          onClick={dismissAll}
          className="text-[10px] text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors cursor-pointer"
        >
          Tout marquer comme lu
        </button>
      </div>

      <div className="space-y-2">
        {visible.map((suggestion, index) => {
          const styles = TYPE_STYLES[suggestion.type]
          const Icon = styles.icon
          return (
            <div
              key={suggestion.id}
              className={cn(
                "rounded-xl border p-4 space-y-3 transition-all duration-300",
                styles.bg,
                styles.border,
                "animate-slide-up",
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start gap-3">
                <Icon className={cn(
                  "size-4 shrink-0 mt-0.5",
                  suggestion.type === "action" && "text-red-500",
                  suggestion.type === "warning" && "text-amber-500",
                  suggestion.type === "info" && "text-blue-500",
                )} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{suggestion.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{suggestion.description}</p>
                </div>
                {suggestion.dismissible && (
                  <button
                    onClick={() => dismiss(suggestion.id)}
                    className="p-1 rounded-md hover:bg-muted/50 transition-colors shrink-0 cursor-pointer"
                    aria-label="Ignorer"
                  >
                    <X className="size-3.5 text-muted-foreground" />
                  </button>
                )}
              </div>

              {suggestion.evidence.length > 0 && (
                <div className="space-y-1 pl-7">
                  {suggestion.evidence.map((e, i) => (
                    <p key={i} className="text-xs text-muted-foreground font-mono">• {e}</p>
                  ))}
                </div>
              )}

              {suggestion.actions.length > 0 && (
                <div className="flex flex-wrap gap-2 pl-7">
                  {suggestion.actions.map((action) => (
                    <button
                      key={action.label}
                      onClick={() => action.onClick()}
                      className={cn(
                        "px-3 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer",
                        action.variant === "destructive" && "bg-red-500/10 text-red-600 hover:bg-red-500/20",
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
        })}
      </div>
    </div>
  )
}
