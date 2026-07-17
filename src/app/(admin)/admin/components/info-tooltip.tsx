"use client"

import type { ReactNode } from "react"
import { HelpCircle, Info } from "lucide-react"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@nba/design-system"

type Side = "top" | "bottom" | "left" | "right"

/**
 * Icône "?" interactive qui explique un concept au survol.
 * À placer à côté d'un libellé technique (ex: "Échecs de livraison").
 */
export function InfoTooltip({
  content,
  side = "top",
  icon = "help",
}: {
  content: ReactNode
  side?: Side
  icon?: "help" | "info"
}) {
  const Icon = icon === "info" ? Info : HelpCircle
  return (
    <TooltipProvider delay={100}>
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              type="button"
              aria-label="Explication"
              title={typeof content === "string" ? content : undefined}
              className="inline-flex items-center text-muted-foreground/70 hover:text-foreground transition-colors align-middle"
            />
          }
        >
          <Icon className="size-3.5" />
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-[260px] leading-relaxed text-left">
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

/**
 * Met en évidence un terme technique et l'explique au survol (style wiki).
 * Ex: <Term tip="...">Taux de délivrance</Term>
 */
export function Term({
  children,
  tip,
  side = "top",
}: {
  children: ReactNode
  tip: ReactNode
  side?: Side
}) {
  return (
    <TooltipProvider delay={100}>
      <Tooltip>
        <TooltipTrigger
          render={
            <span
              className="underline decoration-dotted decoration-muted-foreground/40 underline-offset-2 cursor-help text-foreground"
              title={typeof tip === "string" ? tip : undefined}
            />
          }
        >
          {children}
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-[260px] leading-relaxed text-left">
          {tip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
