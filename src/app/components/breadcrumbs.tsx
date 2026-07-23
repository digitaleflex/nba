"use client"

import { usePathname } from "next/navigation"
import { Breadcrumbs as BreadcrumbsUI } from "@nba/design-system"
import { pathToSegments } from "@nba/app/lib/breadcrumb-labels"

export function PageBreadcrumbs() {
  const pathname = usePathname()
  const segments = pathToSegments(pathname)

  if (segments.length === 0) return null

  return (
    <BreadcrumbsUI segments={segments} className="px-6 py-2 border-b border-border/30 hidden md:flex" />
  )
}
