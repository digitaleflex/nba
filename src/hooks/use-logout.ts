"use client"

import { useRouter } from "next/navigation"
import { authClient } from "@nba/lib/auth-client"

interface UseLogoutOptions {
  confirm?: boolean
  redirectTo?: string
}

export function useLogout(options: UseLogoutOptions = {}) {
  const router = useRouter()
  const { confirm: shouldConfirm = true, redirectTo = "/login" } = options

  async function logout() {
    if (shouldConfirm) {
      const confirmed = window.confirm("Voulez-vous vraiment vous déconnecter ?")
      if (!confirmed) return
    }

    await authClient.signOut()
    router.push(redirectTo)
    router.refresh()
  }

  return { logout }
}
