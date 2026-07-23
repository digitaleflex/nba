"use client"

import { X, Sun, Moon, Monitor } from "lucide-react"
import { cn } from "@nba/design-system"
import type { DashboardLayout } from "../hooks/useDashboardLayout"

interface DashboardCustomizerProps {
  isOpen: boolean
  onClose: () => void
  layout: DashboardLayout
  onToggleCard: (id: string) => void
  onUpdateLayout: (partial: Partial<DashboardLayout>) => void
  onReset: () => void
}

const CARD_LABELS: Record<string, string> = {
  hero: "Hero Number",
  kpi: "KPIs",
  alerts: "Alertes",
  graph: "Graphique",
  timeline: "Timeline",
  health: "Santé système",
}

export function DashboardCustomizer({
  isOpen,
  onClose,
  layout,
  onToggleCard,
  onUpdateLayout,
  onReset,
}: DashboardCustomizerProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/20 backdrop-blur-sm animate-fade-in pt-20">
      <div className="w-full max-w-md bg-card border rounded-2xl shadow-xl animate-scale-in">
        <div className="flex items-center justify-between p-5 border-b border-border/40">
          <h2 className="font-semibold text-foreground text-sm">Personnaliser le dashboard</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" aria-label="Fermer">
            <X className="size-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Hero metric */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Métrique principale</p>
            <select
              value={layout.heroMetric}
              onChange={(e) => onUpdateLayout({ heroMetric: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border bg-background text-foreground"
            >
              <option value="alerts">Alertes actives</option>
              <option value="members">Membres actifs</option>
              <option value="signals">Signaux publiés</option>
            </select>
          </div>

          {/* Card visibility */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Cartes visibles</p>
            <div className="space-y-1">
              {layout.cards.map((card) => (
                <label
                  key={card.id}
                  className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={card.visible}
                      onChange={() => onToggleCard(card.id)}
                      className="size-4 rounded border-border accent-primary"
                    />
                    <span className="text-sm">{CARD_LABELS[card.type] || card.type}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground uppercase">{card.size}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Theme */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Thème</p>
            <div className="flex gap-2">
              {[
                { value: "auto", icon: Monitor, label: "Auto" },
                { value: "light", icon: Sun, label: "Clair" },
                { value: "dark", icon: Moon, label: "Sombre" },
              ].map(({ value, icon: Icon, label }) => (
                <button
                  key={value}
                  onClick={() => onUpdateLayout({ theme: value as "light" | "dark" | "auto" })}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer border",
                    layout.theme === value
                      ? "bg-primary/10 text-primary border-primary/30"
                      : "bg-background text-muted-foreground border-border hover:bg-muted/50",
                  )}
                >
                  <Icon className="size-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Compact mode */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Mode compact</p>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="1"
                step="1"
                value={layout.compactMode ? 1 : 0}
                onChange={(e) => onUpdateLayout({ compactMode: e.target.value === "1" })}
                className="flex-1 accent-primary"
              />
              <span className="text-xs text-muted-foreground w-8">{layout.compactMode ? "ON" : "OFF"}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-5 border-t border-border/40">
          <button
            onClick={onReset}
            className="px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            Réinitialiser
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
          >
            Appliquer
          </button>
        </div>
      </div>
    </div>
  )
}
