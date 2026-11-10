import type { LucideIcon } from "lucide-react"
import {
  Bell,
  BookOpen,
  Contact,
  CreditCard,
  Database,
  FileCheck,
  Flame,
  Gauge,
  GraduationCap,
  Inbox,
  LayoutDashboard,
  LineChart,
  Link2,
  ListTodo,
  Mail,
  MessageCircle,
  MonitorSmartphone,
  Radar,
  Radio,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Siren,
  Timer,
  TrendingUp,
  Users,
  Webhook,
  Bug,
} from "lucide-react"
import { ADMIN_CONTEXTS } from "@nba/app/(admin)/admin/admin-context"

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
  badge?: "messages" | "pendingKyc" | "pendingRequests" | "pendingReview"
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
    id: "lot",
    href: "/dashboard/lot",
    label: "Calculateur",
    icon: LineChart,
    isActive: (pathname) => pathname.startsWith("/dashboard/lot"),
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
    id: "lot",
    href: "/dashboard/lot",
    label: "Calculateur de lot",
    icon: LineChart,
    isActive: (pathname) => pathname.startsWith("/dashboard/lot"),
  },
  {
    id: "redpills",
    href: "/dashboard/redpills",
    label: "Redpills",
    icon: Flame,
    isActive: (pathname) => pathname.startsWith("/dashboard/redpills"),
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

// Liens standalone par ancienne section (conservés pour getSuperAdminSections).
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
      icon: Radar,
      section: "surveiller",
      isActive: (pathname) => pathname === "/admin/tracker",
    },
  ],
  decider: [],
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
    {
      id: "bulk-message",
      href: "/admin/bulk-message",
      label: "Message groupé",
      icon: Mail,
      section: "communiquer",
      isActive: (pathname) => pathname === "/admin/bulk-message",
    },
    {
      id: "support",
      href: "/admin/support",
      label: "Support",
      icon: MessageCircle,
      section: "communiquer",
      isActive: (pathname) => pathname === "/admin/support",
    },
    {
      id: "coaching",
      href: "/admin/coaching",
      label: "Coaching",
      icon: BookOpen,
      section: "communiquer",
      isActive: (pathname) => pathname === "/admin/coaching",
    },
    {
      id: "redpills",
      href: "/admin/redpills",
      label: "Redpills",
      icon: Flame,
      section: "communiquer",
      isActive: (pathname) => pathname === "/admin/redpills",
    },
  ],
  auditer: [
    {
      id: "audit",
      href: "/admin/audit",
      label: "Journal d'audit",
      icon: FileCheck,
      section: "auditer",
      isActive: (pathname) => pathname === "/admin/audit",
    },
  ],
  systeme: [
    {
      id: "developer",
      href: "/admin/developer",
      label: "Console développeur",
      icon: Settings,
      section: "systeme",
      requiredRoles: ["SUPER_ADMIN"],
      isActive: (pathname) => pathname === "/admin/developer",
    },
    {
      id: "cache",
      href: "/admin/cache",
      label: "Cache",
      icon: Database,
      section: "systeme",
      isActive: (pathname) => pathname === "/admin/cache",
    },
    {
      id: "dlq",
      href: "/admin/webhooks/dlq",
      label: "DLQ Webhooks",
      icon: Webhook,
      section: "systeme",
      isActive: (pathname) => pathname.startsWith("/admin/webhooks/dlq"),
    },
    {
      id: "queues",
      href: "/admin/queues",
      label: "Files d'attente",
      icon: ListTodo,
      section: "systeme",
      isActive: (pathname) => pathname === "/admin/queues",
    },
  ],
}

/**
 * Nouvelle organisation par métier (phase 1) : mêmes écrans, nouveaux rayons.
 * Les onglets `?tab=` existants sont inchangés — seul le regroupement sidebar change.
 * ADMIN_CONTEXTS reste la référence pour le mobile bottom-nav et getContextForTab.
 */

function adminTabLabel(value: string): string {
  for (const c of ADMIN_CONTEXTS) {
    const t = c.tabs.find((t) => t.value === value)
    if (t) return t.label
  }
  return value
}

function adminTabLink(value: string, icon: LucideIcon, section: string): NavItem {
  return {
    id: value,
    href: `/admin?tab=${value}`,
    label: adminTabLabel(value),
    icon,
    section,
    isActive: (pathname: string, searchParams: URLSearchParams) =>
      pathname === "/admin" && (searchParams.get("tab") ?? "dashboard") === value,
  }
}

function adminPageLink(
  id: string,
  href: string,
  label: string,
  icon: LucideIcon,
  section: string,
  match: (pathname: string, searchParams: URLSearchParams) => boolean,
  badge?: NavItem["badge"],
): NavItem {
  return { id, href, label, icon, section, isActive: match, badge }
}

const adminSidebarSections: NavSection[] = [
  {
    id: "a-traiter",
    label: "À traiter",
    items: [
      adminPageLink("review", "/admin/a-traiter", "Vue d'ensemble", Inbox, "a-traiter",
        (pathname) => pathname === "/admin/a-traiter", "pendingReview"),
      adminTabLink("requests", ListTodo, "a-traiter"),
      adminTabLink("kyc", FileCheck, "a-traiter"),
      adminTabLink("broker", Link2, "a-traiter"),
      adminTabLink("bugs", Bug, "a-traiter"),
      adminPageLink("support", "/admin/support", "Support", MessageCircle, "a-traiter",
        (pathname) => pathname === "/admin/support", "messages"),
    ],
  },
  {
    id: "membres",
    label: "Membres",
    items: [
      adminTabLink("membres", Users, "membres"),
      adminTabLink("users", Contact, "membres"),
    ],
  },
  {
    id: "contenus",
    label: "Contenus",
    items: [
      adminTabLink("signals", Radio, "contenus"),
      adminPageLink("redpills", "/admin/redpills", "Redpills", Flame, "contenus",
        (pathname) => pathname === "/admin/redpills"),
      adminTabLink("formation", GraduationCap, "contenus"),
      adminTabLink("notifications", Bell, "contenus"),
      adminTabLink("emails", Mail, "contenus"),
      adminPageLink("messages", "/admin/messages", "Messages", MessageCircle, "contenus",
        (pathname) => pathname.startsWith("/admin/messages"), "messages"),
      adminPageLink("bulk-message", "/admin/bulk-message", "Message groupé", Mail, "contenus",
        (pathname) => pathname === "/admin/bulk-message"),
    ],
  },
  {
    id: "pilotage",
    label: "Pilotage",
    items: [
      adminTabLink("dashboard", LayoutDashboard, "pilotage"),
      adminPageLink("control-room", "/admin/control-room", "Control Room", Gauge, "pilotage",
        (pathname) => pathname === "/admin/control-room"),
      adminPageLink("tracker", "/admin/tracker", "Tracker", Radar, "pilotage",
        (pathname) => pathname.startsWith("/admin/tracker")),
      adminPageLink("coaching", "/admin/coaching", "Coaching", BookOpen, "pilotage",
        (pathname) => pathname === "/admin/coaching"),
      adminTabLink("analytics", LineChart, "pilotage"),
      adminTabLink("revenue", CreditCard, "pilotage"),
    ],
  },
  {
    id: "securite",
    label: "Sécurité",
    items: [
      adminTabLink("security", ShieldCheck, "securite"),
      adminTabLink("fraud", Siren, "securite"),
      adminTabLink("devices", MonitorSmartphone, "securite"),
      adminTabLink("moderation", ShieldAlert, "securite"),
      adminPageLink("audit", "/admin/audit", "Journal d'audit", FileCheck, "securite",
        (pathname) => pathname === "/admin/audit"),
    ],
  },
]

const adminMobile: NavItem[] = [
  {
    id: "a-traiter",
    href: "/admin/a-traiter",
    label: "À traiter",
    icon: Inbox,
    section: "a-traiter",
    badge: "pendingReview",
    isActive: (pathname) => pathname.startsWith("/admin/a-traiter"),
  },
  {
    id: "membres",
    href: "/admin?tab=membres",
    label: "Membres",
    icon: Users,
    section: "membres",
    isActive: (pathname, searchParams) => pathname === "/admin" && (searchParams.get("tab") ?? "") === "membres",
  },
  {
    id: "contenus",
    href: "/admin?tab=signals",
    label: "Contenus",
    icon: Radio,
    section: "contenus",
    isActive: (pathname, searchParams) =>
      pathname === "/admin" && ["signals", "formation", "notifications", "emails"].includes(searchParams.get("tab") ?? "") ||
      ["/admin/redpills", "/admin/messages", "/admin/bulk-message"].some((p) => pathname.startsWith(p)),
  },
  {
    id: "pilotage",
    href: "/admin?tab=dashboard",
    label: "Pilotage",
    icon: LayoutDashboard,
    section: "pilotage",
    isActive: (pathname, searchParams) =>
      pathname === "/admin" && ["dashboard", "analytics", "revenue"].includes(searchParams.get("tab") ?? "dashboard") ||
      ["/admin/control-room", "/admin/tracker", "/admin/coaching"].some((p) => pathname.startsWith(p)),
  },
  {
    id: "securite",
    href: "/admin?tab=security",
    label: "Sécurité",
    icon: ShieldCheck,
    section: "securite",
    isActive: (pathname, searchParams) =>
      pathname === "/admin" && ["security", "fraud", "devices", "moderation"].includes(searchParams.get("tab") ?? "") ||
      pathname.startsWith("/admin/audit"),
  },
]

/**
 * Sections réservées SUPER_ADMIN (Systeme).
 * Injectées séparément dans la sidebar selon le rôle.
 */
export function getSuperAdminSections(): NavSection[] {
  return [
    {
      id: "systeme",
      label: "Système",
      items: [
        adminTabLink("settings", Settings, "systeme"),
        adminTabLink("crons", Timer, "systeme"),
        ...(adminStandaloneLinks["systeme"] || []),
      ],
    },
  ]
}

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
