"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Search, Bell, CheckSquare, User, Loader2, ArrowRight } from "lucide-react"
import { cn } from "@nba/design-system"
import { PushNotificationToggle } from "@nba/components/push-notification-toggle"
import { NotificationBell } from "@nba/components/notification-bell"
import { AdminInbox } from "./admin-inbox"

interface SearchResults {
  users: { id: string; name: string; email: string }[]
  signals: { id: string; content: string; status: string }[]
  kyc: { id: string; documentType: string; status: string; user: { name: string } }[]
  audit: { id: string; action: string; resourceType: string; createdAt: string }[]
}

interface AdminHeaderProps {
  user: {
    id: string
    name: string
    email: string
    image?: string | null
  }
}

export function AdminHeader({ user }: AdminHeaderProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResults | null>(null)
  const [loading, setLoading] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)

  // Écouter le raccourci Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setIsOpen(true)
      }
      if (e.key === "Escape") {
        setIsOpen(false)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Recherche avec debounce
  useEffect(() => {
    if (query.length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults(null)
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(query)}`)
        if (res.ok) {
          const data = await res.json()
          setResults(data)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [query])

  // Fermer la modale si on clique à l'extérieur
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      setIsOpen(false)
    }
  }

  const navigateTo = (tab: string, extra?: string) => {
    setIsOpen(false)
    setQuery("")
    setResults(null)
    const url = extra ? `/admin?tab=${tab}&${extra}` : `/admin?tab=${tab}`
    router.push(url)
  }

  return (
    <>
      <header className="hidden md:flex h-14 border-b bg-neutral-50/50 dark:bg-neutral-950/50 backdrop-blur-xl sticky top-0 z-30 px-8 items-center justify-between border-neutral-200/60 dark:border-neutral-800/60">
        {/* Search Input Trigger */}
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2.5 px-3 py-1.5 w-64 text-left text-xs text-muted-foreground rounded-lg border border-neutral-200/60 dark:border-neutral-800/60 bg-neutral-100/50 dark:bg-neutral-900/50 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-all select-none cursor-pointer"
        >
          <Search className="size-3.5 text-muted-foreground/80" />
          <span>Rechercher...</span>
          <kbd className="ml-auto pointer-events-none inline-flex h-4 select-none items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[9px] font-medium opacity-100">
            <span className="text-[10px]">⌘</span>K
          </kbd>
        </button>

        {/* User Actions */}
        <div className="flex items-center gap-4">
          {/* Action indicator (Requires attention) */}
          <button
            onClick={() => router.push("/admin?tab=dashboard")}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors relative cursor-pointer"
            title="Operations Center"
          >
            <CheckSquare className="size-4" />
          </button>

          {/* Inbox admin (KYC / broker / sécurité / système) */}
          <AdminInbox />

          {/* Notifications (temps réel) */}
          <NotificationBell />

          {/* Notifications push (web) */}
          <PushNotificationToggle compact />

          {/* Admin Profil */}
          <div className="flex items-center gap-2 pl-2 border-l border-neutral-200/60 dark:border-neutral-800/60">
            <div className="flex items-center justify-center size-7 rounded-full bg-primary/10 border border-primary/20 shrink-0">
              {user.image ? (
                <img src={user.image} alt={user.name} loading="lazy" decoding="async" className="size-full rounded-full object-cover" />
              ) : (
                <User className="size-3.5 text-primary" />
              )}
            </div>
            <span className="text-xs font-semibold text-foreground select-none">{user.name}</span>
          </div>
        </div>
      </header>

      {/* Global Command / Search Modal */}
      {isOpen && (
        <div
          onClick={handleOverlayClick}
          className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-neutral-950/45 dark:bg-neutral-950/70 backdrop-blur-md animate-in fade-in duration-150"
        >
          <div
            ref={modalRef}
            className="w-full max-w-lg rounded-2xl border bg-card text-card-foreground shadow-2xl overflow-hidden border-neutral-200/60 dark:border-neutral-800/60 animate-in zoom-in-95 duration-150"
          >
            {/* Input search */}
            <div className="flex items-center gap-3 px-4 border-b border-neutral-200/60 dark:border-neutral-800/60">
              <Search className="size-4.5 text-muted-foreground shrink-0" />
              <input
                type="text"
                autoFocus
                placeholder="Rechercher des utilisateurs, signaux, audits..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full h-12 bg-transparent text-sm border-0 focus:outline-none focus:ring-0 text-foreground placeholder:text-muted-foreground/60"
                role="combobox"
                aria-expanded={!!results}
                aria-controls="search-results"
                aria-autocomplete="list"
              />
              {loading && <Loader2 className="size-4.5 text-muted-foreground animate-spin shrink-0" />}
            </div>

            {/* Results list */}
            <div id="search-results" className="max-h-[350px] overflow-y-auto p-2" role="listbox">
              {query.length < 2 ? (
                <div className="py-8 text-center text-xs text-muted-foreground select-none">
                  Tapez au moins 2 caractères pour rechercher dans la plateforme...
                </div>
              ) : results ? (
                <div className="space-y-4 p-1">
                  {/* Users results */}
                  {results.users.length > 0 && (
                    <div>
                      <h4 className="px-2 pb-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Utilisateurs
                      </h4>
                      <div className="space-y-0.5">
                        {results.users.map((u) => (
                          <button
                            key={u.id}
                            onClick={() => navigateTo("users", `search=${encodeURIComponent(u.email)}`)}
                            role="option"
                            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors text-left text-foreground cursor-pointer"
                          >
                            <div>
                              <p className="font-semibold">{u.name}</p>
                              <p className="text-[10px] text-muted-foreground">{u.email}</p>
                            </div>
                            <ArrowRight className="size-3.5 text-muted-foreground/50" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Signals results */}
                  {results.signals.length > 0 && (
                    <div>
                      <h4 className="px-2 pb-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Signaux
                      </h4>
                      <div className="space-y-0.5">
                        {results.signals.map((s) => (
                          <button
                            key={s.id}
                            onClick={() => navigateTo("signals", `edit=${s.id}`)}
                            role="option"
                            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors text-left text-foreground cursor-pointer"
                          >
                            <span className="truncate pr-4 font-medium">{s.content}</span>
                            <span className="rounded bg-primary/10 px-1 text-[9px] text-primary uppercase shrink-0">
                              {s.status}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* KYC results */}
                  {results.kyc.length > 0 && (
                    <div>
                      <h4 className="px-2 pb-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Dossiers KYC
                      </h4>
                      <div className="space-y-0.5">
                        {results.kyc.map((k) => (
                          <button
                            key={k.id}
                            onClick={() => navigateTo("kyc", `id=${k.id}`)}
                            role="option"
                            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors text-left text-foreground cursor-pointer"
                          >
                            <div>
                              <p className="font-semibold">{k.user.name}</p>
                              <p className="text-[10px] text-muted-foreground">{k.documentType} • {k.status}</p>
                            </div>
                            <ArrowRight className="size-3.5 text-muted-foreground/50" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Audit results */}
                  {results.audit.length > 0 && (
                    <div>
                      <h4 className="px-2 pb-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Activités d&apos;audit
                      </h4>
                      <div className="space-y-0.5">
                        {results.audit.map((a) => (
                          <button
                            key={a.id}
                            onClick={() => navigateTo("audit")}
                            role="option"
                            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors text-left text-foreground cursor-pointer"
                          >
                            <div>
                              <p className="font-semibold truncate">{a.action}</p>
                              <p className="text-[10px] text-muted-foreground">Type : {a.resourceType}</p>
                            </div>
                            <span className="text-[9px] text-muted-foreground shrink-0">
                              {new Date(a.createdAt).toLocaleDateString()}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty state */}
                  {results.users.length === 0 &&
                    results.signals.length === 0 &&
                    results.kyc.length === 0 &&
                    results.audit.length === 0 && (
                      <div className="py-8 text-center text-xs text-muted-foreground select-none">
                        Aucun résultat trouvé pour « {query} »
                      </div>
                    )}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-muted-foreground select-none">
                  Recherche en cours...
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
