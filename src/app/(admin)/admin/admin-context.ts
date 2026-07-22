import {
  Activity,
  Gavel,
  Radio,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react"

export type AdminContextId = "surveiller" | "decider" | "communiquer" | "auditer"

export interface AdminTabDef {
  value: string
  label: string
}

export interface AdminContextDef {
  id: AdminContextId
  label: string
  icon: LucideIcon
  tabs: AdminTabDef[]
}

/**
 * Les 14 sous-onglets admin regroupés en 4 contextes mentaux.
 * Mapping des anciennes URLs :
 *   ?tab=dashboard,stats,analytics           → Surveiller
 *   ?tab=requests,members,kyc,broker,users  → Décider
 *   ?tab=signals,emails,notifications        → Communiquer
 *   ?tab=audit,moderation,security,settings  → Auditer
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
      { value: "devices", label: "Appareils" },
      { value: "crons", label: "Cron Jobs" },
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
      { value: "settings", label: "Paramètres" },
      { value: "formation", label: "Formation" },
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
