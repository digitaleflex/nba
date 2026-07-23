"use client"

import { useEffect, useRef, useState, useCallback, createContext, useContext } from "react"
import { useRouter } from "next/navigation"
import { Search, Users, Megaphone, Zap, Loader2, CornerDownLeft } from "lucide-react"
import { Dialog, DialogContent, Input, useIsMobile } from "@nba/design-system"
import { PALETTE_ACTIONS, isMac, type PaletteAction } from "@nba/lib/command-palette-actions"
import { useGlobalShortcuts } from "@nba/hooks/use-global-shortcuts"
import { BottomSheet, BottomSheetContent, BottomSheetHeader } from "@nba/design-system"

interface MemberResult {
  type: "member"
  id: string
  title: string
  subtitle: string
  href: string
}

interface SignalResult {
  type: "signal"
  id: string
  title: string
  subtitle: string
  href: string
}

type Result = MemberResult | SignalResult | PaletteAction

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}


function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
}

function score(needle: string, hay: string): number {
  if (!needle) return 1
  const h = normalize(hay)
  const n = normalize(needle)
  if (h.startsWith(n)) return 3
  if (h.includes(" " + n) || h.includes("-" + n) || h.includes("_" + n)) return 2
  if (h.includes(n)) return 1
  return 0
}

function PaletteContent({
  query,
  setQuery,
  loading,
  members,
  signals,
  filteredActions,
  activeIdx,
  setActiveIdx,
  allResults,
  handleSelect,
  handleKeyDown,
  inputRef,
  listRef,
  isMobile,
}: {
  query: string
  setQuery: (v: string) => void
  loading: boolean
  members: MemberResult[]
  signals: SignalResult[]
  filteredActions: PaletteAction[]
  activeIdx: number
  setActiveIdx: (v: number) => void
  allResults: Result[]
  handleSelect: (r: Result) => void
  handleKeyDown: (e: React.KeyboardEvent) => void
  inputRef: React.RefObject<HTMLInputElement | null>
  listRef: React.RefObject<HTMLDivElement | null>
  isMobile: boolean
}) {
  const hasResults = allResults.length > 0
  const showServerHint = loading && query.length >= 2

  return (
    <div onKeyDown={handleKeyDown} className="flex flex-col">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
        <Search className="size-4 text-muted-foreground shrink-0" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={isMobile ? "Rechercher..." : "Rechercher membres, signaux, actions..."}
          className="border-0 bg-transparent shadow-none h-8 px-0 text-sm focus-visible:ring-0"
          aria-label="Recherche"
        />
        {loading && <Loader2 className="size-3.5 animate-spin text-muted-foreground" />}
        <kbd className="hidden md:inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">
          <span className="text-xs">esc</span>
        </kbd>
      </div>

      <div ref={listRef} className="max-h-[60dvh] md:max-h-[420px] overflow-y-auto p-1.5">
        {!hasResults && !loading && (
          <div className="py-10 text-center text-xs text-muted-foreground">
            {query ? `Aucun résultat pour "${query}"` : "Tapez pour rechercher..."}
          </div>
        )}

        {hasResults && (
          <div className="space-y-3">
            {members.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <Users className="size-3" />
                  Membres
                </div>
                <div className="space-y-0.5">
                  {members.map((m, i) => {
                    const idx = i
                    return (
                      <button
                        key={m.id}
                        data-result-idx={idx}
                        onClick={() => handleSelect(m)}
                        onMouseEnter={() => setActiveIdx(idx)}
                        className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-md text-left transition-colors ${
                          activeIdx === idx ? "bg-muted" : "hover:bg-muted/50"
                        }`}
                      >
                        <div className="size-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
                          {m.title.slice(0, 1).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{m.title}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{m.subtitle}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {signals.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <Megaphone className="size-3" />
                  Signaux
                </div>
                <div className="space-y-0.5">
                  {signals.map((s, i) => {
                    const idx = members.length + i
                    return (
                      <button
                        key={s.id}
                        data-result-idx={idx}
                        onClick={() => handleSelect(s)}
                        onMouseEnter={() => setActiveIdx(idx)}
                        className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-md text-left transition-colors ${
                          activeIdx === idx ? "bg-muted" : "hover:bg-muted/50"
                        }`}
                      >
                        <div className="size-7 rounded bg-accent/10 text-accent flex items-center justify-center shrink-0">
                          <Megaphone className="size-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{s.title}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{s.subtitle}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {filteredActions.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <Zap className="size-3" />
                  Actions & Navigation
                </div>
                <div className="space-y-0.5">
                  {filteredActions.map((a, i) => {
                    const idx = members.length + signals.length + i
                    return (
                      <button
                        key={a.id}
                        data-result-idx={idx}
                        onClick={() => handleSelect(a)}
                        onMouseEnter={() => setActiveIdx(idx)}
                        className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-md text-left transition-colors ${
                          activeIdx === idx ? "bg-muted" : "hover:bg-muted/50"
                        }`}
                      >
                        <div className="size-7 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <Zap className="size-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{a.title}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{a.subtitle}</p>
                        </div>
                        {a.shortcut && (
                          <kbd className="hidden md:inline-flex h-5 min-w-5 select-none items-center justify-center rounded border border-border bg-muted px-1 font-mono text-[10px] text-muted-foreground">
                            {a.shortcut}
                          </kbd>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {showServerHint && !hasResults && (
          <div className="py-6 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
            <Loader2 className="size-3 animate-spin" />
            Recherche...
          </div>
        )}
      </div>

      <div className="hidden md:flex items-center justify-between border-t border-border px-3 py-1.5 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <kbd className="inline-flex h-4 select-none items-center rounded border border-border bg-muted px-1 font-mono">↑</kbd>
            <kbd className="inline-flex h-4 select-none items-center rounded border border-border bg-muted px-1 font-mono">↓</kbd>
            naviguer
          </span>
          <span className="flex items-center gap-1">
            <CornerDownLeft className="size-3" />
            ouvrir
          </span>
        </div>
        <span className="flex items-center gap-1">
          <kbd className="inline-flex h-4 select-none items-center rounded border border-border bg-muted px-1 font-mono">{isMac() ? "⌘" : "Ctrl"}</kbd>
          <kbd className="inline-flex h-4 select-none items-center rounded border border-border bg-muted px-1 font-mono">K</kbd>
        </span>
      </div>
    </div>
  )
}

function canUseAction(action: PaletteAction, role?: string): boolean {
  if (!action.requiredRole) return true
  if (!role) return false
  if (action.requiredRole === "SUPER_ADMIN") return role === "SUPER_ADMIN"
  return role === "ADMIN" || role === "SUPER_ADMIN"
}

export function CommandPalette({ open, onOpenChange, userRole }: CommandPaletteProps & { userRole?: string }) {
  const router = useRouter()
  const isMobile = useIsMobile()
  const [query, setQuery] = useState("")
  const [activeIdx, setActiveIdx] = useState(0)
  const [loading, setLoading] = useState(false)
  const [members, setMembers] = useState<MemberResult[]>([])
  const [signals, setSignals] = useState<SignalResult[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const filteredActions: PaletteAction[] = (query
    ? PALETTE_ACTIONS
        .map((a) => ({ a, s: Math.max(score(query, a.title), score(query, a.subtitle)) }))
        .filter((x) => x.s > 0)
        .sort((x, y) => y.s - x.s)
        .map((x) => x.a)
    : PALETTE_ACTIONS)
    .filter((a) => canUseAction(a, userRole))

  useEffect(() => {
    if (!open) {
      setQuery("")
      setActiveIdx(0)
      setMembers([])
      setSignals([])
      return
    }
    if (!query || query.length < 2) {
      setMembers([])
      setSignals([])
      return
    }
    setLoading(true)
    const t = setTimeout(() => {
      fetch(`/api/admin/command-palette/search?q=${encodeURIComponent(query)}`)
        .then((r) => r.json())
        .then((data) => {
          setMembers(data.members ?? [])
          setSignals(data.signals ?? [])
        })
        .catch(() => {
          setMembers([])
          setSignals([])
        })
        .finally(() => setLoading(false))
    }, 200)
    return () => clearTimeout(t)
  }, [query, open])

  const allResults: Result[] = [...members, ...signals, ...filteredActions]

  useEffect(() => {
    if (activeIdx >= allResults.length) setActiveIdx(0)
  }, [allResults.length, activeIdx])

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 50)
      return () => clearTimeout(t)
    }
  }, [open])

  const handleSelect = useCallback(
    (result: Result) => {
      onOpenChange(false)
      router.push(result.href)
    },
    [router, onOpenChange]
  )

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIdx((i) => Math.min(allResults.length - 1, i + 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIdx((i) => Math.max(0, i - 1))
    } else if (e.key === "Enter") {
      e.preventDefault()
      const r = allResults[activeIdx]
      if (r) handleSelect(r)
    } else if (e.key === "Escape") {
      onOpenChange(false)
    }
  }

  useEffect(() => {
    if (!listRef.current) return
    const el = listRef.current.querySelector<HTMLElement>(`[data-result-idx="${activeIdx}"]`)
    el?.scrollIntoView({ block: "nearest" })
  }, [activeIdx])

  if (isMobile) {
    return (
      <BottomSheet open={open} onOpenChange={onOpenChange}>
        <BottomSheetContent className="max-h-[90dvh] p-0 gap-0">
          <PaletteContent
            query={query}
            setQuery={setQuery}
            loading={loading}
            members={members}
            signals={signals}
            filteredActions={filteredActions}
            activeIdx={activeIdx}
            setActiveIdx={setActiveIdx}
            allResults={allResults}
            handleSelect={handleSelect}
            handleKeyDown={handleKeyDown}
            inputRef={inputRef}
            listRef={listRef}
            isMobile={true}
          />
        </BottomSheetContent>
      </BottomSheet>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-xl p-0 gap-0 sm:max-w-xl"
        showCloseButton={false}
      >
        <PaletteContent
          query={query}
          setQuery={setQuery}
          loading={loading}
          members={members}
          signals={signals}
          filteredActions={filteredActions}
          activeIdx={activeIdx}
          setActiveIdx={setActiveIdx}
          allResults={allResults}
          handleSelect={handleSelect}
          handleKeyDown={handleKeyDown}
          inputRef={inputRef}
          listRef={listRef}
          isMobile={false}
        />
      </DialogContent>
    </Dialog>
  )
}

export function CommandPaletteProvider({ children, userRole }: { children: React.ReactNode; userRole?: string }) {
  const [open, setOpen] = useState(false)
  const openPalette = useCallback(() => setOpen(true), [])

  useGlobalShortcuts()

  useEffect(() => {
    function onOpenEvent() {
      setOpen(true)
    }
    window.addEventListener("open-command-palette", onOpenEvent)
    return () => window.removeEventListener("open-command-palette", onOpenEvent)
  }, [])

  return (
    <CommandPaletteContext.Provider value={{ openPalette }}>
      {children}
      <CommandPalette open={open} onOpenChange={setOpen} userRole={userRole} />
    </CommandPaletteContext.Provider>
  )
}

const CommandPaletteContext = createContext<{ openPalette: () => void }>({
  openPalette: () => {},
})

export function useCommandPalette() {
  return useContext(CommandPaletteContext)
}
