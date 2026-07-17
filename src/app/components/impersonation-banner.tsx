"use client"

import { useEffect, useState } from "react"
import { authClient } from "@nba/lib/auth-client"
import { LogOut, Eye } from "lucide-react"

/**
 * Bannière affichée quand un admin est connecté "en tant que" un membre
 * (impersonation better-auth). Permet de reprendre sa session admin.
 */
export function ImpersonationBanner() {
  const { data: session } = authClient.useSession()
  const [targetName, setTargetName] = useState<string | null>(null)

  const isImpersonating = Boolean((session as any)?.session?.impersonatedBy)

  useEffect(() => {
    if (isImpersonating && session?.user) {
      setTargetName(session.user.name || session.user.email || "cet utilisateur")
    }
  }, [isImpersonating, session])

  if (!isImpersonating) return null

  const stop = async () => {
    await fetch("/api/admin/stop-impersonation", { method: "POST" })
    window.location.href = "/admin"
  }

  return (
    <div className="sticky top-0 z-[100] flex items-center justify-center gap-3 bg-amber-500 px-4 py-2 text-xs font-medium text-amber-950 shadow-md">
      <span className="flex items-center gap-1.5">
        <Eye className="size-3.5" />
        Mode impersonation — vous naviguez en tant que{" "}
        <b className="font-semibold">{targetName}</b>
      </span>
      <button
        type="button"
        onClick={stop}
        className="flex items-center gap-1 rounded-md bg-amber-950/15 px-2 py-1 font-semibold hover:bg-amber-950/25 transition-colors"
      >
        <LogOut className="size-3.5" />
        Reprendre mon compte
      </button>
    </div>
  )
}
