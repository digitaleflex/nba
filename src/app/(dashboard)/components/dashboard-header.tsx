"use client"

import { useRouter } from "next/navigation"
import { authClient } from "@nba/lib/auth-client"
import { Button } from "@nba/design-system"
import { TrendingUp, LogOut } from "lucide-react"

export function DashboardHeader({ user }: { user: { name: string; email: string } }) {
  const router = useRouter()

  async function handleLogout() {
    await authClient.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <header className="glass-strong sticky top-0 z-50 border-b px-6 py-3">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center gap-3">
          <TrendingUp className="size-5 text-primary" />
          <span className="text-sm font-semibold">
            <span className="text-primary">Never</span>BrokeAgain
          </span>
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
