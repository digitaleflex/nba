"use client"

import { Clock, Plus, X } from "lucide-react"
import { cn } from "@nba/design-system"
import { useAdminPreferences } from "../hooks/useAdminPreferences"
import { getTabLabel } from "../admin-context"

interface AdminRecentsProps {
  onNavigate: (tab: string, search?: string) => void
  onOpenPanel?: (user: { userId: string; name: string; email: string }) => void
}

export function AdminRecents({ onNavigate, onOpenPanel }: AdminRecentsProps) {
  const { prefs, updatePrefs, removeWatchedUser } = useAdminPreferences()

  if (prefs.favoriteTabs.length === 0 && prefs.recentSearches.length === 0 && prefs.watchedUsers.length === 0) {
    return null
  }

  return (
    <div className="space-y-5">
      {prefs.favoriteTabs.length > 0 && (
        <div>
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2.5">Vos raccourcis</h3>
          <div className="flex flex-wrap gap-1.5">
            {prefs.favoriteTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => onNavigate(tab)}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer"
              >
                {getTabLabel(tab)}
              </button>
            ))}
          </div>
        </div>
      )}

      {prefs.recentSearches.length > 0 && (
        <div>
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2.5">Recherches récentes</h3>
          <div className="space-y-0.5">
            {prefs.recentSearches.slice(0, 5).map((search, i) => (
              <button
                key={i}
                onClick={() => onNavigate(search.tab, search.query)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2 min-w-0">
                  <Clock className="size-3 text-muted-foreground shrink-0" />
                  <span className="truncate">{search.query}</span>
                </span>
                <span className="text-muted-foreground shrink-0 ml-2">{search.resultCount} résultats</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {prefs.watchedUsers.length > 0 && (
        <div>
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2.5">Utilisateurs surveillés</h3>
          <div className="space-y-0.5">
            {prefs.watchedUsers.slice(0, 5).map((user) => (
              <div
                key={user.userId}
                className="flex items-center justify-between px-3 py-2 rounded-lg text-xs hover:bg-muted/50 transition-colors group"
              >
                <button
                  onClick={() => onOpenPanel?.({ userId: user.userId, name: user.name, email: user.email })}
                  className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer"
                >
                  <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                    {user.name?.slice(0, 2).toUpperCase() || user.email?.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="text-left min-w-0">
                    <p className="font-medium truncate">{user.name || user.email}</p>
                    <p className="text-muted-foreground truncate">Dernière vérif: {formatTimeAgo(user.lastChecked)}</p>
                  </div>
                </button>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  {user.alertCount > 0 && (
                    <span className="size-5 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold">
                      {user.alertCount}
                    </span>
                  )}
                  <button
                    onClick={() => removeWatchedUser(user.userId)}
                    className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-muted transition-all cursor-pointer"
                    aria-label="Retirer"
                  >
                    <X className="size-3 text-muted-foreground" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function formatTimeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return "à l'instant"
  if (seconds < 3600) return `il y a ${Math.floor(seconds / 60)}min`
  if (seconds < 86400) return `il y a ${Math.floor(seconds / 3600)}h`
  return `il y a ${Math.floor(seconds / 86400)}j`
}
