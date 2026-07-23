"use client"

import { Check } from "lucide-react"

interface WizardStep {
  label: string
  icon?: React.ReactNode
}

interface WizardStepperProps {
  steps: WizardStep[]
  currentStep: number
  onStepClick?: (step: number) => void
}

export function WizardStepper({ steps, currentStep, onStepClick }: WizardStepperProps) {
  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2">
      {steps.map((step, i) => {
        const isCompleted = i < currentStep
        const isActive = i === currentStep
        const isFuture = i > currentStep
        const isClickable = isCompleted && onStepClick

        return (
          <div key={step.label} className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              disabled={!isClickable}
              onClick={() => isClickable && onStepClick(i)}
              className={`flex size-7 sm:size-8 shrink-0 items-center justify-center rounded-full text-xs font-medium transition-all duration-300 ${
                isCompleted
                  ? "bg-primary text-primary-foreground scale-100"
                  : isActive
                    ? "bg-primary/10 text-primary ring-1 ring-primary/30 scale-110"
                    : "bg-muted text-muted-foreground"
              } ${isClickable ? "cursor-pointer hover:ring-2 hover:ring-primary/40" : "cursor-default"}`}
            >
              {isCompleted ? (
                <Check className="size-3 sm:size-4 transition-all duration-300 scale-100" />
              ) : step.icon ? (
                step.icon
              ) : (
                i + 1
              )}
            </button>
            <span
              className={`text-[10px] sm:text-xs transition-colors duration-200 ${
                isActive ? "font-medium text-foreground" : "text-muted-foreground"
              } ${isFuture ? "hidden sm:inline" : ""}`}
            >
              {step.label}
            </span>
            {i < steps.length - 1 && (
              <div
                className={`mx-0.5 sm:mx-1 h-px w-4 sm:w-8 transition-colors duration-300 ${
                  i < currentStep ? "bg-primary" : "bg-border"
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
