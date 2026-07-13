"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export function LiveRefresh({ intervalMs = 10000 }: { intervalMs?: number }) {
  const router = useRouter()
  const [updatedAt, setUpdatedAt] = useState<Date>(new Date())

  useEffect(() => {
    const id = setInterval(() => {
      router.refresh()
      setUpdatedAt(new Date())
    }, intervalMs)
    return () => clearInterval(id)
  }, [router, intervalMs])

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
      </span>
      Actualisé automatiquement · {updatedAt.toLocaleTimeString("fr-FR")}
    </span>
  )
}
