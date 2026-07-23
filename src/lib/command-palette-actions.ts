/**
 * Index statique des actions/navigations de la command palette.
 * Le backend (API) utilise la même liste dans /api/admin/command-palette/search.
 * Client : pour la recherche rapide sans appel API quand la query est courte.
 */

export interface PaletteAction {
  type: "action"
  id: string
  title: string
  subtitle: string
  href: string
  shortcut?: string
  /** Si défini, seulement visible par ce rôle. */
  requiredRole?: "ADMIN" | "SUPER_ADMIN"
}

export const PALETTE_ACTIONS: PaletteAction[] = [
  { type: "action", id: "act:new-signal", title: "Publier un signal", subtitle: "Communication", href: "/admin?tab=signals", shortcut: "N", requiredRole: "ADMIN" },
  { type: "action", id: "act:new-email", title: "Envoyer un email", subtitle: "Communication", href: "/admin?tab=emails", requiredRole: "ADMIN" },
  { type: "action", id: "act:view-requests", title: "Voir les demandes d'accès", subtitle: "Décider", href: "/admin?tab=requests", shortcut: "R", requiredRole: "ADMIN" },
  { type: "action", id: "act:view-kyc", title: "Voir les KYC en attente", subtitle: "Décider", href: "/admin?tab=kyc", shortcut: "K", requiredRole: "ADMIN" },
  { type: "action", id: "act:view-members", title: "Voir les membres", subtitle: "Décider", href: "/admin?tab=membres", shortcut: "M", requiredRole: "ADMIN" },
  { type: "action", id: "act:view-audit", title: "Voir l'audit", subtitle: "Auditer", href: "/admin?tab=audit", shortcut: "A", requiredRole: "ADMIN" },
  { type: "action", id: "act:view-moderation", title: "Voir la modération", subtitle: "Auditer", href: "/admin?tab=moderation", requiredRole: "ADMIN" },
  { type: "action", id: "act:view-security", title: "Voir la sécurité", subtitle: "Auditer", href: "/admin?tab=security", requiredRole: "ADMIN" },
  { type: "action", id: "act:view-tracker", title: "Ouvrir le tracker", subtitle: "Surveiller", href: "/admin/tracker", requiredRole: "ADMIN" },
  { type: "action", id: "act:view-control-room", title: "Ouvrir le control room", subtitle: "Surveiller", href: "/admin/control-room", requiredRole: "ADMIN" },
  { type: "action", id: "act:view-analytics", title: "Voir les analytics", subtitle: "Surveiller", href: "/admin?tab=analytics", requiredRole: "ADMIN" },
  { type: "action", id: "act:view-dashboard", title: "Tableau de bord admin", subtitle: "Surveiller", href: "/admin?tab=dashboard", shortcut: "G", requiredRole: "ADMIN" },
]

export function isMac(): boolean {
  if (typeof navigator === "undefined") return false
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform)
}
