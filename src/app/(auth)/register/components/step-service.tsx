"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Button } from "@nba/design-system"
import { TrendingUp, ArrowRight, Check } from "lucide-react"

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

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground text-center">
        Choisissez le service auquel vous souhaitez accéder
      </p>
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">Service</label>
        <Select value={selectedPlan ?? ""} onValueChange={onSelectPlan}>
          <SelectTrigger className="w-full h-10 bg-background">
            <SelectValue placeholder="Sélectionnez un service">
              {currentPlan ? currentPlan.name : undefined}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {plans.sort((a, b) => a.sortOrder - b.sortOrder).map((plan) => (
              <SelectItem key={plan.id} value={plan.id}>
                {plan.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedPlan && currentPlan && (
          <div className="flex items-center gap-2 rounded-lg bg-primary/5 px-3 py-2.5 text-sm ring-1 ring-primary/10">
            <div className="flex size-7 items-center justify-center rounded-md bg-primary/10">
              <TrendingUp className="size-3.5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Service sélectionné</p>
              <p className="font-medium text-foreground">{currentPlan.name}</p>
            </div>
            <Check className="size-4 text-primary" />
          </div>
        )}
      </div>
      <Button
        type="button"
        className="w-full h-9"
        disabled={!selectedPlan}
        onClick={onNext}
      >
        Continuer <ArrowRight className="size-4" />
      </Button>
    </div>
  )
}
