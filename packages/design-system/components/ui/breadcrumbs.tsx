import { ChevronRight, Home } from "lucide-react"
import { cn } from "../../lib/utils"

export interface BreadcrumbSegment {
  label: string
  href?: string
}

interface BreadcrumbsProps {
  segments: BreadcrumbSegment[]
  className?: string
  showHome?: boolean
  separator?: React.ReactNode
}

export function Breadcrumbs({
  segments,
  className,
  showHome = false,
  separator = <ChevronRight className="size-3 text-muted-foreground/40" />,
}: BreadcrumbsProps) {
  if (segments.length === 0) return null

  return (
    <nav aria-label="Fil d'Ariane" className={cn("flex items-center gap-1 text-xs", className)}>
      {showHome && (
        <>
          <Home className="size-3 text-muted-foreground/50" />
          <span className="text-muted-foreground/40">{separator}</span>
        </>
      )}
      {segments.map((segment, index) => {
        const isLast = index === segments.length - 1
        return (
          <span key={segment.label + index} className="flex items-center gap-1">
            {segment.href && !isLast ? (
              <a
                href={segment.href}
                className="text-muted-foreground/70 hover:text-foreground transition-colors underline-offset-2 hover:underline"
              >
                {segment.label}
              </a>
            ) : (
              <span className={cn(isLast ? "text-foreground font-medium" : "text-muted-foreground/70")}>
                {segment.label}
              </span>
            )}
            {!isLast && <span className="text-muted-foreground/40">{separator}</span>}
          </span>
        )
      })}
    </nav>
  )
}
