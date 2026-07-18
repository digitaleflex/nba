"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Button, Tooltip, TooltipTrigger, TooltipContent } from "@nba/design-system"
import { TrendingUp, ArrowRight, Check, HelpCircle, Loader2 } from "lucide-react"

interface Plan {
  id: string
  name: string
  description: string | null
  sortOrder: number
}

interface StepServiceProps {
  plans: Plan[]
  selectedPlan: string | null
  onSelectPlan: (id: string | null) => void
  onNext: () => void
}

export function StepService({ plans, selectedPlan, onSelectPlan, onNext }: StepServiceProps) {
  const currentPlan = plans.find((p) => p.id === selectedPlan)
  const loading = plans.length === 0

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground text-center">
        Choisissez le service auquel vous souhaitez accéder
      </p>
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">Service</label>
        <Select value={selectedPlan ?? ""} onValueChange={onSelectPlan}>
          <SelectTrigger className="w-full h-10 bg-background">
            <SelectValue placeholder={loading ? "Chargement…" : "Sélectionnez un service"}>
              {currentPlan ? currentPlan.name : undefined}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {plans.sort((a, b) => a.sortOrder - b.sortOrder).map((plan) => (
              <SelectItem key={plan.id} value={plan.id}>
                <span className="flex items-center gap-2">
                  {plan.name}
                  {plan.description && (
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="size-3.5 text-muted-foreground/70 hover:text-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>{plan.description}</TooltipContent>
                    </Tooltip>
                  )}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {loading && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" /> Chargement des services…
          </p>
        )}
        {selectedPlan && currentPlan && (
          <div className="flex items-center gap-2 rounded-lg bg-primary/5 px-3 py-2.5 text-sm ring-1 ring-primary/10">
            <div className="flex size-7 items-center justify-center rounded-md bg-primary/10">
              <TrendingUp className="size-3.5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Service sélectionné</p>
              <p className="font-medium text-foreground">{currentPlan.name}</p>
              {currentPlan.description && (
                <p className="text-xs text-muted-foreground/80 mt-0.5">{currentPlan.description}</p>
              )}
            </div>
            <Check className="size-4 text-primary" />
          </div>
        )}
      </div>
      <Button
        type="button"
        className="w-full h-9"
        disabled={!selectedPlan || loading}
        onClick={onNext}
      >
        Continuer <ArrowRight className="size-4" />
      </Button>
    </div>
  )
}
