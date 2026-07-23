"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { PALETTE_ACTIONS, isMac } from "@nba/lib/command-palette-actions"

export function useGlobalShortcuts(enabled = true) {
  const router = useRouter()

  useEffect(() => {
    if (!enabled) return

    function onKey(e: KeyboardEvent) {
      const isMod = isMac() ? e.metaKey : e.ctrlKey

      if (isMod && e.key.toLowerCase() === "k") {
        e.preventDefault()
        window.dispatchEvent(new CustomEvent("open-command-palette"))
        return
      }

      const tag = (e.target as HTMLElement | null)?.tagName
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement | null)?.isContentEditable) return
      if (isMod || e.altKey) return

      const key = e.key.toLowerCase()
      const action = PALETTE_ACTIONS.find((a) => a.shortcut?.toLowerCase() === key)
      if (action) {
        e.preventDefault()
        router.push(action.href)
      }
    }

    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [router, enabled])
}
