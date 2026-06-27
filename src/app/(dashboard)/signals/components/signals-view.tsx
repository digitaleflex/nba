"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import Link from "next/link"
import { Card, CardContent, Badge, Input, Button } from "@nba/design-system"
import {
  Radio,
  Search,
  RefreshCw,
  Clock,
  Image as ImageIcon,
  Loader2,
  Info,
} from "lucide-react"
import { parseSimpleMarkdown } from "@nba/lib/utils"

interface SignalData {
  id: string
  content: string
  imageUrl: string | null
  imageUrls: string[]
  publishedAt: string | null
  createdAt: string
  creatorName: string
  audience: string[]
  read: boolean
  viewCount: number
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface Summary {
  new: number
  unread: number
  group: string | null
  lastUpdate: string | null
}

interface ApiResponse {
  signals: SignalData[]
  pagination: Pagination
  summary: Summary
}

type FilterKey = "all" | "unread" | "today" | "week" | "forex" | "deriv" | "forex+deriv"

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "Tous" },
  { key: "unread", label: "Non lus" },
  { key: "today", label: "Aujourd'hui" },
  { key: "week", label: "Cette semaine" },
  { key: "forex", label: "Forex" },
  { key: "deriv", label: "Deriv" },
  { key: "forex+deriv", label: "Forex + Deriv" },
]

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDays = Math.floor((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return "Aujourd'hui"
  if (diffDays === 1) return "Hier"
  if (diffDays <= 7) return "Cette semaine"
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
}

function getDateGroup(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDays = Math.floor((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return "Aujourd'hui"
  if (diffDays === 1) return "Hier"
  return target.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })
}

function SignalCard({ signal }: { signal: SignalData }) {
  return (
    <Link href={`/dashboard/signals/${signal.id}`} className="block">
      <Card className="relative overflow-hidden border border-border/50 bg-card hover:border-primary/30 hover:shadow-sm transition-all duration-200 cursor-pointer">
        {!signal.read && (
          <div className="absolute right-3 top-3 z-10">
            <Badge variant="default" className="bg-primary text-primary-foreground text-[10px] tracking-wider font-bold uppercase px-2 py-0.5 animate-pulse">
              Nouveau
            </Badge>
          </div>
        )}
        <CardContent className="p-4 sm:p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="size-3.5 shrink-0" />
            <span>{formatRelativeDate(signal.publishedAt || signal.createdAt)}</span>
            <span aria-hidden="true">•</span>
            <span>{formatTime(signal.publishedAt || signal.createdAt)}</span>
            {!signal.read && <span className="size-1.5 rounded-full bg-primary shrink-0" aria-hidden="true" />}
          </div>

          <div
            className="text-sm text-foreground whitespace-pre-wrap leading-relaxed break-words line-clamp-6"
            dangerouslySetInnerHTML={{ __html: parseSimpleMarkdown(signal.content) }}
          />

          {Array.isArray(signal.imageUrls) && signal.imageUrls.length > 0 && (
            <div className="flex gap-2 pt-1">
              {signal.imageUrls.slice(0, 2).map((url, idx) => (
                <div key={idx} className="relative overflow-hidden rounded-lg border border-border/60 bg-background/50 aspect-video w-24 sm:w-28 shrink-0">
                  <img
                    src={`/api/files/${url}`}
                    alt=""
                    className="size-full object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
              {signal.imageUrls.length > 2 && (
                <div className="flex items-center justify-center aspect-video w-24 sm:w-28 shrink-0 rounded-lg border border-border/60 bg-muted/30">
                  <div className="text-center">
                    <ImageIcon className="size-4 mx-auto text-muted-foreground/60" />
                    <span className="text-[10px] text-muted-foreground/60 font-medium">+{signal.imageUrls.length - 2}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {signal.imageUrl && !signal.imageUrls?.length && (
            <div className="overflow-hidden rounded-lg border border-border/60 bg-background/50 aspect-video max-w-sm">
              <img
                src={`/api/files/${signal.imageUrl}`}
                alt=""
                className="size-full object-cover"
                loading="lazy"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

export function SignalsView() {
  const [signals, setSignals] = useState<SignalData[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const debouncedSearch = useDebounce(searchQuery, 300)

  const fetchSignals = useCallback(async (pageNum: number, append: boolean) => {
    const params = new URLSearchParams()
    params.set("page", String(pageNum))
    params.set("limit", "20")
    if (debouncedSearch) params.set("search", debouncedSearch)
    if (activeFilter !== "all") params.set("filter", activeFilter)

    try {
      if (append) setLoadingMore(true)
      else setLoading(true)
      setError(null)

      const res = await fetch(`/api/dashboard/signals?${params}`)
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = "/login"
          return
        }
        throw new Error("Erreur lors du chargement")
      }

      const data: ApiResponse = await res.json()
      if (append) {
        setSignals((prev) => [...prev, ...data.signals])
      } else {
        setSignals(data.signals)
      }
      setPagination(data.pagination)
      setSummary(data.summary)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue")
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [debouncedSearch, activeFilter])

  useEffect(() => {
    fetchSignals(1, false)
  }, [fetchSignals])

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        fetchSignals(1, false)
      }
    }
    document.addEventListener("visibilitychange", onVisible)
    return () => document.removeEventListener("visibilitychange", onVisible)
  }, [fetchSignals])

  const handleLoadMore = () => {
    if (pagination && pagination.page < pagination.totalPages) {
      fetchSignals(pagination.page + 1, true)
    }
  }

  const handleRefresh = () => {
    fetchSignals(1, false)
  }

  const filteredSignals = useMemo(() => {
    if (activeFilter !== "unread") return signals
    return signals.filter((s) => !s.read)
  }, [signals, activeFilter])

  const groupedFiltered = useMemo(() => {
    const groups: Record<string, SignalData[]> = {}
    for (const sig of filteredSignals) {
      const group = getDateGroup(sig.publishedAt || sig.createdAt)
      if (!groups[group]) groups[group] = []
      groups[group].push(sig)
    }
    return groups
  }, [filteredSignals])

  if (error && signals.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Signaux</h1>
        </div>
        <Card className="border-destructive/30">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Info className="size-10 text-destructive" />
            <p className="font-semibold text-destructive">Erreur de chargement</p>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Signaux</h1>
          {summary && summary.group && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {summary.group}
            </p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
          <RefreshCw className={`size-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
          Actualiser
        </Button>
      </div>

      {summary && (summary.new > 0 || summary.unread > 0) && (
        <Card className="border-primary/10 bg-primary/[0.02]">
          <CardContent className="py-3 px-4 sm:px-5">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs sm:text-sm">
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-primary animate-pulse shrink-0" />
                <span className="font-medium text-foreground whitespace-nowrap">{summary.new} nouveau{summary.new > 1 ? "x" : ""}</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <span className="size-2 rounded-full bg-muted-foreground/40 shrink-0" />
                <span className="whitespace-nowrap">{summary.unread} non lu{summary.unread > 1 ? "s" : ""}</span>
              </div>
              {summary.lastUpdate && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground w-full sm:w-auto sm:ml-auto">
                  <Clock className="size-3 shrink-0" />
                  <span className="truncate">Dernière màj : il y a {getTimeAgo(summary.lastUpdate)}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Rechercher dans les signaux…"
          className="pl-9 h-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="flex gap-2 overflow-x-auto -mx-6 px-6 pb-1 scrollbar-none snap-x snap-mandatory sm:flex-wrap sm:overflow-visible sm:mx-0 sm:px-0 sm:pb-0">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            className={`shrink-0 snap-center px-3 py-1.5 text-xs font-medium rounded-full border transition-colors whitespace-nowrap ${
              activeFilter === f.key
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : summary && !summary.group ? (
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center max-w-lg mx-auto">
            <Radio className="size-10 text-warning" />
            <div className="space-y-1.5">
              <h3 className="font-semibold text-warning">Aucun abonnement actif</h3>
              <p className="text-sm text-muted-foreground">
                Vous n'avez actuellement accès à aucun groupe de diffusion.
                Complétez votre parcours ou contactez l'administration.
              </p>
            </div>
            <Link href="/onboarding">
              <Button variant="outline" size="sm">Compléter mon onboarding</Button>
            </Link>
          </CardContent>
        </Card>
      ) : filteredSignals.length === 0 ? (
        <Card className="border-border">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Radio className="size-10 text-muted-foreground" />
            <div className="space-y-1">
              <p className="font-semibold text-foreground">Aucun signal disponible</p>
              <p className="text-sm text-muted-foreground">
                {searchQuery
                  ? "Aucun signal ne correspond à votre recherche."
                  : "Aucun signal n'a encore été publié pour vos groupes. Les nouveaux signaux apparaîtront automatiquement ici."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedFiltered).map(([group, sigs]) => (
            <div key={group} className="space-y-3">
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  {group}
                </h2>
                <div className="flex-1 h-px bg-border/60" />
                <span className="text-xs text-muted-foreground/60">{sigs.length} signal{sigs.length > 1 ? "s" : ""}</span>
              </div>
              <div className="grid gap-3">
                {sigs.map((sig) => (
                  <SignalCard key={sig.id} signal={sig} />
                ))}
              </div>
            </div>
          ))}

          {pagination && pagination.page < pagination.totalPages && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Chargement…
                  </>
                ) : (
                  `Charger plus (${pagination.total - pagination.page * pagination.limit} restants)`
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function getTimeAgo(dateStr: string): string {
  const now = Date.now()
  const diff = now - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return "quelques secondes"
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} h`
  const days = Math.floor(hours / 24)
  return `${days} j`
}
