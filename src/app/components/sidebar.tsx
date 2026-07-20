"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { Button, Badge, cn } from "@nba/design-system"
import { useMessagingUnread } from "@nba/lib/messaging-unread"
import { useLogout } from "@nba/hooks/use-logout"
import { usePendingKyc } from "@nba/hooks/use-pending-kyc"
import {
  getSidebarSections,
  isNavItemActive,
  type NavSpace,
  type UserRole,
} from "@nba/config/navigation"
import {
  LayoutDashboard,
  LogOut,
  Shield,
  User as UserIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

interface SidebarProps {
  space: NavSpace
  user: {
    id: string
    name: string
    email: string
    image?: string | null
    role?: UserRole
  }
}

export function Sidebar({ space, user }: SidebarProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { logout } = useLogout({ confirm: false })
  const { unreadTotal } = useMessagingUnread()
  const pendingKyc = usePendingKyc(space === "admin")

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

  const sections = getSidebarSections(space, user.role)
  const isMessagesLink = (href: string) =>
    href === "/dashboard/messages" || href === "/admin/messages"

  const messagesBadge =
    unreadTotal > 0 ? (unreadTotal > 9 ? "9+" : String(unreadTotal)) : null

  const showAdminSwitch = space === "dashboard" && (user.role === "ADMIN" || user.role === "SUPER_ADMIN")

  return (
    <aside
      className={cn(
        "hidden md:flex h-screen shrink-0 flex-col border-r sticky top-0 py-6 justify-between select-none transition-all duration-300 z-40",
        "bg-card/80 backdrop-blur-xl border-border shadow-[1px_0_10px_rgba(0,0,0,0.015)]",
        isCollapsed ? "w-20 px-3" : "w-64 px-5"
      )}
    >
      <button
        onClick={toggleCollapse}
        className="absolute -right-3 top-7 z-50 flex size-6 items-center justify-center rounded-full border bg-background text-muted-foreground hover:text-foreground shadow-sm cursor-pointer hover:scale-110 active:scale-95 transition-all duration-200"
        title={isCollapsed ? "Déplier la barre" : "Plier la barre"}
      >
        {isCollapsed ? <ChevronRight className="size-3.5" /> : <ChevronLeft className="size-3.5" />}
      </button>

      <div className="flex flex-col min-h-0 flex-1 space-y-7 overflow-y-auto">
        <div className={cn("flex items-center gap-2 px-2 shrink-0", isCollapsed ? "justify-center" : "justify-between")}>
          <Link href="/dashboard" className="flex items-center gap-2.5 font-bold text-lg tracking-tight shrink-0">
            {isCollapsed ? (
              <span className="bg-primary text-primary-foreground font-black text-sm rounded-lg size-8 flex items-center justify-center shadow-xs select-none">NB</span>
            ) : (
              <span className="text-foreground tracking-tight"><span className="text-primary font-black">Never</span>BrokeAgain</span>
            )}
          </Link>
          {!isCollapsed && space === "admin" && (
            <span className="rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[9px] font-bold text-primary uppercase tracking-wider shrink-0">
              Admin
            </span>
          )}
        </div>

        <nav className={isCollapsed ? "space-y-1.5" : "space-y-5"}
        >
          {sections.map((section, sectionIdx) => (
            <div key={section.id} className={cn("space-y-1", sectionIdx > 0 && !isCollapsed && "pt-2")}>
              {!isCollapsed && section.label && (
                <p className="flex items-center gap-2 px-3 text-[10px] uppercase font-bold tracking-widest text-muted-foreground/50">
                  {section.label}
                  {section.id === "decider" && pendingKyc > 0 ? (
                    <span className="inline-flex min-w-4 h-4 px-1 items-center justify-center rounded-full bg-primary text-primary-foreground text-[9px] font-bold tabular-nums">
                      {pendingKyc > 9 ? "9+" : pendingKyc}
                    </span>
                  ) : null}
                </p>
              )}
              {section.items.map((link) => {
                const Icon = link.icon
                const isActive = isNavItemActive(link, pathname, searchParams)
                const showBadge = isMessagesLink(link.href) && !!messagesBadge
                return (
                  <Link
                    key={link.id}
                    id={link.id}
                    href={link.href}
                    className={cn(
                      "flex items-center px-3 py-2 text-sm font-medium rounded-xl transition-all duration-200 group relative",
                      isCollapsed ? "justify-center" : "gap-3.5",
                      isActive
                        ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                    title={isCollapsed ? link.label : undefined}
                  >
                    {isActive && !isCollapsed && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 size-1.5 rounded-full bg-primary-foreground/80 animate-pulse" />
                    )}
                    <span className="relative inline-flex shrink-0">
                      <Icon
                        className={cn(
                          "size-5 transition-transform duration-200 group-hover:scale-105",
                          isActive ? "text-primary-foreground" : "text-muted-foreground/85 group-hover:text-foreground"
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
            </div>
          ))}

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

          {space === "admin" && (
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

      <div className="border-t border-border pt-4 shrink-0">
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
            onClick={logout}
            className={cn(
              "rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 transition-colors duration-200",
              isCollapsed ? "size-9" : "size-8"
            )}
            title="Déconnexion"
            aria-label="Déconnexion"
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>
    </aside>
  )
}
