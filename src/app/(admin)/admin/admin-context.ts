import {
  Activity,
  Gavel,
  Radio,
  Settings,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react"

export type AdminContextId = "surveiller" | "decider" | "communiquer" | "auditer" | "systeme"

export interface AdminTabDef {
  value: string
  label: string
  /** Si défini, seuls ces rôles voient l'onglet. undefined = visible par tous. */
  requiredRole?: "SUPER_ADMIN"
}

export interface AdminContextDef {
  id: AdminContextId
  label: string
  icon: LucideIcon
  tabs: AdminTabDef[]
  /** Si défini, seuls ces rôles voient toute la section. undefined = visible par tous. */
  requiredRole?: "SUPER_ADMIN"
}

/**
 * Les 18 sous-onglets admin regroupés en 5 contextes mentaux.
 * ── ADMIN voit : Surveiller, Décider, Communiquer, Auditer
 * ── SUPER_ADMIN voit tout + la section Système
 */
export const ADMIN_CONTEXTS: AdminContextDef[] = [
  {
    id: "surveiller",
    label: "Surveiller",
    icon: Activity,
    tabs: [
      { value: "dashboard", label: "Tableau de bord" },
      { value: "stats", label: "Statistiques" },
      { value: "analytics", label: "Analytics" },
      { value: "revenue", label: "Revenus" },
      { value: "devices", label: "Appareils" },
    ],
  },
  {
    id: "decider",
    label: "Décider",
    icon: Gavel,
    tabs: [
      { value: "requests", label: "Demandes" },
      { value: "membres", label: "Membres" },
      { value: "users", label: "Utilisateurs" },
      { value: "kyc", label: "KYC" },
      { value: "broker", label: "Broker" },
    ],
  },
  {
    id: "communiquer",
    label: "Communiquer",
    icon: Radio,
    tabs: [
      { value: "signals", label: "Signaux" },
      { value: "emails", label: "E-mails" },
      { value: "notifications", label: "Notifications" },
    ],
  },
  {
    id: "auditer",
    label: "Auditer",
    icon: ShieldCheck,
    tabs: [
      { value: "audit", label: "Audit" },
      { value: "moderation", label: "Modération" },
      { value: "security", label: "Sécurité" },
      { value: "fraud", label: "Anti-Fraude" },
      { value: "formation", label: "Formation" },
    ],
  },
  {
    id: "systeme",
    label: "Système",
    icon: Settings,
    requiredRole: "SUPER_ADMIN",
    tabs: [
      { value: "settings", label: "Paramètres" },
      { value: "crons", label: "Cron Jobs" },
    ],
  },
]

const TAB_CONTEXT: Record<string, AdminContextId> = Object.fromEntries(
  ADMIN_CONTEXTS.flatMap((c) => c.tabs.map((t) => [t.value, c.id]))
)

export function getContextForTab(tab: string | null): AdminContextId {
  return (tab && TAB_CONTEXT[tab]) || "surveiller"
}

export function getTabLabel(tab: string): string {
  for (const c of ADMIN_CONTEXTS) {
    const found = c.tabs.find((t) => t.value === tab)
    if (found) return found.label
  }
  return tab
}
