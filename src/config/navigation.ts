import type { LucideIcon } from "lucide-react"
import {
  Activity,
  BarChart2,
  Bell,
  BookOpen,
  CreditCard,
  FileCheck,
  Gavel,
  Gauge,
  LayoutDashboard,
  LineChart,
  Link2,
  ListTodo,
  Mail,
  MessageCircle,
  Radio,
  Settings,
  Shield,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react"
import { ADMIN_CONTEXTS, getContextForTab } from "@nba/app/(admin)/admin/admin-context"

export type NavSpace = "dashboard" | "admin"
export type UserRole = "ADMIN" | "SUPER_ADMIN" | "USER" | string

export interface NavItem {
  id: string
  href: string
  label: string
  icon: LucideIcon
  /** Rôles requis pour afficher l'item. Si vide, visible par tous. */
  requiredRoles?: UserRole[]
  /** Clé de badge à afficher (géré par les composants consommateurs). */
  badge?: "messages" | "pendingKyc" | "pendingRequests"
  /** Fonction personnalisée pour déterminer si l'item est actif. */
  isActive?: (pathname: string, searchParams: URLSearchParams) => boolean
  /** Identifiant de section pour le regroupement (sidebar/menu). */
  section?: string
}

export interface NavSection {
  id: string
  label: string
  items: NavItem[]
  badge?: number
}

const dashboardMobile: NavItem[] = [
  {
    id: "dashboard",
    href: "/dashboard",
    label: "Tableau",
    icon: LayoutDashboard,
    isActive: (pathname) => pathname === "/dashboard",
  },
  {
    id: "signals",
    href: "/dashboard/signals",
    label: "Signaux",
    icon: TrendingUp,
    isActive: (pathname) =>
      pathname.startsWith("/dashboard/signals") || pathname.startsWith("/signals"),
  },
  {
    id: "journal",
    href: "/dashboard/journal",
    label: "Journal",
    icon: BookOpen,
    isActive: (pathname) => pathname.startsWith("/dashboard/journal"),
  },
  {
    id: "verification",
    href: "/dashboard/verification",
    label: "Onboarding",
    icon: Shield,
    isActive: (pathname) =>
      pathname.startsWith("/dashboard/verification") || pathname.startsWith("/onboarding"),
  },
  {
    id: "admin",
    href: "/admin",
    label: "Admin",
    icon: ShieldCheck,
    requiredRoles: ["ADMIN", "SUPER_ADMIN"],
    isActive: (pathname) => pathname.startsWith("/admin"),
  },
  {
    id: "messages",
    href: "/dashboard/messages",
    label: "Messages",
    icon: MessageCircle,
    badge: "messages",
    isActive: (pathname) => pathname.startsWith("/dashboard/messages"),
  },
  {
    id: "notifications",
    href: "/dashboard/notifications",
    label: "Notifs",
    icon: Bell,
    isActive: (pathname) => pathname.startsWith("/dashboard/notifications"),
  },
  {
    id: "subscription",
    href: "/dashboard/subscription",
    label: "Offre",
    icon: CreditCard,
    isActive: (pathname) => pathname === "/dashboard/subscription",
  },
  {
    id: "profile",
    href: "/dashboard/profile",
    label: "Profil",
    icon: Settings,
    isActive: (pathname) => pathname === "/dashboard/profile",
  },
]

const dashboardSidebar: NavItem[] = [
  {
    id: "dashboard",
    href: "/dashboard",
    label: "Tableau de bord",
    icon: LayoutDashboard,
    isActive: (pathname) => pathname === "/dashboard",
  },
  {
    id: "signals",
    href: "/dashboard/signals",
    label: "Mes Signaux",
    icon: TrendingUp,
    isActive: (pathname) =>
      pathname.startsWith("/dashboard/signals") || pathname.startsWith("/signals"),
  },
  {
    id: "journal",
    href: "/dashboard/journal",
    label: "Journal",
    icon: BookOpen,
    isActive: (pathname) => pathname.startsWith("/dashboard/journal"),
  },
  {
    id: "verification",
    href: "/dashboard/verification",
    label: "Vérification",
    icon: Shield,
    isActive: (pathname) => pathname === "/dashboard/verification",
  },
  {
    id: "subscription",
    href: "/dashboard/subscription",
    label: "Mon abonnement",
    icon: CreditCard,
    isActive: (pathname) => pathname === "/dashboard/subscription",
  },
  {
    id: "notifications",
    href: "/dashboard/notifications",
    label: "Notifications",
    icon: Bell,
    isActive: (pathname) => pathname.startsWith("/dashboard/notifications"),
  },
  {
    id: "support",
    href: "/dashboard/support",
    label: "Support",
    icon: MessageCircle,
    isActive: (pathname) => pathname === "/dashboard/support",
  },
]

const dashboardMenu: NavItem[] = [
  {
    id: "dashboard",
    href: "/dashboard",
    label: "Tableau de bord",
    icon: LayoutDashboard,
    isActive: (pathname) => pathname === "/dashboard",
  },
  ...dashboardSidebar.map((item) => ({
    ...item,
    label: item.label.replace("Mes ", "").replace("Mon ", ""),
  })),
]

// Mapping des icônes pour les onglets admin
const adminTabIconMap: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  stats: BarChart2,
  analytics: LineChart,
  requests: ListTodo,
  membres: Users,
  users: Users,
  kyc: FileCheck,
  broker: Link2,
  signals: Radio,
  emails: Mail,
  notifications: Bell,
  audit: Activity,
  moderation: Shield,
  security: Shield,
  settings: Settings,
  devices: Activity,
  crons: Activity,
  formation: ShieldCheck,
}

const adminStandaloneLinks: Record<string, NavItem[]> = {
  surveiller: [
    {
      id: "control-room",
      href: "/admin/control-room",
      label: "Control Room",
      icon: Gauge,
      section: "surveiller",
      isActive: (pathname) => pathname === "/admin/control-room",
    },
    {
      id: "tracker",
      href: "/admin/tracker",
      label: "Tracker",
      icon: Activity,
      section: "surveiller",
      isActive: (pathname) => pathname === "/admin/tracker",
    },
  ],
  decider: [
    {
      id: "members",
      href: "/admin/members",
      label: "Annuaire membres",
      icon: Users,
      section: "decider",
      isActive: (pathname) => pathname === "/admin/members",
    },
  ],
  communiquer: [
    {
      id: "messages",
      href: "/admin/messages",
      label: "Messages",
      icon: MessageCircle,
      section: "communiquer",
      badge: "messages",
      isActive: (pathname) => pathname === "/admin/messages",
    },
  ],
  auditer: [
    {
      id: "audit",
      href: "/admin/audit",
      label: "Journal d'audit (complet)",
      icon: FileCheck,
      section: "auditer",
      isActive: (pathname) => pathname === "/admin/audit",
    },
    {
      id: "dlq",
      href: "/admin/webhooks/dlq",
      label: "DLQ Webhooks",
      icon: Activity,
      section: "auditer",
      isActive: (pathname) => pathname.startsWith("/admin/webhooks/dlq"),
    },
  ],
}

const adminMobile: NavItem[] = ADMIN_CONTEXTS.map((context) => {
  const repr = context.tabs[0]
  return {
    id: context.id,
    href: `/admin?tab=${repr.value}`,
    label: context.label,
    icon: context.icon,
    section: context.id,
    badge: context.id === "decider" ? "pendingRequests" : undefined,
    isActive: (pathname, searchParams) => {
      const activeTab = searchParams.get("tab") || ""
      return pathname.startsWith("/admin") && getContextForTab(activeTab) === context.id
    },
  }
})

const adminSidebarSections: NavSection[] = ADMIN_CONTEXTS.map((context) => {
  const isDecider = context.id === "decider"
  const items: NavItem[] = [
    ...context.tabs.map((tab) => ({
      id: tab.value,
      href: `/admin?tab=${tab.value}`,
      label: tab.label,
      icon: adminTabIconMap[tab.value] || context.icon,
      section: context.id,
      isActive: (pathname: string, searchParams: URLSearchParams) =>
        pathname === "/admin" && searchParams.get("tab") === tab.value,
    })),
    ...(adminStandaloneLinks[context.id] || []),
  ]
  return {
    id: context.id,
    label: context.label,
    items,
    badge: isDecider ? undefined : undefined, // calculé au runtime
  }
})

const adminMenu: NavItem[] = adminSidebarSections.flatMap((section) =>
  section.items.map((item) => ({ ...item, section: section.id }))
)

export const NAVIGATION = {
  dashboard: {
    mobile: dashboardMobile,
    sidebar: dashboardSidebar,
    menu: dashboardMenu,
  },
  admin: {
    mobile: adminMobile,
    sidebar: adminSidebarSections,
    menu: adminMenu,
  },
}

/**
 * Filtre les items de navigation selon le rôle de l'utilisateur.
 */
export function filterNavItems(items: NavItem[], role?: UserRole): NavItem[] {
  return items.filter((item) => {
    if (!item.requiredRoles || item.requiredRoles.length === 0) return true
    return role ? item.requiredRoles.includes(role) : false
  })
}

/**
 * Détermine si un item est actif selon le pathname et les search params.
 */
export function isNavItemActive(
  item: NavItem,
  pathname: string,
  searchParams: URLSearchParams,
): boolean {
  if (item.isActive) return item.isActive(pathname, searchParams)
  return pathname === item.href || pathname.startsWith(item.href + "/")
}

/**
 * Retourne les items de navigation mobile pour un espace et un rôle.
 */
export function getMobileNavItems(space: NavSpace, role?: UserRole): NavItem[] {
  return filterNavItems(NAVIGATION[space].mobile, role)
}

/**
 * Retourne les items de navigation pour le menu mobile (drawer).
 */
export function getMenuNavItems(space: NavSpace, role?: UserRole): NavItem[] {
  return filterNavItems(NAVIGATION[space].menu, role)
}

/**
 * Retourne les sections de navigation pour la sidebar desktop.
 */
export function getSidebarSections(space: NavSpace, role?: UserRole): NavSection[] {
  if (space === "dashboard") {
    return [
      {
        id: "main",
        label: "Menu",
        items: filterNavItems(NAVIGATION.dashboard.sidebar, role),
      },
    ]
  }
  return adminSidebarSections.map((section) => ({
    ...section,
    items: filterNavItems(section.items, role),
  }))
}

/**
 * Retourne les items de navigation pour la sidebar (version aplatie).
 * Utile pour la sidebar collapsed.
 */
export function getSidebarItems(space: NavSpace, role?: UserRole): NavItem[] {
  const sections = getSidebarSections(space, role)
  return sections.flatMap((section) => section.items)
}
