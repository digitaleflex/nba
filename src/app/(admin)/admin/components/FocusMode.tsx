"use client"

import { ArrowLeft, AlertTriangle, ChevronRight } from "lucide-react"
import { cn } from "@nba/design-system"
import { ResolutionChecklist } from "./ResolutionChecklist"

interface AlertData {
  id: string
  type: string
  severity: "HIGH" | "CRITICAL"
  title: string
  description: string
  evidence: string[]
  suggestedActions: Array<{ label: string; onClick: () => void }>
  relatedData?: {
    user?: { name: string; email: string }
    ip?: string
  }
  timeline?: Array<{ time: string; action: string; detail: string }>
}

interface FocusModeProps {
  alert: AlertData
  currentIndex: number
  totalAlerts: number
  onClose: () => void
  onNext?: () => void
  onPrev?: () => void
}

export function FocusMode({
  alert,
  currentIndex,
  totalAlerts,
  onClose,
  onNext,
  onPrev,
}: FocusModeProps) {
  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm animate-fade-in">
      <div className="max-w-3xl mx-auto p-4 md:p-8 h-full flex flex-col focus-content">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <ArrowLeft className="size-4" />
            Retour au dashboard
          </button>
          <span className="text-xs text-muted-foreground tabular-nums">
            {currentIndex + 1}/{totalAlerts} alertes
          </span>
        </div>

        {/* Title */}
        <div className="flex items-center gap-3 mb-6">
          <span className={cn(
            "px-2 py-1 rounded text-[10px] font-bold",
            alert.severity === "CRITICAL" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700",
          )}>
            {alert.severity}
          </span>
          <h2 className="text-xl font-bold text-foreground">{alert.title}</h2>
        </div>

        {/* Content grid */}
        <div className="flex-1 overflow-y-auto space-y-5">
          {/* User card */}
          {alert.relatedData?.user && (
            <div className="rounded-2xl border bg-card p-4 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Utilisateur</p>
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                  {alert.relatedData.user.name?.slice(0, 2).toUpperCase() || alert.relatedData.user.email?.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-foreground">{alert.relatedData.user.name || alert.relatedData.user.email}</p>
                  {alert.relatedData.ip && (
                    <p className="text-xs text-muted-foreground font-mono">IP: {alert.relatedData.ip}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Timeline */}
          {alert.timeline && alert.timeline.length > 0 && (
            <div className="rounded-2xl border bg-card p-4 space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Activité suspecte</p>
              <div className="space-y-2">
                {alert.timeline.map((event, i) => (
                  <div key={i} className="flex items-start gap-3 text-xs">
                    <span className="size-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                    <div className="min-w-0">
                      <span className="font-mono text-muted-foreground">{event.time}</span>
                      <span className="ml-2 text-foreground">{event.action}</span>
                      <p className="text-muted-foreground font-mono text-[10px]">{event.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggested actions */}
          <div className="rounded-2xl border bg-card p-4 space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Actions suggérées</p>
            <div className="space-y-2">
              {alert.suggestedActions.map((action, i) => (
                <button
                  key={i}
                  onClick={action.onClick}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <span className="text-sm font-medium text-foreground">{action.label}</span>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>

          {/* Checklist */}
          <div className="rounded-2xl border bg-card p-4 space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Checklist de résolution</p>
            <ResolutionChecklist
              items={[
                { id: "ips", label: "IPs bloquées" },
                { id: "suspend", label: "Compte suspendu" },
                { id: "2fa", label: "2FA forcée" },
                { id: "notify", label: "Utilisateur notifié" },
                { id: "admin", label: "Admin notifié" },
              ]}
            />
          </div>

          {/* Next alert */}
          {onNext && totalAlerts > 1 && (
            <button
              onClick={onNext}
              className="w-full flex items-center justify-between p-4 rounded-2xl border-2 border-dashed border-border hover:bg-muted/30 transition-colors cursor-pointer"
            >
              <span className="text-sm text-muted-foreground">
                Alerte suivante ({totalAlerts - currentIndex - 1} restante{totalAlerts - currentIndex - 1 > 1 ? "s" : ""})
              </span>
              <ChevronRight className="size-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
