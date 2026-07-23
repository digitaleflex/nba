"use client"

import { useState } from "react"
import { Star } from "lucide-react"
import { cn } from "@nba/design-system"

interface FavoriteButtonProps {
  signalId: string
  initialFavorited?: boolean
  className?: string
}

export function FavoriteButton({ signalId, initialFavorited = false, className }: FavoriteButtonProps) {
  const [favorited, setFavorited] = useState(initialFavorited)
  const [loading, setLoading] = useState(false)

  async function handleToggle() {
    setLoading(true)
    try {
      const res = await fetch(`/api/signals/favorites/${signalId}`, { method: "POST" })
      if (res.ok) {
        const data = await res.json()
        setFavorited(data.favorited)
      }
    } catch {} finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={cn(
        "p-1.5 rounded-lg transition-colors cursor-pointer",
        favorited
          ? "text-amber-500 hover:text-amber-600 bg-amber-500/10 hover:bg-amber-500/15"
          : "text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted/50",
        className,
      )}
      aria-label={favorited ? "Retirer des favoris" : "Ajouter aux favoris"}
    >
      <Star className={cn("size-4", favorited && "fill-amber-500")} />
    </button>
  )
}
