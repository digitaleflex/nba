"use client"

import { useRouter } from "next/navigation"
import { authClient } from "@nba/lib/auth-client"
import { Button } from "@nba/design-system"
import { LogOut } from "lucide-react"

export function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    await authClient.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <Button variant="outline" size="sm" onClick={handleLogout}>
      <LogOut className="size-3.5 mr-1.5" />
      Déconnexion
    </Button>
  )
}
