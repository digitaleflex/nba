"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import {
  Search,
  Shield,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Download,
  Trash2,
  Clock,
  User,
  Globe,
  AlertCircle,
  RefreshCw,
  Filter,
  X,
  FileText,
  Users,
  LayoutGrid,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import type { AuditEvent, AuditFilters, AuditView } from "@nba/lib/audit/types"
import { getActionColor, getActionLabel, getResourceLabel } from "@nba/lib/audit/labels"
import { renderDescription } from "@nba/lib/audit/renderers"
import { useSocket } from "@nba/lib/hooks/use-socket"

const ITEMS_PER_PAGE = 30

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "À l'instant"
  if (mins < 60) return `Il y a ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Il y a ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 30) return `Il y a ${days}j`
  const months = Math.floor(days / 30)
  return `Il y a ${months} mois`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString("fr-FR", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

const COLOR_MAP = {
  emerald: "border-l-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/10 text-emerald-700 dark:text-emerald-400",
  rose: "border-l-rose-500 bg-rose-50/50 dark:bg-rose-950/10 text-rose-700 dark:text-rose-400",
  blue: "border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/10 text-blue-700 dark:text-blue-400",
  amber: "border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/10 text-amber-700 dark:text-amber-400",
  muted: "border-l-muted-foreground/20 bg-muted/30 text-muted-foreground",
}

export default function AuditCenterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [logs, setLogs] = useState<AuditEvent[]>([])
  const [total, setTotal] = useState(0)
  const [filters, setFilters] = useState<AuditFilters | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [newEventCount, setNewEventCount] = useState(0)
  const pendingEvents = useRef<AuditEvent[]>([])

  const query = searchParams.get("q") ?? ""
  const actionFilter = searchParams.get("action") ?? ""
  const resourceTypeFilter = searchParams.get("resourceType") ?? ""
  const resourceId = searchParams.get("resourceId") ?? ""
  const view = (searchParams.get("view") as AuditView) ?? "timeline"
  const page = parseInt(searchParams.get("page") ?? "1")

  const updateParams = useCallback((updates: Record<string, string | null>) => {
    const p = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "") p.delete(key)
      else p.set(key, value)
    }
    if (updates.page === undefined && !updates.hasOwnProperty("page")) p.set("page", "1")
    router.replace(`/admin/audit?${p.toString()}`)
  }, [router, searchParams])

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const p = new URLSearchParams()
      if (query) p.set("q", query)
      if (actionFilter) p.set("action", actionFilter)
      if (resourceTypeFilter) p.set("resourceType", resourceTypeFilter)
      if (resourceId) p.set("resourceId", resourceId)
      p.set("page", String(page))
      p.set("limit", String(ITEMS_PER_PAGE))

      const res = await fetch(`/api/admin/audit-logs?${p}`)
      if (!res.ok) throw new Error(`Erreur ${res.status}`)
      const data = await res.json()
      setLogs(data.logs)
      setTotal(data.total)
      setFilters(data.filters)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de chargement")
    } finally {
      setLoading(false)
    }
  }, [query, actionFilter, resourceTypeFilter, resourceId, page])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  const isLiveView = !query && !actionFilter && !resourceTypeFilter && !resourceId && view === "timeline"
  const { subscribe } = useSocket({})

  useEffect(() => {
    if (!isLiveView || !subscribe) return
    const off = subscribe<AuditEvent>("audit", (event) => {
      pendingEvents.current.push(event)
      setNewEventCount((n) => n + 1)
    })
    return off
  }, [isLiveView, subscribe])

  function acceptLiveEvents() {
    const events = pendingEvents.current
    pendingEvents.current = []
    setNewEventCount(0)
    setLogs((prev) => [...events, ...prev])
    setTotal((t) => t + events.length)
  }

  const groupedByUser = useMemo(() => {
    if (view !== "user") return null
    const groups = new Map<string, { user: AuditEvent["user"]; logs: AuditEvent[] }>()
    for (const log of logs) {
      const key = log.user?.email ?? log.user?.name ?? "Système"
      if (!groups.has(key)) groups.set(key, { user: log.user, logs: [] })
      groups.get(key)!.logs.push(log)
    }
    return Array.from(groups.entries()).map(([key, val]) => ({ key, ...val }))
  }, [view, logs])

  const groupedByResource = useMemo(() => {
    if (view !== "resource") return null
    const groups = new Map<string, { resourceType: string; resourceId: string | null; logs: AuditEvent[] }>()
    for (const log of logs) {
      if (!log.resourceId) continue
      const key = `${log.resourceType}:${log.resourceId}`
      if (!groups.has(key)) groups.set(key, { resourceType: log.resourceType, resourceId: log.resourceId, logs: [] })
      groups.get(key)!.logs.push(log)
    }
    return Array.from(groups.entries()).map(([key, val]) => ({ key, ...val }))
  }, [view, logs])

  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE))

  const activeChips: { label: string; onRemove: () => void }[] = []
  if (query) activeChips.push({ label: `Recherche : ${query}`, onRemove: () => updateParams({ q: null }) })
  if (actionFilter) activeChips.push({ label: `Action : ${getActionLabel(actionFilter)}`, onRemove: () => updateParams({ action: null }) })
  if (resourceTypeFilter) activeChips.push({ label: `Ressource : ${getResourceLabel(resourceTypeFilter)}`, onRemove: () => updateParams({ resourceType: null }) })
  if (resourceId) activeChips.push({ label: `ID ressource : ${resourceId.slice(0, 8)}...`, onRemove: () => updateParams({ resourceId: null }) })

  function renderDetails(log: AuditEvent) {
    if (!log.details) return null
    const d = log.details
    const pairs: { label: string; value: string }[] = []

    if (d.oldStatus && d.status) pairs.push({ label: "Transition", value: `${d.oldStatus} → ${d.status}` })
    if (d.fromStatus && d.toStatus) pairs.push({ label: "Transition", value: `${d.fromStatus} → ${d.toStatus}` })
    if (d.oldValue && d.newValue) pairs.push({ label: "Valeur modifiée", value: `${String(d.oldValue)} → ${String(d.newValue)}` })
    if (d.reason) pairs.push({ label: "Motif", value: String(d.reason) })
    if (d.notes) pairs.push({ label: "Notes", value: String(d.notes) })
    if (d.email) pairs.push({ label: "Email", value: String(d.email) })
    if (d.planName) pairs.push({ label: "Plan", value: String(d.planName) })
    if (d.planId && !d.planName) pairs.push({ label: "Plan", value: String(d.planId) })
    if (d.recipientCount) pairs.push({ label: "Destinataires", value: String(d.recipientCount) })
    if (d.bannedBy) pairs.push({ label: "Banni par", value: String(d.bannedBy) })
    if (d.bounceCount) pairs.push({ label: "Rebonds", value: String(d.bounceCount) })
    if (d.count && !d.recipientCount) pairs.push({ label: "Quantité", value: String(d.count) })
    if (d.error) pairs.push({ label: "Erreur", value: String(d.error) })
    if (d.queueFailed) pairs.push({ label: "File d'attente", value: "Échec partiel" })
    if (d.isScheduled) pairs.push({ label: "Planifié", value: "Oui" })

    if (d.changes && Array.isArray(d.changes)) {
      pairs.push({ label: "Modifications", value: d.changes.join(", ") })
    }

    if (pairs.length === 0) return null

    return (
      <div className="mt-3 space-y-1 text-xs text-muted-foreground">
        {pairs.map((p, i) => (
          <div key={i} className="flex gap-2">
            <span className="font-medium shrink-0 w-28">{p.label}</span>
            <span className="break-words">{p.value}</span>
          </div>
        ))}
      </div>
    )
  }

  function AuditCard({ log }: { log: AuditEvent }) {
    const color = getActionColor(log.action)
    const colorClasses = COLOR_MAP[color]
    const isExpanded = expandedId === log.id

    return (
      <div className={`border-l-2 rounded-lg border border-border/50 ${colorClasses.split(" ").slice(0, 2).join(" ")}`}>
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${colorClasses.split(" ").slice(2).join(" ")}`}>
                  {getActionLabel(log.action)}
                </span>
                <span className="text-[11px] text-muted-foreground/70">{getResourceLabel(log.resourceType)}</span>
                <span className="text-[11px] text-muted-foreground/50 hidden sm:inline">{formatDate(log.createdAt)}</span>
              </div>
              <p className="mt-1.5 text-sm text-foreground/90 leading-relaxed">
                {renderDescription({
                  action: log.action,
                  resourceType: log.resourceType,
                  resourceLabel: log.resourceLabel,
                  details: log.details,
                  user: log.user,
                })}
              </p>
            </div>
          </div>

          <div className="mt-2.5 flex items-center gap-3 text-[11px] text-muted-foreground/60 flex-wrap">
            <span className="inline-flex items-center gap-1">
              <User className="size-3" />
              {log.user?.name ?? log.user?.email ?? "Système"}
            </span>
            <span className="inline-flex items-center gap-1" title={formatDate(log.createdAt)}>
              <Clock className="size-3" />
              {timeAgo(log.createdAt)}
            </span>
            {log.ipAddress && (
              <span className="inline-flex items-center gap-1 font-mono">
                <Globe className="size-3" />
                {log.ipAddress}
              </span>
            )}

            <button
              onClick={() => setExpandedId(isExpanded ? null : log.id)}
              className="ml-auto inline-flex items-center gap-1 text-muted-foreground/50 hover:text-foreground transition-colors"
            >
              {isExpanded ? (
                <>Masquer les détails <ChevronUp className="size-3" /></>
              ) : (
                <>Détails <ChevronDown className="size-3" /></>
              )}
            </button>
          </div>

          {isExpanded && (
            <div className="mt-3 pt-3 border-t border-border/30">
              {renderDetails(log) ?? (
                <p className="text-xs text-muted-foreground/50">Aucun détail supplémentaire</p>
              )}
              {log.resourceId && (
                <button
                  onClick={() => updateParams({ resourceId: log.resourceId, page: "1" })}
                  className="mt-2 text-[11px] text-primary/70 hover:text-primary transition-colors"
                >
                  Voir toutes les actions sur cette ressource →
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Shield className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Centre d&apos;audit</h1>
            <p className="text-sm text-muted-foreground">{total} événement{total > 1 ? "s" : ""}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {newEventCount > 0 && (
            <button
              onClick={acceptLiveEvents}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/30 hover:bg-emerald-500/20 transition-colors animate-pulse"
            >
              <span className="size-1.5 rounded-full bg-emerald-500" />
              {newEventCount} nouveau{newEventCount > 1 ? "x" : ""} événement{newEventCount > 1 ? "s" : ""}
            </button>
          )}
          <button
            onClick={fetchLogs}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border/50 hover:bg-muted/50 transition-colors"
            title="Rafraîchir"
          >
            <RefreshCw className="size-3.5" />
            Actualiser
          </button>
          <button
            onClick={async () => {
              if (!filters) return
              const p = new URLSearchParams()
              if (query) p.set("q", query)
              if (actionFilter) p.set("action", actionFilter)
              if (resourceTypeFilter) p.set("resourceType", resourceTypeFilter)
              const res = await fetch(`/api/admin/audit-logs?${p}&limit=10000`)
              const data = await res.json()
              const rows = [["Date", "Action", "Ressource", "Utilisateur", "Email", "IP", "Description"]]
              for (const log of data.logs) {
                rows.push([
                  log.createdAt, getActionLabel(log.action), getResourceLabel(log.resourceType),
                  log.user?.name ?? "", log.user?.email ?? "", log.ipAddress ?? "",
                  renderDescription({
                    action: log.action, resourceType: log.resourceType,
                    resourceLabel: log.resourceLabel, details: log.details, user: log.user,
                  }),
                ])
              }
              const csv = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n")
              const blob = new Blob([csv], { type: "text/csv" })
              const url = URL.createObjectURL(blob)
              const a = document.createElement("a")
              a.href = url; a.download = `audit-${new Date().toISOString().slice(0, 10)}.csv`
              a.click(); URL.revokeObjectURL(url)
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border/50 hover:bg-muted/50 transition-colors"
          >
            <Download className="size-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50" />
          <input
            type="text"
            placeholder="Rechercher par action, ressource, utilisateur..."
            defaultValue={query}
            onKeyDown={(e) => {
              if (e.key === "Enter") updateParams({ q: (e.target as HTMLInputElement).value || null, page: "1" })
            }}
            className="w-full h-10 pl-9 pr-4 rounded-lg border border-border/50 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <select
          value={actionFilter}
          onChange={(e) => updateParams({ action: e.target.value || null, page: "1" })}
          className="h-10 rounded-lg border border-border/50 bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">Toutes les actions</option>
          {filters?.actions.map((a) => (
            <option key={a} value={a}>{getActionLabel(a)}</option>
          ))}
        </select>
        <select
          value={resourceTypeFilter}
          onChange={(e) => updateParams({ resourceType: e.target.value || null, page: "1" })}
          className="h-10 rounded-lg border border-border/50 bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">Toutes les ressources</option>
          {filters?.resourceTypes.map((r) => (
            <option key={r} value={r}>{getResourceLabel(r)}</option>
          ))}
        </select>
        <button
          onClick={() => updateParams({ q: null, action: null, resourceType: null, resourceId: null, page: null })}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border/50 hover:bg-muted/50 text-muted-foreground transition-colors"
        >
          <Filter className="size-3.5" />
          Réinitialiser
        </button>
      </div>

      {/* Active filters */}
      {activeChips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeChips.map((chip, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
              {chip.label}
              <button onClick={chip.onRemove} className="hover:text-primary/70"><X className="size-3" /></button>
            </span>
          ))}
        </div>
      )}

      {/* View tabs */}
      <div className="flex gap-1 border-b border-border/50">
        {([
          { key: "timeline", label: "Timeline", icon: LayoutGrid },
          { key: "user", label: "Par utilisateur", icon: Users },
          { key: "resource", label: "Par ressource", icon: FileText },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => updateParams({ view: tab.key === "timeline" ? null : tab.key, page: "1" })}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              view === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="size-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-8 text-muted-foreground/50 animate-spin" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <AlertCircle className="size-10 text-rose-500" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <button onClick={fetchLogs} className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border/50 text-sm font-medium hover:bg-muted/50">
            <RefreshCw className="size-4" /> Réessayer
          </button>
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Shield className="size-12 text-muted-foreground/20" />
          <p className="text-sm text-muted-foreground/60">Aucun événement trouvé.</p>
          <button
            onClick={() => updateParams({ q: null, action: null, resourceType: null, resourceId: null, page: null })}
            className="text-xs text-primary/70 hover:text-primary"
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : view === "user" && groupedByUser ? (
        <div className="space-y-6">
          {groupedByUser.map(({ key, user, logs: groupLogs }) => (
            <div key={key}>
              <div className="flex items-center gap-2 mb-3">
                <User className="size-4 text-muted-foreground/70" />
                <span className="text-sm font-medium">{user?.name ?? user?.email ?? "Système"}</span>
                <span className="text-xs text-muted-foreground/50">{groupLogs.length} action{groupLogs.length > 1 ? "s" : ""}</span>
              </div>
              <div className="space-y-2">
                {groupLogs.slice(0, 5).map((log) => <AuditCard key={log.id} log={log} />)}
                {groupLogs.length > 5 && (
                  <button onClick={() => updateParams({ q: user?.name ?? user?.email ?? "Système", view: "timeline" })} className="text-xs text-primary/70 hover:text-primary">
                    Voir les {groupLogs.length} actions...
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : view === "resource" && groupedByResource ? (
        <div className="space-y-6">
          {groupedByResource.map(({ key, resourceType, resourceId: rid, logs: groupLogs }) => (
            <div key={key}>
              <div className="flex items-center gap-2 mb-3">
                <FileText className="size-4 text-muted-foreground/70" />
                <span className="text-sm font-medium">{getResourceLabel(resourceType)}</span>
                {rid && <span className="text-xs font-mono text-muted-foreground/50">{rid.slice(0, 8)}...</span>}
                <span className="text-xs text-muted-foreground/50">{groupLogs.length} action{groupLogs.length > 1 ? "s" : ""}</span>
              </div>
              <div className="space-y-2">
                {groupLogs.slice(0, 5).map((log) => <AuditCard key={log.id} log={log} />)}
                {groupLogs.length > 5 && (
                  <button onClick={() => updateParams({ resourceId: rid, view: "timeline" })} className="text-xs text-primary/70 hover:text-primary">
                    Voir les {groupLogs.length} actions sur cette ressource...
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => <AuditCard key={log.id} log={log} />)}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-border/30">
          <p className="text-xs text-muted-foreground/50">
            Page {page} sur {totalPages} ({total} résultat{total > 1 ? "s" : ""})
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => updateParams({ page: String(page - 1) })}
              disabled={page <= 1}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-border/50 hover:bg-muted/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="size-3.5" /> Précédent
            </button>
            {page > 3 && <span className="text-xs text-muted-foreground/50">...</span>}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pg: number
              if (totalPages <= 5) pg = i + 1
              else if (page <= 3) pg = i + 1
              else if (page >= totalPages - 2) pg = totalPages - 4 + i
              else pg = page - 2 + i
              return (
                <button
                  key={pg}
                  onClick={() => updateParams({ page: String(pg) })}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                    pg === page ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  {pg}
                </button>
              )
            })}
            {page < totalPages - 2 && <span className="text-xs text-muted-foreground/50">...</span>}
            <button
              onClick={() => updateParams({ page: String(page + 1) })}
              disabled={page >= totalPages}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-border/50 hover:bg-muted/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Suivant <ChevronRight className="size-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Purge button — bottom */}
      <div className="flex justify-end pt-4 border-t border-border/30">
        <button
          onClick={async () => {
            if (!confirm("Supprimer les logs d'audit de plus de 90 jours ? Cette action est irréversible.")) return
            try {
              const res = await fetch("/api/admin/audit-logs", { method: "DELETE" })
              if (!res.ok) throw new Error()
              const data = await res.json()
              alert(`${data.deleted} logs supprimés (plus de ${data.olderThanDays} jours)`)
              fetchLogs()
            } catch {
              alert("Erreur lors de la purge")
            }
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-rose-200/50 text-rose-600 hover:bg-rose-50/50 dark:border-rose-900/30 dark:text-rose-400 dark:hover:bg-rose-950/20 transition-colors"
        >
          <Trash2 className="size-3.5" />
          Purger les logs &gt; 90 jours
        </button>
      </div>
    </div>
  )
}
