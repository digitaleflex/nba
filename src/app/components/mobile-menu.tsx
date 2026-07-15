"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { authClient } from "@nba/lib/auth-client"
import { Dialog, DialogContent, DialogHeader, DialogTitle, Button, cn } from "@nba/design-system"
import {
  LayoutDashboard,
  TrendingUp,
  Shield,
  CreditCard,
  LogOut,
  Menu,
  X,
  Users,
  ListTodo,
  Radio,
  FileCheck,
  Link2,
  Bell,
  Activity,
  BarChart2,
  Settings,
  Gauge,
  Mail,
  LineChart,
  UserCheck,
} from "lucide-react"

interface MobileMenuProps {
  isAdmin?: boolean
  user: {
    id: string
    name: string
    email: string
    image?: string | null
    role?: string
  }
}

export function MobileMenu({ isAdmin = false, user }: MobileMenuProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const activeTab = searchParams.get("tab") || "dashboard"

  async function handleLogout() {
    if (!confirm("Voulez-vous vraiment vous déconnecter ?")) return
    await authClient.signOut()
    router.push("/login")
    router.refresh()
  }

  const userLinks = [
    { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard, active: pathname === "/dashboard" },
    { href: "/dashboard/signals", label: "Signaux", icon: TrendingUp, active: pathname.startsWith("/dashboard/signals") || pathname.startsWith("/signals") },
    { href: "/dashboard/verification", label: "Vérification", icon: Shield, active: pathname === "/dashboard/verification" },
    { href: "/dashboard/subscription", label: "Abonnement", icon: CreditCard, active: pathname === "/dashboard/subscription" },
    { href: "/dashboard/notifications", label: "Notifications", icon: Bell, active: pathname.startsWith("/dashboard/notifications") },
  ]

  const adminLinks = [
    // Supervision
    { href: "/admin?tab=dashboard", label: "Tableau de bord", icon: LayoutDashboard, group: "Supervision", active: pathname === "/admin" && activeTab === "dashboard" },
    { href: "/admin/control-room", label: "Control Room", icon: Gauge, group: "Supervision", active: pathname === "/admin/control-room" },
    { href: "/admin/tracker", label: "Tracker", icon: Activity, group: "Supervision", active: pathname.startsWith("/admin/tracker") },
    // Communications
    { href: "/admin?tab=signals", label: "Signaux", icon: Radio, group: "Communications", active: pathname === "/admin" && activeTab === "signals" },
    { href: "/admin?tab=emails", label: "E-mails", icon: Mail, group: "Communications", active: pathname === "/admin" && activeTab === "emails" },
    { href: "/admin?tab=notifications", label: "Notifications", icon: Bell, group: "Communications", active: pathname === "/admin" && activeTab === "notifications" },
    // Membres
    { href: "/admin?tab=requests", label: "Demandes d'accès", icon: ListTodo, group: "Membres", active: pathname === "/admin" && activeTab === "requests" },
    { href: "/admin?tab=users", label: "Utilisateurs", icon: Users, group: "Membres", active: pathname === "/admin" && activeTab === "users" },
    { href: "/admin?tab=membres", label: "Membres", icon: UserCheck, group: "Membres", active: pathname === "/admin" && activeTab === "membres" },
    { href: "/admin?tab=kyc", label: "Dossiers KYC", icon: FileCheck, group: "Membres", active: pathname === "/admin" && activeTab === "kyc" },
    { href: "/admin?tab=broker", label: "Vérification Broker", icon: Link2, group: "Membres", active: pathname === "/admin" && activeTab === "broker" },
    // Système
    { href: "/admin?tab=audit", label: "Journal d'audit", icon: Activity, group: "Système", active: pathname === "/admin" && activeTab === "audit" },
    { href: "/admin?tab=stats", label: "Statistiques", icon: BarChart2, group: "Système", active: pathname === "/admin" && activeTab === "stats" },
    { href: "/admin?tab=analytics", label: "Analytics", icon: LineChart, group: "Système", active: pathname === "/admin" && activeTab === "analytics" },
    { href: "/admin?tab=security", label: "Sécurité", icon: Shield, group: "Système", active: pathname === "/admin" && activeTab === "security" },
    { href: "/admin?tab=settings", label: "Paramètres", icon: Settings, group: "Système", active: pathname === "/admin" && activeTab === "settings" },
  ]

  const links = isAdmin ? adminLinks : userLinks
  const showAdminSwitch = !isAdmin && (user.role === "ADMIN" || user.role === "SUPER_ADMIN")

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="md:hidden size-10 rounded-xl"
        aria-label="Menu"
      >
        <Menu className="size-5" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="left-0 top-0 bottom-0 right-auto translate-x-0 translate-y-0 rounded-none h-full w-[280px] max-w-[85vw] p-0 gap-0 data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left"
          showCloseButton={false}
        >
          <DialogHeader className="flex flex-row items-center justify-between space-y-0 p-4 border-b border-border">
            <DialogTitle className="flex items-center gap-2.5 font-bold text-base">
              <span className="text-primary font-black">Never</span>BrokeAgain
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setOpen(false)}
              className="rounded-full size-8"
            >
              <X className="size-4" />
            </Button>
          </DialogHeader>

          <nav className="flex-1 overflow-y-auto p-3 space-y-1">
            {isAdmin ? (
              (() => {
                const groups = ["Supervision", "Communications", "Membres", "Système"] as const
                return groups.flatMap((group, gi) => {
                  const groupLinks = (links as typeof adminLinks).filter((l) => l.group === group)
                  if (groupLinks.length === 0) return []
                  return [
                    gi > 0 ? <div key={`sep-${group}`} className="h-3" /> : null,
                    <p key={`h-${group}`} className="px-3 pt-1 pb-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{group}</p>,
                    ...groupLinks.map((link) => {
                      const Icon = link.icon
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setOpen(false)}
                          className={cn(
                            "flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-xl transition-colors min-h-[44px]",
                            (link as any).active
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted"
                          )}
                        >
                          <Icon className="size-5 shrink-0" />
                          <span>{link.label}</span>
                        </Link>
                      )
                    }),
                  ]
                })
              })()
            ) : (
              links.map((link) => {
                const Icon = link.icon
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-xl transition-colors min-h-[44px]",
                      link.active
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <Icon className="size-5 shrink-0" />
                    <span>{link.label}</span>
                  </Link>
                )
              })
            )}

            {showAdminSwitch && (
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-xl transition-colors border border-dashed border-border text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5 mt-3 min-h-[44px]"
              >
                <Shield className="size-5 shrink-0" />
                <span>Accéder à l'Admin</span>
              </Link>
            )}

            {isAdmin && (
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-xl transition-colors border border-dashed border-border text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5 mt-3 min-h-[44px]"
              >
                <LayoutDashboard className="size-5 shrink-0" />
                <span>Retour au Dashboard</span>
              </Link>
            )}
          </nav>

          <div className="border-t border-border p-3">
            <div className="flex items-center gap-3 px-3 py-2 mb-2">
              <div className="flex items-center justify-center size-9 rounded-full bg-primary/10 border border-primary/20 shrink-0">
                <span className="text-xs font-bold text-primary">{user.name?.charAt(0)?.toUpperCase() || "U"}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold truncate text-foreground">{user.name}</p>
                <p className="text-[10px] truncate text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full justify-start gap-3 px-3 py-3 text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl min-h-[44px]"
            >
              <LogOut className="size-4" />
              <span>Déconnexion</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
