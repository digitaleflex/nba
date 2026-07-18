"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { authClient } from "@nba/lib/auth-client"
import { cn } from "@nba/design-system"
import { useMessagingUnread } from "@nba/lib/messaging-unread"
import { PushNotificationToggle } from "@nba/components/push-notification-toggle"
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
  Bell,
  MessageCircle,
  Gauge,
  Activity,
  Gavel,
  ShieldCheck,
  Search,
} from "lucide-react"
import { ADMIN_CONTEXTS, getContextForTab } from "@nba/app/(admin)/admin/admin-context"
import { useCommandPalette } from "@nba/components/command-palette"

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

  const [pendingRequests, setPendingRequests] = useState(0)
  const [pendingKyc, setPendingKyc] = useState(0)
  useEffect(() => {
    if (!isAdmin) return
    const controller = new AbortController()
    fetch("/api/admin/access-requests?status=PENDING", { signal: controller.signal })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d?.total != null) setPendingRequests(d.total)
        else if (Array.isArray(d?.requests)) setPendingRequests(d.requests.length)
        else if (Array.isArray(d)) setPendingRequests(d.length)
      })
      .catch(() => {})
    fetch("/api/admin/kyc?status=PENDING", { signal: controller.signal })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d?.total != null) setPendingKyc(d.total)
        else if (Array.isArray(d?.docs)) setPendingKyc(d.docs.length)
        else if (Array.isArray(d)) setPendingKyc(d.length)
      })
      .catch(() => {})
    return () => controller.abort()
  }, [isAdmin])

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
      href: "/dashboard/notifications",
      label: "Notifs",
      icon: Bell,
      active: pathname.startsWith("/dashboard/notifications"),
    },
    {
      href: "/dashboard/messages",
      label: "Messages",
      icon: MessageCircle,
      active: pathname.startsWith("/dashboard/messages"),
    },
  ]

  // Liens pour l'espace admin mobile : 4 contextes mentaux max
  const currentContext = getContextForTab(activeTab)
  const adminLinks: MobileNavLink[] = ADMIN_CONTEXTS.map((context) => {
    const repr = context.tabs[0]
    return {
      href: `/admin?tab=${repr.value}`,
      label: context.label,
      icon: context.icon,
      active: pathname === "/admin" && currentContext === context.id,
    }
  })

  const links = isAdmin ? adminLinks : userLinks

  const { openPalette } = useCommandPalette()

  const { unreadTotal } = useMessagingUnread()
  const messagesBadge = unreadTotal > 0 ? (unreadTotal > 9 ? "9+" : String(unreadTotal)) : null

  return (
    <>
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-16 border-t bg-card/85 backdrop-blur-lg px-2 select-none">
        <nav className="flex h-full items-center justify-around">
          {links.map((link, idx) => {
          const Icon = link.icon
          const isActive = link.active
          const showBadge = link.href === "/dashboard/messages" && !!messagesBadge
          const showAccesBadge =
            isAdmin && link.href === "/admin?tab=requests" && pendingRequests > 0
          const showKycBadge =
            isAdmin && link.href === "/admin?tab=kyc" && pendingKyc > 0
          const badgeContent = showAccesBadge
            ? (pendingRequests > 9 ? "9+" : String(pendingRequests))
            : showKycBadge
              ? (pendingKyc > 9 ? "9+" : String(pendingKyc))
              : messagesBadge

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
              <span className="relative inline-flex">
                <Icon className={cn("size-5 shrink-0 transition-transform", isActive && "scale-110")} />
                {(showBadge || showAccesBadge || showKycBadge) && (
                  <span className="absolute -top-1 -right-2 min-w-3.5 h-3.5 px-1 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center ring-2 ring-card">
                    {badgeContent}
                  </span>
                )}
              </span>
              <span className={cn("text-[10px] font-medium tracking-tight", isActive ? "font-bold text-primary" : "")}>
                {link.label}
              </span>
            </Link>
          )
        })}
        <button
          onClick={openPalette}
          className="flex flex-col items-center justify-center flex-1 h-full gap-1 text-muted-foreground active:text-primary transition-colors relative"
          aria-label="Rechercher"
        >
          <Search className="size-5 shrink-0" />
          <span className="text-[10px] font-medium tracking-tight">Recherche</span>
        </button>
        <PushNotificationToggle compact />
      </nav>
      </div>
    </>
  )
}
