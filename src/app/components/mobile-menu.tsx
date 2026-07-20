"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, Button, cn } from "@nba/design-system"
import { PushNotificationToggle } from "@nba/components/push-notification-toggle"
import { useLogout } from "@nba/hooks/use-logout"
import {
  getMenuNavItems,
  getSidebarSections,
  isNavItemActive,
  type NavSpace,
  type UserRole,
} from "@nba/config/navigation"
import {
  LayoutDashboard,
  LogOut,
  Menu,
  Shield,
  X,
} from "lucide-react"

interface MobileMenuProps {
  space: NavSpace
  user: {
    id: string
    name: string
    email: string
    image?: string | null
    role?: UserRole
  }
}

export function MobileMenu({ space, user }: MobileMenuProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { logout } = useLogout()

  const links = getMenuNavItems(space, user.role)
  const showAdminSwitch = space === "dashboard" && (user.role === "ADMIN" || user.role === "SUPER_ADMIN")

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
            {space === "admin" ? (
              (() => {
                const sections = getSidebarSections("admin", user.role)
                return sections.flatMap((section, si) => {
                  const sectionLinks = section.items
                  if (sectionLinks.length === 0) return []
                  return [
                    si > 0 ? <div key={`sep-${section.id}`} className="h-3" /> : null,
                    <p key={`h-${section.id}`} className="px-3 pt-1 pb-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      {section.label}
                    </p>,
                    ...sectionLinks.map((link) => {
                      const Icon = link.icon
                      const isActive = isNavItemActive(link, pathname, searchParams)
                      return (
                        <Link
                          key={link.id}
                          id={link.id}
                          href={link.href}
                          onClick={() => setOpen(false)}
                          className={cn(
                            "flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-xl transition-colors min-h-[44px]",
                            isActive
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
                const isActive = isNavItemActive(link, pathname, searchParams)
                return (
                  <Link
                    key={link.id}
                    id={link.id}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-xl transition-colors min-h-[44px]",
                      isActive
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

            {space === "admin" && (
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
              onClick={logout}
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
