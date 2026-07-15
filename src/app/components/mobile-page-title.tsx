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
  users: "Utilisateurs",
  membres: "Membres",
  notifications: "Notifications",
}

const ADMIN_PATHS: Record<string, string> = {
  "/admin/tracker": "Tracker",
  "/admin/control-room": "Control Room",
  "/admin/messages": "Messages",
  "/admin/webhooks": "Webhooks",
  "/admin/support": "Support",
}

export function MobilePageTitle() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activeTab = searchParams.get("tab") || "dashboard"

  if (ADMIN_PATHS[pathname]) {
    return <span className="font-semibold text-sm text-foreground truncate">{ADMIN_PATHS[pathname]}</span>
  }

  if (pathname.startsWith("/admin") && ADMIN_TABS[activeTab]) {
    return <span className="font-semibold text-sm text-foreground truncate">{ADMIN_TABS[activeTab]}</span>
  }

  return null
}