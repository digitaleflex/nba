"use client"

import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { authClient } from "@nba/lib/auth-client"
import { Button } from "@nba/design-system"
import { TrendingUp, LogOut, Radio, LayoutDashboard } from "lucide-react"

export function DashboardHeader({ user }: { user: { name: string; email: string } }) {
  const router = useRouter()
  const pathname = usePathname()

  async function handleLogout() {
    await authClient.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <header className="glass-strong sticky top-0 z-50 border-b px-6 py-3">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center gap-3">
            <TrendingUp className="size-5 text-primary" />
            <span className="text-sm font-semibold">
              <span className="text-primary">Never</span>BrokeAgain
            </span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/dashboard"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === "/dashboard"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              <LayoutDashboard className="size-4" />
              Tableau de bord
            </Link>
            <Link
              href="/dashboard/signals"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                pathname.startsWith("/dashboard/signals")
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              <Radio className="size-4" />
              Signaux
            </Link>
          </nav>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">{user.name}</span>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="size-3.5 mr-1.5" />
            Déconnexion
          </Button>
        </div>
      </div>
    </header>
  )
}
