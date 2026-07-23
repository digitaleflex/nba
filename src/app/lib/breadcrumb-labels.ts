import type { BreadcrumbSegment } from "@nba/design-system"

export type PathPattern = string | RegExp

export interface PathMapping {
  pattern: PathPattern
  segments: (match: RegExpExecArray | null) => BreadcrumbSegment[]
}

const PATH_MAPPINGS: PathMapping[] = [
  {
    pattern: /^\/dashboard\/signals\/(.+)$/,
    segments: (m) => [
      { label: "Tableau de bord", href: "/dashboard" },
      { label: "Signaux", href: "/dashboard/signals" },
      { label: m?.[1] ?? "Signal" },
    ],
  },
  {
    pattern: /^\/dashboard\/signals$/,
    segments: () => [
      { label: "Tableau de bord", href: "/dashboard" },
      { label: "Signaux" },
    ],
  },
  {
    pattern: /^\/dashboard\/profile$/,
    segments: () => [
      { label: "Tableau de bord", href: "/dashboard" },
      { label: "Profil" },
    ],
  },
  {
    pattern: /^\/dashboard\/notifications$/,
    segments: () => [
      { label: "Tableau de bord", href: "/dashboard" },
      { label: "Notifications" },
    ],
  },
  {
    pattern: /^\/dashboard\/onboarding$/,
    segments: () => [
      { label: "Onboarding" },
    ],
  },
  {
    pattern: /^\/dashboard$/,
    segments: () => [
      { label: "Tableau de bord" },
    ],
  },
  {
    pattern: /^\/admin\/tracker$/,
    segments: () => [
      { label: "Console Admin", href: "/admin" },
      { label: "Tracker" },
    ],
  },
  {
    pattern: /^\/admin\/control-room$/,
    segments: () => [
      { label: "Console Admin", href: "/admin" },
      { label: "Control Room" },
    ],
  },
  {
    pattern: /^\/admin\/messages$/,
    segments: () => [
      { label: "Console Admin", href: "/admin" },
      { label: "Messages" },
    ],
  },
  {
    pattern: /^\/admin\/support$/,
    segments: () => [
      { label: "Console Admin", href: "/admin" },
      { label: "Support" },
    ],
  },
  {
    pattern: /^\/admin\/webhooks$/,
    segments: () => [
      { label: "Console Admin", href: "/admin" },
      { label: "Webhooks" },
    ],
  },
  {
    pattern: /^\/admin$/,
    segments: () => [
      { label: "Console Admin" },
    ],
  },
  {
    pattern: /^\/admin\/?$/,
    segments: () => [
      { label: "Console Admin" },
    ],
  },
]

export function pathToSegments(pathname: string): BreadcrumbSegment[] {
  for (const mapping of PATH_MAPPINGS) {
    const match = mapping.pattern.exec(pathname)
    if (match) {
      return mapping.segments(match)
    }
  }
  return []
}
