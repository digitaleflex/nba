"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { authClient } from "@nba/lib/auth-client"
import { Button, Badge, cn } from "@nba/design-system"
import { useMessagingUnread } from "@nba/lib/messaging-unread"
import {
  LayoutDashboard,
  Users,
  ListTodo,
  Radio,
  FileCheck,
  Link2,
  Bell,
  Activity,
  Gauge,
  Shield,
  BarChart2,
  Settings,
  LogOut,
  User as UserIcon,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  CreditCard,
  MessageCircle,
  Volume2,
  MonitorSmartphone,
  Inbox,
} from "lucide-react"
interface SidebarProps {
  isAdmin?: boolean
  user: {
    id: string
    name: string
    email: string
    image?: string | null
    role?: string
  }
}

export function Sidebar({ isAdmin = false, user }: SidebarProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const activeTab = searchParams.get("tab") || "dashboard"

  const [isCollapsed, setIsCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem("nba-sidebar-collapsed")
    if (saved) {
      setIsCollapsed(saved === "true")
    }
  }, [])

  const toggleCollapse = () => {
    const nextVal = !isCollapsed
    setIsCollapsed(nextVal)
    localStorage.setItem("nba-sidebar-collapsed", String(nextVal))
  }

  async function handleLogout() {
    await authClient.signOut()
    router.push("/login")
    router.refresh()
  }

  // Liens pour l'espace utilisateur
  const userLinks = [
    {
      href: "/dashboard",
      label: "Tableau de bord",
      icon: LayoutDashboard,
      active: pathname === "/dashboard",
    },
    {
      href: "/dashboard/signals",
      label: "Mes Signaux",
      icon: TrendingUp,
      active: pathname.startsWith("/dashboard/signals") || pathname.startsWith("/signals"),
    },
    {
      href: "/dashboard/verification",
      label: "Vérification",
      icon: Shield,
      active: pathname === "/dashboard/verification",
    },
    {
      href: "/dashboard/subscription",
      label: "Mon abonnement",
      icon: CreditCard,
      active: pathname === "/dashboard/subscription",
    },
    {
      href: "/dashboard/notifications",
      label: "Notifications",
      icon: Bell,
      active: pathname.startsWith("/dashboard/notifications"),
    },
    {
      href: "/dashboard/support",
      label: "Support",
      icon: MessageCircle,
      active: pathname === "/dashboard/support",
    },
    {
      href: "/dashboard/messages",
      label: "Messages",
      icon: MessageCircle,
      active: pathname.startsWith("/dashboard/messages"),
    },
    {
      href: "/dashboard/devices",
      label: "Appareils",
      icon: MonitorSmartphone,
      active:
        pathname.startsWith("/dashboard/devices") ||
        pathname.startsWith("/dashboard/verify-device"),
    },
  ]

  // Les 12 liens d'administration
  const adminLinks = [
    {
      href: "/admin?tab=dashboard",
      label: "Tableau de bord",
      icon: LayoutDashboard,
      active: pathname === "/admin" && activeTab === "dashboard",
    },
    {
      href: "/admin/messages",
      label: "Messages",
      icon: MessageCircle,
      active: pathname === "/admin/messages",
    },
    {
      href: "/admin?tab=users",
      label: "Utilisateurs",
      icon: Users,
      active: pathname === "/admin" && activeTab === "users",
    },
    {
      href: "/admin?tab=membres",
      label: "Membres",
      icon: Users,
      active: pathname === "/admin" && activeTab === "membres",
    },
    {
      href: "/admin?tab=requests",
      label: "Demandes d'accès",
      icon: ListTodo,
      active: pathname === "/admin" && activeTab === "requests",
    },
    {
      href: "/admin?tab=signals",
      label: "Signaux",
      icon: Radio,
      active: pathname === "/admin" && activeTab === "signals",
    },
    {
      href: "/admin?tab=kyc",
      label: "Dossiers KYC",
      icon: FileCheck,
      active: pathname === "/admin" && activeTab === "kyc",
    },
    {
      href: "/admin?tab=broker",
      label: "Vérification Broker",
      icon: Link2,
      active: pathname === "/admin" && activeTab === "broker",
    },
    {
      href: "/admin?tab=notifications",
      label: "Notifications",
      icon: Bell,
      active: pathname === "/admin" && activeTab === "notifications",
    },
    {
      href: "/admin?tab=audit",
      label: "Journal d'audit",
      icon: Activity,
      active: pathname === "/admin" && activeTab === "audit",
    },
    {
      href: "/admin?tab=security",
      label: "Centre de sécurité",
      icon: Shield,
      active: pathname === "/admin" && activeTab === "security",
    },
    {
      href: "/admin?tab=stats",
      label: "Statistiques",
      icon: BarChart2,
      active: pathname === "/admin" && activeTab === "stats",
    },
    {
      href: "/admin/control-room",
      label: "Centre de contrôle",
      icon: Gauge,
      active: pathname === "/admin/control-room",
    },
    {
      href: "/admin/tracker",
      label: "Tracker",
      icon: Activity,
      active: pathname === "/admin/tracker",
    },
    {
      href: "/admin/webhooks/dlq",
      label: "DLQ Webhooks",
      icon: Inbox,
      active: pathname.startsWith("/admin/webhooks/dlq"),
    },
    {
      href: "/admin?tab=settings",
      label: "Paramètres",
      icon: Settings,
      active: pathname === "/admin" && activeTab === "settings",
    },
  ]

  const links = isAdmin ? adminLinks : userLinks
  const showAdminSwitch = !isAdmin && (user.role === "ADMIN" || user.role === "SUPER_ADMIN")
  const { unreadTotal } = useMessagingUnread()
  const isMessagesLink = (href: string) =>
    href === "/dashboard/messages" || href === "/admin/messages"
  const messagesBadge =
    unreadTotal > 0 ? (unreadTotal > 9 ? "9+" : String(unreadTotal)) : null

  return (
    <aside
      className={cn(
        "hidden md:flex h-screen shrink-0 flex-col border-r sticky top-0 py-6 justify-between select-none transition-all duration-300 z-40",
        "bg-card/80 backdrop-blur-xl border-border shadow-[1px_0_10px_rgba(0,0,0,0.015)]",
        isCollapsed ? "w-20 px-3" : "w-64 px-5"
      )}
    >
      {/* Toggle Button */}
      <button
        onClick={toggleCollapse}
        className="absolute -right-3 top-7 z-50 flex size-6 items-center justify-center rounded-full border bg-background text-muted-foreground hover:text-foreground shadow-sm cursor-pointer hover:scale-110 active:scale-95 transition-all duration-200"
        title={isCollapsed ? "Déplier la barre" : "Plier la barre"}
      >
        {isCollapsed ? <ChevronRight className="size-3.5" /> : <ChevronLeft className="size-3.5" />}
      </button>

      <div className="space-y-7">
        {/* Logo / Header */}
        <div className={cn("flex items-center gap-2 px-2", isCollapsed ? "justify-center" : "justify-between")}>
          <Link href="/dashboard" className="flex items-center gap-2.5 font-bold text-lg tracking-tight shrink-0">
            {isCollapsed ? (
              <span className="bg-primary text-primary-foreground font-black text-sm rounded-lg size-8 flex items-center justify-center shadow-xs select-none">NB</span>
            ) : (
              <span className="text-foreground tracking-tight"><span className="text-primary font-black">Never</span>BrokeAgain</span>
            )}
          </Link>
          {!isCollapsed && isAdmin && (
            <span className="rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[9px] font-bold text-primary uppercase tracking-wider shrink-0">
              Admin
            </span>
          )}
        </div>

        {/* Menu Navigation */}
        <nav className="space-y-1.5">
          {links.map((link, idx) => {
            const Icon = link.icon
            const showBadge = isMessagesLink(link.href) && !!messagesBadge
            return (
              <Link
                key={idx}
                href={link.href}
                className={cn(
                  "flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 group relative",
                  isCollapsed ? "justify-center" : "gap-3.5",
                  link.active
                    ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
                title={isCollapsed ? link.label : undefined}
              >
                {link.active && !isCollapsed && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 size-1.5 rounded-full bg-primary-foreground/80 animate-pulse" />
                )}
                <span className="relative inline-flex shrink-0">
                  <Icon
                    className={cn(
                      "size-5 transition-transform duration-200 group-hover:scale-105",
                      link.active ? "text-primary-foreground" : "text-muted-foreground/85 group-hover:text-foreground"
                    )}
                  />
                  {showBadge && isCollapsed && (
                    <span className="absolute -top-1 -right-1 size-2 rounded-full bg-primary ring-2 ring-card" />
                  )}
                </span>
                {!isCollapsed && (
                  <span className="truncate flex items-center gap-2">
                    {link.label}
                    {showBadge && (
                      <Badge className="shrink-0 bg-primary text-primary-foreground tabular-nums">
                        {messagesBadge}
                      </Badge>
                    )}
                  </span>
                )}
              </Link>
            )
          })}

          {/* Switch to Admin for privileged users */}
          {showAdminSwitch && (
            <Link
              href="/admin"
              className={cn(
                "flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 group mt-4 border border-dashed",
              "border-border text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5",
              isCollapsed ? "justify-center" : "gap-3.5"
            )}
            title={isCollapsed ? "Accéder à l'Admin" : undefined}
          >
            <Shield className="size-5 text-muted-foreground/80 group-hover:text-primary transition-transform duration-200 group-hover:scale-105" />
            {!isCollapsed && <span>Accéder à l'Admin</span>}
          </Link>
        )}

        {/* Return to Dashboard for admins */}
        {isAdmin && (
          <Link
            href="/dashboard"
            className={cn(
              "flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 group mt-4 border border-dashed",
              "border-border text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5",
                isCollapsed ? "justify-center" : "gap-3.5"
              )}
              title={isCollapsed ? "Retour au Dashboard" : undefined}
            >
              <LayoutDashboard className="size-5 text-muted-foreground/80 group-hover:text-primary transition-transform duration-200 group-hover:scale-105" />
              {!isCollapsed && <span>Retour au Dashboard</span>}
            </Link>
          )}
        </nav>
      </div>

      {/* User Section / Bottom */}
      <div className="border-t border-border pt-4">
        <div
          className={cn(
            "flex items-center justify-between rounded-2xl transition-all p-2",
            !isCollapsed && "bg-muted/50 border border-border",
            isCollapsed ? "flex-col gap-4" : "gap-3"
          )}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex items-center justify-center size-9 rounded-full bg-primary/10 border border-primary/20 shrink-0 shadow-inner">
              {user.image ? (
                <img src={user.image} alt={user.name} loading="lazy" decoding="async" className="size-full rounded-full object-cover" />
              ) : (
                <UserIcon className="size-4 text-primary" />
              )}
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold truncate text-foreground leading-none">{user.name}</p>
                <p className="text-[10px] truncate text-muted-foreground mt-1">{user.email}</p>
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className={cn(
              "rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 transition-colors duration-200",
              isCollapsed ? "size-9" : "size-8"
            )}
            title="Déconnexion"
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>
    </aside>
  )
}
