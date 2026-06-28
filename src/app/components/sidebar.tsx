"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { authClient } from "@nba/lib/auth-client"
import { Button, cn } from "@nba/design-system"
import {
  LayoutDashboard,
  TrendingUp,
  ListTodo,
  Radio,
  History,
  LogOut,
  Shield,
  User as UserIcon,
  ChevronLeft,
  ChevronRight,
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
  const activeTab = searchParams.get("tab") || "requests"

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
      href: "/signals",
      label: "Signaux de trading",
      icon: TrendingUp,
      active: pathname.startsWith("/signals"),
    },
  ]

  // Liens pour la console d'administration
  const adminLinks = [
    {
      href: "/admin?tab=requests",
      label: "Demandes d'accès",
      icon: ListTodo,
      active: pathname === "/admin" && activeTab === "requests",
    },
    {
      href: "/admin?tab=send",
      label: "Publier un Signal",
      icon: Radio,
      active: pathname === "/admin" && activeTab === "send",
    },
    {
      href: "/admin?tab=history",
      label: "Historique des signaux",
      icon: History,
      active: pathname === "/admin" && activeTab === "history",
    },
  ]

  const links = isAdmin ? adminLinks : userLinks
  const showAdminSwitch = !isAdmin && (user.role === "ADMIN" || user.role === "SUPER_ADMIN")

  return (
    <aside
      className={cn(
        "hidden md:flex h-screen shrink-0 flex-col border-r sticky top-0 py-6 justify-between select-none transition-all duration-300 z-40",
        "bg-neutral-50/80 dark:bg-neutral-950/80 backdrop-blur-xl border-neutral-200/60 dark:border-neutral-800/60 shadow-[1px_0_10px_rgba(0,0,0,0.015)]",
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
            return (
              <Link
                key={idx}
                href={link.href}
                className={cn(
                  "flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 group relative",
                  isCollapsed ? "justify-center" : "gap-3.5",
                  link.active
                    ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50"
                )}
                title={isCollapsed ? link.label : undefined}
              >
                {link.active && !isCollapsed && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 size-1.5 rounded-full bg-primary-foreground/80 animate-pulse" />
                )}
                <Icon
                  className={cn(
                    "size-5 shrink-0 transition-transform duration-200 group-hover:scale-105",
                    link.active ? "text-primary-foreground" : "text-muted-foreground/85 group-hover:text-foreground"
                  )}
                />
                {!isCollapsed && <span className="truncate">{link.label}</span>}
              </Link>
            )
          })}

          {/* Switch to Admin for privileged users */}
          {showAdminSwitch && (
            <Link
              href="/admin"
              className={cn(
                "flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 group mt-4 border border-dashed",
                "border-neutral-200/85 dark:border-neutral-850/85 text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5",
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
                "border-neutral-200/85 dark:border-neutral-850/85 text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5",
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
      <div className="border-t border-neutral-200/60 dark:border-neutral-800/60 pt-4">
        <div
          className={cn(
            "flex items-center justify-between rounded-2xl transition-all p-2",
            !isCollapsed && "bg-neutral-100/50 dark:bg-neutral-900/50 border border-neutral-200/30 dark:border-neutral-800/30",
            isCollapsed ? "flex-col gap-4" : "gap-3"
          )}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex items-center justify-center size-9 rounded-full bg-primary/10 border border-primary/20 shrink-0 shadow-inner">
              {user.image ? (
                <img src={user.image} alt={user.name} className="size-full rounded-full object-cover" />
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
