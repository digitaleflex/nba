"use client"

import { Loader2, Check } from "lucide-react"
import { Card, CardContent, Checkbox, Badge, Input, cn } from "@nba/design-system"

interface Plan {
  id: string
  name: string
  _count?: { users?: number; accessRequests?: number }
}

interface StepAudienceProps {
  plans: Plan[]
  selectedPlans: string[]
  togglePlan: (id: string) => void
  search: string
  setSearch: (v: string) => void
  estimation: { total: number; overrideCount: number; breakdown: { planId: string; name: string; count: number }[] } | null
  isEstimating: boolean
}

export function StepAudience({
  plans,
  selectedPlans,
  togglePlan,
  search,
  setSearch,
  estimation,
  isEstimating,
}: StepAudienceProps) {
  const filtered = plans.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Groupes de diffusion</label>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un groupe..."
          className="h-9 text-xs"
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => plans.forEach((p) => { if (!selectedPlans.includes(p.id)) togglePlan(p.id) })}
          disabled={selectedPlans.length === plans.length}
          className="text-[10px] px-2.5 py-1 rounded-full border border-border text-muted-foreground hover:bg-muted/50 disabled:opacity-40"
        >
          Tout
        </button>
        <button
          type="button"
          onClick={() => selectedPlans.forEach((id) => togglePlan(id))}
          disabled={selectedPlans.length === 0}
          className="text-[10px] px-2.5 py-1 rounded-full border border-border text-muted-foreground hover:bg-muted/50 disabled:opacity-40"
        >
          Aucun
        </button>
      </div>

      <div className="grid gap-2">
        {filtered.length === 0 ? (
          <div className="text-center py-4 text-xs text-muted-foreground">Aucun groupe trouvé.</div>
        ) : (
          filtered.map((plan) => {
            const isSelected = selectedPlans.includes(plan.id)
            return (
              <div
                key={plan.id}
                onClick={() => togglePlan(plan.id)}
                role="checkbox"
                aria-checked={isSelected}
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); togglePlan(plan.id) } }}
                className={cn(
                  "cursor-pointer text-xs p-3 rounded-xl border transition-all duration-200 flex items-center justify-between select-none",
                  isSelected
                    ? "border-primary/30 bg-primary/5 text-foreground font-semibold shadow-xs"
                    : "border-border hover:bg-muted/30 text-muted-foreground"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Checkbox checked={isSelected} onCheckedChange={() => {}} />
                  <span>{plan.name}</span>
                </div>
                <Badge variant="outline" className="text-[9px] font-normal border-border/80 bg-background/50">
                  {(() => {
                    const count = plan._count?.accessRequests ?? plan._count?.users
                    return count !== undefined ? `${count} membre${count > 1 ? "s" : ""}` : "— membres"
                  })()}
                </Badge>
              </div>
            )
          })
        )}
      </div>

      {selectedPlans.length > 0 && (
        <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Destinataires prévus</span>
            {estimation ? (
              <span className="font-bold text-primary text-sm">{estimation.total} membre{estimation.total > 1 ? "s" : ""}</span>
            ) : (
              <Loader2 className="size-3 animate-spin text-muted-foreground" />
            )}
          </div>
          {estimation && (
            <div className="space-y-0.5 text-muted-foreground">
              {estimation.breakdown.map((b) => (
                <div key={b.planId} className="flex justify-between">
                  <span className="truncate pr-2">{b.name}</span>
                  <span className="font-medium text-foreground">{b.count}</span>
                </div>
              ))}
              {estimation.overrideCount > 0 && (
                <div className="flex justify-between">
                  <span>Accès global (override)</span>
                  <span className="font-medium text-foreground">{estimation.overrideCount}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
