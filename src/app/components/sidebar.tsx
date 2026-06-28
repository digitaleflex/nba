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
        "hidden md:flex h-screen shrink-0 flex-col border-r bg-card/40 backdrop-blur-md sticky top-0 py-6 justify-between select-none transition-all duration-300 relative",
        isCollapsed ? "w-20 px-3" : "w-64 px-4"
      )}
    >
      {/* Toggle Button */}
      <button
        onClick={toggleCollapse}
        className="absolute -right-3 top-7 z-50 flex size-6 items-center justify-center rounded-full border bg-background text-muted-foreground hover:text-foreground shadow-xs cursor-pointer hover:scale-105 active:scale-95 transition-all"
        title={isCollapsed ? "Déplier la barre" : "Plier la barre"}
      >
        {isCollapsed ? <ChevronRight className="size-3.5" /> : <ChevronLeft className="size-3.5" />}
      </button>

      <div className="space-y-6">
        {/* Logo / Header */}
        <div className={cn("flex items-center gap-2 px-2", isCollapsed ? "justify-center" : "justify-between")}>
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg tracking-tight shrink-0">
            {isCollapsed ? (
              <span className="text-primary font-extrabold text-xl tracking-tighter">NBA</span>
            ) : (
              <span className="text-foreground"><span className="text-primary font-extrabold">Never</span>BrokeAgain</span>
            )}
          </Link>
          {!isCollapsed && isAdmin && (
            <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary uppercase tracking-wider shrink-0">
              Admin
            </span>
          )}
        </div>

        {/* Menu Navigation */}
        <nav className="space-y-1">
          {links.map((link, idx) => {
            const Icon = link.icon
            return (
              <Link
                key={idx}
                href={link.href}
                className={cn(
                  "flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 group relative",
                  isCollapsed ? "justify-center" : "gap-3",
                  link.active
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                )}
                title={isCollapsed ? link.label : undefined}
              >
                {link.active && (
                  <span className="absolute left-0 top-1/4 bottom-1/4 w-1 rounded-r-md bg-primary" />
                )}
                <Icon
                  className={cn(
                    "size-4.5 shrink-0 transition-transform duration-200 group-hover:scale-110",
                    link.active ? "text-primary" : "text-muted-foreground/75 group-hover:text-foreground"
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
                "flex items-center px-3 py-2.5 text-sm font-medium rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all duration-200 group mt-4 border border-dashed border-border",
                isCollapsed ? "justify-center" : "gap-3"
              )}
              title={isCollapsed ? "Accéder à l'Admin" : undefined}
            >
              <Shield className="size-4.5 text-muted-foreground/75 group-hover:text-primary transition-transform duration-200 group-hover:scale-110" />
              {!isCollapsed && <span>Accéder à l'Admin</span>}
            </Link>
          )}

          {/* Return to Dashboard for admins */}
          {isAdmin && (
            <Link
              href="/dashboard"
              className={cn(
                "flex items-center px-3 py-2.5 text-sm font-medium rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all duration-200 group mt-4 border border-dashed border-border",
                isCollapsed ? "justify-center" : "gap-3"
              )}
              title={isCollapsed ? "Retour au Dashboard" : undefined}
            >
              <LayoutDashboard className="size-4.5 text-muted-foreground/75 group-hover:text-primary transition-transform duration-200 group-hover:scale-110" />
              {!isCollapsed && <span>Retour au Dashboard</span>}
            </Link>
          )}
        </nav>
      </div>

      {/* User Section / Bottom */}
      <div className="border-t pt-4 space-y-4">
        <div className={cn("flex items-center justify-between px-2", isCollapsed ? "flex-col gap-4" : "gap-3")}>
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex items-center justify-center size-9 rounded-full bg-primary/10 border border-primary/20 shrink-0">
              {user.image ? (
                <img src={user.image} alt={user.name} className="size-full rounded-full object-cover" />
              ) : (
                <UserIcon className="size-4 text-primary" />
              )}
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold truncate text-foreground">{user.name}</p>
                <p className="text-[10px] truncate text-muted-foreground">{user.email}</p>
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className={cn(
              "rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 transition-colors",
              isCollapsed ? "size-9" : "size-8"
            )}
            title="Déconnexion"
          >
            <LogOut className="size-4.5" />
          </Button>
        </div>
      </div>
    </aside>
  )
}
