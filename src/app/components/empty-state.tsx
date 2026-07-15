import { cn } from "@nba/design-system"
import { SearchX, Inbox, FileX, EyeOff, MailQuestion, type LucideIcon } from "lucide-react"

interface EmptyStateProps {
  icon?: LucideIcon
  title?: string
  description?: string
  className?: string
}

const ICON_MAP: Record<string, LucideIcon> = {
  search: SearchX,
  inbox: Inbox,
  file: FileX,
  hidden: EyeOff,
  mail: MailQuestion,
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-4 select-none", className)}>
      {Icon && (
        <div className="mb-4 rounded-full bg-muted/50 p-4 ring-1 ring-border/20">
          <Icon className="size-8 text-muted-foreground/40" />
        </div>
      )}
      {title && (
        <p className="text-sm font-semibold text-foreground/70 mb-1">{title}</p>
      )}
      {description && (
        <p className="text-xs text-muted-foreground/60 text-center max-w-xs">{description}</p>
      )}
    </div>
  )
}