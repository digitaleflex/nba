"use client"

import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { authClient } from "@nba/lib/auth-client"
import { cn } from "@nba/design-system"
import {
  LayoutDashboard,
  TrendingUp,
  ListTodo,
  Radio,
  History,
  LogOut,
  Shield,
  CreditCard,
  Users,
} from "lucide-react"

interface MobileBottomNavProps {
  isAdmin?: boolean
  user: {
    id: string
    name: string
    email: string
    role?: string
  }
}

interface MobileNavLink {
  href: string
  label: string
  icon: any
  active: boolean
  onClick?: () => void
}

export function MobileBottomNav({ isAdmin = false, user }: MobileBottomNavProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const activeTab = searchParams.get("tab") || "requests"

  async function handleLogout() {
    if (!confirm("Voulez-vous vraiment vous déconnecter ?")) return
    await authClient.signOut()
    router.push("/login")
    router.refresh()
  }

  // Liens pour l'espace utilisateur mobile
  const userLinks: MobileNavLink[] = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      active: pathname === "/dashboard",
    },
    {
      href: "/dashboard/signals",
      label: "Signaux",
      icon: TrendingUp,
      active: pathname.startsWith("/dashboard/signals") || pathname.startsWith("/signals"),
    },
    {
      href: "/dashboard/verification",
      label: "Vérification",
      icon: Shield,
      active: pathname === "/dashboard/verification",
    },
    ...(user.role === "ADMIN" || user.role === "SUPER_ADMIN"
      ? [
          {
            href: "/admin",
            label: "Admin",
            icon: Shield,
            active: pathname.startsWith("/admin"),
          },
        ]
      : []),
    {
      href: "/dashboard/subscription",
      label: "Abonnement",
      icon: CreditCard,
      active: pathname === "/dashboard/subscription",
    },
  ]

  // Liens pour l'espace admin mobile
  const adminLinks: MobileNavLink[] = [
    {
      href: "/admin?tab=requests",
      label: "Accès",
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
      href: "/admin?tab=users",
      label: "Membres",
      icon: Users,
      active: pathname === "/admin" && activeTab === "users",
    },
    {
      href: "/dashboard",
      label: "Retour",
      icon: LayoutDashboard,
      active: false,
    },
  ]

  const links = isAdmin ? adminLinks : userLinks

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-16 border-t bg-card/85 backdrop-blur-lg px-2 select-none">
      <nav className="flex h-full items-center justify-around">
        {links.map((link, idx) => {
          const Icon = link.icon
          const isActive = link.active

          if (link.onClick) {
            return (
              <button
                key={idx}
                onClick={link.onClick}
                className="flex flex-col items-center justify-center flex-1 h-full gap-1 text-muted-foreground active:text-destructive transition-colors relative"
              >
                <Icon className="size-5 shrink-0" />
                <span className="text-[10px] font-medium tracking-tight">{link.label}</span>
              </button>
            )
          }

          return (
            <Link
              key={idx}
              href={link.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all duration-200 relative",
                isActive
                  ? "text-primary scale-105"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isActive && (
                <span className="absolute top-0 w-8 h-1 rounded-b-full bg-primary" />
              )}
              <Icon className={cn("size-5 shrink-0 transition-transform", isActive && "scale-110")} />
              <span className={cn("text-[10px] font-medium tracking-tight", isActive ? "font-bold text-primary" : "")}>
                {link.label}
              </span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
