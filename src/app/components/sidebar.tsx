"use client"

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
    <aside className="hidden md:flex h-screen w-64 shrink-0 flex-col border-r bg-card/40 backdrop-blur-md sticky top-0 px-4 py-6 justify-between select-none">
      <div className="space-y-6">
        {/* Logo / Header */}
        <div className="flex items-center justify-between px-2">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg tracking-tight">
            <span className="text-primary font-extrabold">Never</span>BrokeAgain
          </Link>
          {isAdmin && (
            <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary uppercase tracking-wider">
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
                  "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 group relative",
                  link.active
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                )}
              >
                {link.active && (
                  <span className="absolute left-0 top-1/4 bottom-1/4 w-1 rounded-r-md bg-primary" />
                )}
                <Icon className={cn("size-4.5 shrink-0 transition-transform duration-200 group-hover:scale-110", link.active ? "text-primary" : "text-muted-foreground/75 group-hover:text-foreground")} />
                {link.label}
              </Link>
            )
          })}

          {/* Switch to Admin for privileged users */}
          {showAdminSwitch && (
            <Link
              href="/admin"
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all duration-200 group mt-4 border border-dashed border-border"
            >
              <Shield className="size-4.5 text-muted-foreground/75 group-hover:text-primary transition-transform duration-200 group-hover:scale-110" />
              Accéder à l'Admin
            </Link>
          )}

          {/* Return to Dashboard for admins */}
          {isAdmin && (
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all duration-200 group mt-4 border border-dashed border-border"
            >
              <LayoutDashboard className="size-4.5 text-muted-foreground/75 group-hover:text-primary transition-transform duration-200 group-hover:scale-110" />
              Retour au Dashboard
            </Link>
          )}
        </nav>
      </div>

      {/* User Section / Bottom */}
      <div className="border-t pt-4 space-y-4">
        <div className="flex items-center justify-between px-2 gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex items-center justify-center size-9 rounded-full bg-primary/10 border border-primary/20 shrink-0">
              {user.image ? (
                <img src={user.image} alt={user.name} className="size-full rounded-full object-cover" />
              ) : (
                <UserIcon className="size-4 text-primary" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold truncate text-foreground">{user.name}</p>
              <p className="text-[10px] truncate text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="size-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 transition-colors"
            title="Déconnexion"
          >
            <LogOut className="size-4.5" />
          </Button>
        </div>
      </div>
    </aside>
  )
}
