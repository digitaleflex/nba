"use client"

import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { authClient } from "@nba/lib/auth-client"
import { Button } from "@nba/design-system"
import {
  LogOut,
  Radio,
  LayoutDashboard,
  User,
  CreditCard,
  Bell,
  Menu,
  X,
} from "lucide-react"
import { useState } from "react"
import { PushNotificationToggle } from "@nba/components/push-notification-toggle"

const NAV_ITEMS = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard, matchExact: true },
  { href: "/dashboard/signals", label: "Signaux", icon: Radio, matchExact: false },
  { href: "/dashboard/profile", label: "Profil", icon: User, matchExact: false },
  { href: "/dashboard/subscription", label: "Abonnement", icon: CreditCard, matchExact: false },
  { href: "/dashboard/notifications", label: "Notifications", icon: Bell, matchExact: false },
]

export function DashboardHeader({ user }: { user: { name: string; email: string } }) {
  const router = useRouter()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleLogout() {
    await authClient.signOut()
    router.push("/login")
    router.refresh()
  }

  function isActive(item: typeof NAV_ITEMS[number]) {
    return item.matchExact ? pathname === item.href : pathname.startsWith(item.href)
  }

  return (
    <header className="glass-strong sticky top-0 z-50 border-b px-4 sm:px-6 py-3">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-3 shrink-0">
            <Image
              src="/logo.png"
              alt="NeverBrokeAgain"
              width={32}
              height={32}
              className="rounded-lg"
              priority
            />
            <span className="text-sm font-semibold hidden sm:inline">
              <span className="text-primary">Never</span>BrokeAgain
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive(item)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <PushNotificationToggle compact />
          <span className="text-sm text-muted-foreground hidden sm:block">{user.name}</span>
          <Button variant="outline" size="sm" onClick={handleLogout} className="hidden sm:inline-flex">
            <LogOut className="size-3.5 mr-1.5" />
            Déconnexion
          </Button>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg text-muted-foreground hover:bg-muted/50"
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="md:hidden mt-3 pb-2 flex flex-col gap-1 border-t border-border/40 pt-3">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive(item)
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          ))}
          <hr className="border-border/40 my-1" />
          <span className="px-3 py-1.5 text-xs text-muted-foreground">{user.name}</span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
          >
            <LogOut className="size-4" />
            Déconnexion
          </button>
        </nav>
      )}
    </header>
  )
}
