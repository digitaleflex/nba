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
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const modalRef = useRef<HTMLDivElement>(null)

  const allOptions = results ? [
    ...results.users.map((u) => ({ type: "user" as const, id: u.id, label: u.name })),
    ...results.signals.map((s) => ({ type: "signal" as const, id: s.id, label: s.content })),
    ...results.kyc.map((k) => ({ type: "kyc" as const, id: k.id, label: `${k.user.name} (${k.documentType})` })),
    ...results.audit.map((a) => ({ type: "audit" as const, id: a.id, label: a.action })),
  ] : []

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

  useEffect(() => {
    if (query.length < 2) {
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

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      setIsOpen(false)
    }
  }

  const navigateTo = (tab: string, extra?: string) => {
    setIsOpen(false)
    setQuery("")
    setResults(null)
    setFocusedIndex(-1)
    const url = extra ? `/admin?tab=${tab}&${extra}` : `/admin?tab=${tab}`
    router.push(url)
  }

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setFocusedIndex((prev) => (prev < allOptions.length - 1 ? prev + 1 : 0))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setFocusedIndex((prev) => (prev > 0 ? prev - 1 : allOptions.length - 1))
    } else if (e.key === "Enter" && focusedIndex >= 0 && focusedIndex < allOptions.length) {
      e.preventDefault()
      const option = allOptions[focusedIndex]
      if (option.type === "user") navigateTo("users", `search=${encodeURIComponent(option.label)}`)
      else if (option.type === "signal") navigateTo("signals", `edit=${option.id}`)
      else if (option.type === "kyc") navigateTo("kyc", `id=${option.id}`)
      else if (option.type === "audit") navigateTo("audit")
    }
  }

  return (
    <>
      <header className="hidden md:flex h-14 border-b bg-background/80 backdrop-blur-xl sticky top-0 z-30 px-6 items-center justify-between border-border/60">
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2.5 px-3 py-1.5 w-64 text-left text-xs text-muted-foreground rounded-lg border border-border/60 bg-muted/30 hover:bg-muted/50 hover:border-border transition-all select-none cursor-pointer"
        >
          <Search className="size-3.5 text-muted-foreground/70" />
          <span>Rechercher...</span>
          <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-0.5 rounded border bg-background px-1.5 font-mono text-[9px] font-medium text-muted-foreground shadow-sm">
            <span className="text-[10px]">⌘</span>K
          </kbd>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/admin?tab=dashboard")}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors relative cursor-pointer"
            title="Operations Center"
          >
            <CheckSquare className="size-4" />
          </button>

          <AdminInbox />

          <NotificationBell />

          <PushNotificationToggle compact />

          <div className="flex items-center gap-2 pl-3 border-l border-border/60">
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

      {isOpen && (
        <div
          onClick={handleOverlayClick}
          className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/40 backdrop-blur-sm animate-in fade-in duration-150"
        >
          <div
            ref={modalRef}
            className="w-full max-w-lg rounded-2xl border bg-card text-card-foreground shadow-2xl overflow-hidden border-border/60 shadow-black/10 animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center gap-3 px-4 border-b border-border/60">
              <Search className="size-4.5 text-muted-foreground shrink-0" />
              <input
                type="text"
                autoFocus
                placeholder="Rechercher des utilisateurs, signaux, audits..."
                value={query}
                onChange={(e) => { setQuery(e.target.value); setFocusedIndex(-1) }}
                onKeyDown={handleInputKeyDown}
                className="w-full h-12 bg-transparent text-sm border-0 focus:outline-none focus:ring-0 text-foreground placeholder:text-muted-foreground/50"
                role="combobox"
                aria-expanded={!!results}
                aria-controls="search-results"
                aria-autocomplete="list"
                aria-activedescendant={focusedIndex >= 0 ? `search-option-${focusedIndex}` : undefined}
              />
              {loading && <Loader2 className="size-4.5 text-muted-foreground animate-spin shrink-0" />}
            </div>

            <div id="search-results" className="max-h-[350px] overflow-y-auto p-2" role="listbox">
              {query.length < 2 ? (
                <div className="py-8 text-center text-xs text-muted-foreground select-none">
                  Tapez au moins 2 caractères pour rechercher...
                </div>
              ) : results ? (
                <div className="space-y-4 p-1">
                  {results.users.length > 0 && (
                    <div>
                      <h4 className="px-2 pb-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Utilisateurs</h4>
                      <div className="space-y-0.5">
                        {results.users.map((u, i) => (
                          <button key={u.id} id={`search-option-${i}`} onClick={() => navigateTo("users", `search=${encodeURIComponent(u.email)}`)} role="option" aria-selected={focusedIndex === i} className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors text-left text-foreground cursor-pointer ${focusedIndex === i ? "bg-muted" : "hover:bg-muted/50"}`}>
                            <div>
                              <p className="font-semibold">{u.name}</p>
                              <p className="text-[10px] text-muted-foreground">{u.email}</p>
                            </div>
                            <ArrowRight className="size-3.5 text-muted-foreground/40" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {results.signals.length > 0 && (
                    <div>
                      <h4 className="px-2 pb-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Signaux</h4>
                      <div className="space-y-0.5">
                        {results.signals.map((s, i) => {
                          const idx = results.users.length + i
                          return (<button key={s.id} id={`search-option-${idx}`} onClick={() => navigateTo("signals", `edit=${s.id}`)} role="option" aria-selected={focusedIndex === idx} className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors text-left text-foreground cursor-pointer ${focusedIndex === idx ? "bg-muted" : "hover:bg-muted/50"}`}>
                            <span className="truncate pr-4 font-medium">{s.content}</span>
                            <span className="rounded bg-primary/10 px-1 text-[9px] text-primary uppercase shrink-0">{s.status}</span>
                          </button>)
                        })}
                      </div>
                    </div>
                  )}

                  {results.kyc.length > 0 && (
                    <div>
                      <h4 className="px-2 pb-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Dossiers KYC</h4>
                      <div className="space-y-0.5">
                        {results.kyc.map((k, i) => {
                          const idx = results.users.length + results.signals.length + i
                          return (<button key={k.id} id={`search-option-${idx}`} onClick={() => navigateTo("kyc", `id=${k.id}`)} role="option" aria-selected={focusedIndex === idx} className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors text-left text-foreground cursor-pointer ${focusedIndex === idx ? "bg-muted" : "hover:bg-muted/50"}`}>
                            <div>
                              <p className="font-semibold">{k.user.name}</p>
                              <p className="text-[10px] text-muted-foreground">{k.documentType} • {k.status}</p>
                            </div>
                            <ArrowRight className="size-3.5 text-muted-foreground/40" />
                          </button>)
                        })}
                      </div>
                    </div>
                  )}

                  {results.audit.length > 0 && (
                    <div>
                      <h4 className="px-2 pb-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Audit</h4>
                      <div className="space-y-0.5">
                        {results.audit.map((a, i) => {
                          const idx = results.users.length + results.signals.length + results.kyc.length + i
                          return (<button key={a.id} id={`search-option-${idx}`} onClick={() => navigateTo("audit")} role="option" aria-selected={focusedIndex === idx} className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors text-left text-foreground cursor-pointer ${focusedIndex === idx ? "bg-muted" : "hover:bg-muted/50"}`}>
                            <div>
                              <p className="font-semibold truncate">{a.action}</p>
                              <p className="text-[10px] text-muted-foreground">{a.resourceType}</p>
                            </div>
                            <span className="text-[9px] text-muted-foreground shrink-0">{new Date(a.createdAt).toLocaleDateString()}</span>
                          </button>)
                        })}
                      </div>
                    </div>
                  )}

                  {results.users.length === 0 && results.signals.length === 0 && results.kyc.length === 0 && results.audit.length === 0 && (
                    <div className="py-8 text-center text-xs text-muted-foreground select-none">
                      Aucun résultat pour « {query} »
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
