"use client"

import { useState } from "react"
import { cn } from "@nba/design-system"

interface ProgressiveDetailProps {
  level: 1 | 2 | 3 | 4
  children: React.ReactNode
  expandable?: boolean
  onExpand?: () => void
  className?: string
}

export function ProgressiveDetail({
  level,
  children,
  expandable = true,
  onExpand,
  className,
}: ProgressiveDetailProps) {
  const [expanded, setExpanded] = useState(false)

  const handleClick = () => {
    if (!expandable) return
    setExpanded(!expanded)
    onExpand?.()
  }

  return (
    <div
      className={cn(
        "transition-all duration-300 ease-out overflow-hidden",
        level === 1 && "opacity-90",
        level === 2 && "opacity-100",
        level === 3 && "rounded-2xl border bg-card/80 p-4 shadow-sm",
        level === 4 && "rounded-2xl border-2 bg-card p-6 shadow-lg",
        expandable && "cursor-pointer",
        className
      )}
      onClick={handleClick}
      role="button"
      tabIndex={expandable ? 0 : undefined}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleClick() }}
      aria-expanded={expanded}
    >
      {children}
    </div>
  )
}
