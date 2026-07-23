"use client"

import { X } from "lucide-react"
import { cn } from "@nba/design-system"

interface TimelineEvent {
  action: string
  timestamp: string
  details: string
}

interface EvidenceModalProps {
  open: boolean
  onClose: () => void
  title: string
  timeline?: TimelineEvent[]
  rawLogs?: Record<string, unknown>
}

export function EvidenceModal({ open, onClose, title, timeline, rawLogs }: EvidenceModalProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-label={`Preuve complète — ${title}`}
    >
      <div className="w-full max-w-2xl bg-card border rounded-2xl shadow-xl animate-scale-in max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-border/40">
          <h2 className="font-semibold text-foreground text-sm">Preuve complète — {title}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" aria-label="Fermer">
            <X className="size-4" />
          </button>
        </div>

        <div className="p-5 space-y-5 overflow-y-auto">
          {timeline && timeline.length > 0 && (
            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Timeline</p>
              {timeline.map((event, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{event.action}</p>
                    <p className="text-xs text-muted-foreground">{event.timestamp}</p>
                    <p className="text-xs font-mono text-foreground mt-0.5">{event.details}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {rawLogs && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Logs bruts</p>
              <pre className="text-xs font-mono bg-muted/50 p-4 rounded-xl overflow-auto max-h-64 text-foreground">
                {JSON.stringify(rawLogs, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
