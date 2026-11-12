"use client"

import { usePathname, useSearchParams } from "next/navigation"

const ADMIN_TABS: Record<string, string> = {
  dashboard: "Tableau de bord",
  requests: "Demandes d'accès",
  signals: "Signaux",
  kyc: "KYC",
  broker: "Broker",
  stats: "Statistiques",
  analytics: "Analytics",
  security: "Sécurité",
  emails: "E-mails",
  settings: "Paramètres",
  audit: "Audit",
  moderation: "Modération",
  users: "Comptes",
  membres: "Membres",
  notifications: "Notifications",
  fraud: "Anti-fraude",
  devices: "Appareils",
  crons: "Crons",
  revenue: "Revenus",
  bugs: "Bugs",
}

const ADMIN_PATHS: Record<string, string> = {
  "/admin/a-traiter": "À traiter",
  "/admin/tracker": "Tracker",
  "/admin/messages": "Messagerie",
  "/admin/webhooks": "Webhooks",
  "/admin/support": "Support client",
  "/admin/redpills": "Redpills d'Emerson",
  "/admin/coaching": "Journaux des membres",
  "/admin/audit": "Journal d'audit",
  "/admin/cache": "Cache",
  "/admin/queues": "Files d'attente",
  "/admin/developer": "Console développeur",
  "/admin/bulk-message": "Message groupé",
}

export function MobilePageTitle() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activeTab = searchParams.get("tab") || "dashboard"

  // Match exact path first, then prefix for nested routes.
  if (ADMIN_PATHS[pathname]) {
    return <span className="font-semibold text-sm text-foreground truncate">{ADMIN_PATHS[pathname]}</span>
  }
  for (const [path, title] of Object.entries(ADMIN_PATHS)) {
    if (pathname.startsWith(path + "/")) {
      return <span className="font-semibold text-sm text-foreground truncate">{title}</span>
    }
  }

  if (pathname.startsWith("/admin") && ADMIN_TABS[activeTab]) {
    return <span className="font-semibold text-sm text-foreground truncate">{ADMIN_TABS[activeTab]}</span>
  }

  return null
}
