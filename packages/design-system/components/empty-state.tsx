"use client"

import * as React from "react"
import { cn } from "../lib/utils"
import { useMediaQuery } from "../hooks/use-media-query"
import { Button } from "./ui/button"
import { SearchX, Inbox, FileX, EyeOff, MailQuestion, type LucideIcon } from "lucide-react"

const ICON_MAP: Record<string, LucideIcon> = {
  search: SearchX,
  inbox: Inbox,
  file: FileX,
  hidden: EyeOff,
  mail: MailQuestion,
}

export interface EmptyStateAction {
  label: string
  onClick: () => void
  icon?: LucideIcon
}

interface EmptyStateProps {
  icon?: LucideIcon | string
  title?: string
  description?: string
  /** Primary CTA shown as a full-width button on mobile, inline on desktop. */
  action?: EmptyStateAction
  /** Keyboard shortcut hint (e.g. "N"). Displayed as a <kbd> and, when
   *  provided, the empty state listens for that key to trigger `action.onClick`. */
  shortcut?: string
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  shortcut,
  className,
}: EmptyStateProps) {
  const isMobile = useMediaQuery("(max-width: 767px)")
  const Icon = typeof icon === "string" ? ICON_MAP[icon] : icon

  // Keyboard shortcut → trigger action. The listener is attached whenever a
  // shortcut is declared so the key is never silently dead; when no action is
  // provided (e.g. no active filter) pressing the key is a harmless no-op.
  React.useEffect(() => {
    if (!shortcut) return
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return
      if (e.key.toLowerCase() === shortcut.toLowerCase()) {
        e.preventDefault()
        action?.onClick()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [shortcut, action])

  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-4 select-none text-center", className)}>
      {Icon && (
        <div className="mb-4 rounded-full bg-muted/50 p-4 ring-1 ring-border/20">
          <Icon className="size-8 text-muted-foreground/40" />
        </div>
      )}
      {title && <p className="text-sm font-semibold text-foreground/70 mb-1">{title}</p>}
      {description && (
        <p className="text-xs text-muted-foreground/60 text-center max-w-xs mb-4">{description}</p>
      )}

      {action && (
        <div className={cn("flex items-center gap-2", isMobile ? "w-full flex-col" : "flex-row")}>
          <Button
            onClick={action.onClick}
            className={cn("gap-1.5", isMobile && "w-full")}
            size="sm"
          >
            {action.icon && <action.icon className="size-3.5" />}
            {action.label}
          </Button>
          {shortcut && (
            <kbd className="rounded border border-border bg-muted/60 px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
              {shortcut}
            </kbd>
          )}
        </div>
      )}
    </div>
  )
}
