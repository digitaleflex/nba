"use client"

import { cn } from "@nba/design-system"
import { Check } from "lucide-react"

export interface Step {
  id: string
  label: string
  href: string
}

export function StepIndicator({
  steps,
  currentStepId,
  progress,
}: {
  steps: Step[]
  currentStepId: string
  progress: number
}) {
  const currentIndex = steps.findIndex((s) => s.id === currentStepId)

  return (
    <div className="w-full space-y-3" role="navigation" aria-label="Progression de l'onboarding">
      <div className="flex items-center justify-between">
        {steps.map((step, i) => {
          const isCompleted = i < currentIndex
          const isCurrent = i === currentIndex
          const isUpcoming = i > currentIndex

          return (
            <div key={step.id} className="flex items-center gap-2 min-w-0">
              <div
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all duration-300",
                  isCompleted && "bg-success text-success-foreground",
                  isCurrent && "bg-primary text-primary-foreground ring-2 ring-primary/30",
                  isUpcoming && "bg-muted text-muted-foreground",
                )}
              >
                {isCompleted ? <Check className="size-3.5" /> : i + 1}
              </div>
              <span
                className={cn(
                  "text-xs font-medium truncate hidden sm:inline transition-colors",
                  isCurrent && "text-foreground",
                  isCompleted && "text-muted-foreground",
                  isUpcoming && "text-muted-foreground/50",
                )}
              >
                {step.label}
              </span>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    "hidden sm:block h-px w-8 mx-1 transition-colors",
                    isCompleted ? "bg-success/50" : "bg-border",
                  )}
                />
              )}
            </div>
          )
        })}
      </div>

      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Progression : ${progress}%`}
        />
      </div>
    </div>
  )
}
