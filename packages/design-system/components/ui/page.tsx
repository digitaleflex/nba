import { cn } from "../../lib/utils"
import type { BreadcrumbSegment } from "./breadcrumbs"
import { Breadcrumbs } from "./breadcrumbs"

export interface PageProps {
  children: React.ReactNode
  className?: string
  /** Largeur max du conteneur (défaut : 7xl). */
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "4xl" | "6xl" | "7xl" | "full"
  /** Espacement vertical entre les sections (défaut : 6). */
  gap?: 2 | 4 | 6 | 8
}

const MAX_WIDTH: Record<NonNullable<PageProps["maxWidth"]>, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "4xl": "max-w-4xl",
  "6xl": "max-w-6xl",
  "7xl": "max-w-7xl",
  full: "max-w-full",
}

const GAP: Record<NonNullable<PageProps["gap"]>, string> = {
  2: "space-y-2",
  4: "space-y-4",
  6: "space-y-6",
  8: "space-y-8",
}

export function Page({ children, className, maxWidth = "7xl", gap = 6 }: PageProps) {
  return (
    <div className={cn("mx-auto w-full px-4 sm:px-6 lg:px-8", MAX_WIDTH[maxWidth], GAP[gap], className)}>
      {children}
    </div>
  )
}

export interface PageHeaderProps {
  title: string
  description?: string
  breadcrumbs?: BreadcrumbSegment[]
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({ title, description, breadcrumbs, actions, className }: PageHeaderProps) {
  return (
    <header className={cn("flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between", className)}>
      <div className="min-w-0 space-y-1">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <Breadcrumbs segments={breadcrumbs} className="mb-1" />
        )}
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  )
}
