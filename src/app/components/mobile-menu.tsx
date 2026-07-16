"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { authClient } from "@nba/lib/auth-client"
import { Dialog, DialogContent, DialogHeader, DialogTitle, Button, cn } from "@nba/design-system"
import { PushNotificationToggle } from "@nba/components/push-notification-toggle"
import { ADMIN_CONTEXTS } from "@nba/app/(admin)/admin/admin-context"
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
  MessageCircle,
  Inbox,
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

  const adminLinks = ADMIN_CONTEXTS.flatMap((context) => {
    const isActiveTab = (tab: string) => pathname === "/admin" && activeTab === tab
    const standaloneByContext: Record<string, { href: string; label: string; icon: any; active: boolean }[]> = {
      surveiller: [
        { href: "/admin?tab=dashboard", label: "Control Room", icon: Gauge, active: pathname === "/admin" && activeTab === "dashboard" },
        { href: "/admin/tracker", label: "Tracker", icon: Activity, active: pathname.startsWith("/admin/tracker") },
      ],
      communiquer: [
        { href: "/admin/messages", label: "Messages", icon: MessageCircle, active: pathname === "/admin/messages" },
      ],
      auditer: [
        { href: "/admin/webhooks/dlq", label: "DLQ Webhooks", icon: Inbox, active: pathname.startsWith("/admin/webhooks/dlq") },
      ],
    }
    const iconMap: Record<string, any> = {
      dashboard: LayoutDashboard,
      stats: BarChart2,
      analytics: LineChart,
      requests: ListTodo,
      membres: UserCheck,
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
    }
    const tabLinks = context.tabs.map((t) => ({
      href: `/admin?tab=${t.value}`,
      label: t.label,
      icon: iconMap[t.value] || context.icon,
      group: context.label,
      active: isActiveTab(t.value),
    }))
    const standalone = (standaloneByContext[context.id] || []).map((s) => ({ ...s, group: context.label }))
    return [...tabLinks, ...standalone]
  })

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
                const groups = ADMIN_CONTEXTS.map((c) => c.label) as string[]
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
              <PushNotificationToggle compact />
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
