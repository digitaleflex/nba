"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { cn } from "@nba/design-system"
import { useMessagingUnread } from "@nba/lib/messaging-unread"
import { useCommandPalette } from "@nba/components/command-palette"
import { useLogout } from "@nba/hooks/use-logout"
import {
  getMobileNavItems,
  isNavItemActive,
  type NavSpace,
  type UserRole,
} from "@nba/config/navigation"
import { useConfirm } from "@nba/components/confirm-dialog"
import { LogOut, Search } from "lucide-react"

interface MobileBottomNavProps {
  space: NavSpace
  user: {
    id: string
    name: string
    email: string
    role?: UserRole
  }
}

export function MobileBottomNav({ space, user }: MobileBottomNavProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { openPalette } = useCommandPalette()
  const { logout } = useLogout()
  const { unreadTotal } = useMessagingUnread()
  const [pendingRequests, setPendingRequests] = useState(0)
  useEffect(() => {
    if (space !== "admin") return
    const controller = new AbortController()
    fetch("/api/admin/access-requests?status=PENDING", { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: any) => {
        if (d?.total != null) setPendingRequests(d.total)
        else if (Array.isArray(d?.requests)) setPendingRequests(d.requests.length)
        else if (Array.isArray(d)) setPendingRequests(d.length)
      })
      .catch(() => {})
    return () => controller.abort()
  }, [space])

  const links = getMobileNavItems(space, user.role)
  const { confirm, node } = useConfirm()

  const messagesBadge = unreadTotal > 0 ? (unreadTotal > 9 ? "9+" : String(unreadTotal)) : null
  const requestsBadge =
    pendingRequests > 0 ? (pendingRequests > 9 ? "9+" : String(pendingRequests)) : null

  function badgeFor(item: (typeof links)[number]): string | null {
    if (item.badge === "messages" && messagesBadge) return messagesBadge
    if (item.badge === "pendingRequests" && requestsBadge) return requestsBadge
    return null
  }

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-card/85 backdrop-blur-lg px-1 select-none" style={{ height: "calc(4rem + env(safe-area-inset-bottom, 0px))", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      <nav className="flex h-16 items-center justify-around overflow-x-auto no-scrollbar">
        {links.map((link, idx) => {
          const Icon = link.icon
          const isActive = isNavItemActive(link, pathname, searchParams)
          const badge = badgeFor(link)

          return (
            <Link
              key={link.id}
              href={link.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-16 gap-1 transition-all duration-200 relative shrink-0 min-w-[3.75rem]",
                isActive
                  ? "text-primary scale-105"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {isActive && <span className="absolute top-0 w-8 h-1 rounded-b-full bg-primary" />}
              <span className="relative inline-flex">
                <Icon className={cn("size-5 shrink-0 transition-transform", isActive && "scale-110")} />
                {badge && (
                  <span className="absolute -top-1 -right-2 min-w-3.5 h-3.5 px-1 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center ring-2 ring-card">
                    {badge}
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
          className="flex flex-col items-center justify-center flex-1 h-16 gap-1 text-muted-foreground active:text-primary transition-colors relative shrink-0 min-w-[3.75rem]"
          aria-label="Rechercher (⌘K)"
        >
          <Search className="size-5 shrink-0" />
          <span className="text-[10px] font-medium tracking-tight">Recherche</span>
        </button>
        <button
          onClick={() =>
            confirm({
              title: "Voulez-vous vous déconnecter ?",
              description: "Vous devrez vous reconnecter pour accéder à votre compte.",
              confirmLabel: "Se déconnecter",
              onConfirm: logout,
            })
          }
          className="flex flex-col items-center justify-center flex-1 h-16 gap-1 text-muted-foreground active:text-destructive transition-colors relative shrink-0 min-w-[3.75rem]"
          aria-label="Déconnexion"
        >
          <LogOut className="size-5 shrink-0" />
          <span className="text-[10px] font-medium tracking-tight">Quitter</span>
        </button>
      </nav>
      {node}
    </div>
  )
}
