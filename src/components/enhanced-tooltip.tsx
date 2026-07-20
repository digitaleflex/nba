"use client"

import { HelpCircle } from "lucide-react"
import { Tooltip, TooltipTrigger, TooltipContent } from "@nba/design-system"

interface EnhancedTooltipProps {
  content: string
  children?: React.ReactNode
  side?: "top" | "right" | "bottom" | "left"
  /** Affiche une icône d'aide cliquable à la place de children */
  asHelpIcon?: boolean
  helpIconClassName?: string
}

/**
 * Tooltip enrichi réutilisable (A10 du plan).
 * Par défaut affiche une icône HelpCircle qui déclenche le tooltip.
 * Peut aussi envelopper un élément existant via `children`.
 */
export function EnhancedTooltip({
  content,
  children,
  side = "top",
  asHelpIcon = true,
  helpIconClassName,
}: EnhancedTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger>
        {children ?? (
          <HelpCircle
            className={helpIconClassName ?? "size-3 cursor-help text-muted-foreground/50 hover:text-muted-foreground"}
            aria-hidden="true"
          />
        )}
      </TooltipTrigger>
      <TooltipContent side={side} className="max-w-48 text-xs leading-relaxed">
        {content}
      </TooltipContent>
    </Tooltip>
  )
}
