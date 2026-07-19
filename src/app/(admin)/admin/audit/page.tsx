"use client"

export const dynamic = "force-dynamic"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import {
  Search, Shield, Loader2, ChevronLeft, ChevronRight, Download, Trash2,
  Clock, User, Globe, AlertCircle, RefreshCw, Filter, X, FileText,
  Users, LayoutGrid, ChevronDown, ChevronUp, ExternalLink,
} from "lucide-react"
import type { AuditEvent, AuditFilters, AuditView } from "@nba/lib/audit/types"
import { getActionIcon, getActionLabel, getResourceIcon, getResourceLabel } from "@nba/lib/audit/labels"
import { renderDescription } from "@nba/lib/audit/renderers"
import { useSocket } from "@nba/lib/hooks/use-socket"

const ITEMS_PER_PAGE = 30

const RESOURCE_ROUTES: Record<string, string> = {
  signal: "/admin/signals",
  user: "/admin/members",
  kyc_document: "/admin/kyc",
  broker_verification: "/admin/brokers",
  subscription: "/admin/subscriptions",
  access_request: "/admin/access-requests",
  resend_domain: "/admin/emails/domains",
  webhook_dlq: "/admin/webhooks/dlq",
  settings: "/admin/settings",
}

const SEVERITY_CONFIG = {
  error: { label: "Erreur", color: "bg-rose-500", textColor: "text-rose-600 dark:text-rose-400", bgColor: "bg-rose-50/50 dark:bg-rose-950/10" },
  warning: { label: "Avertissement", color: "bg-amber-500", textColor: "text-amber-600 dark:text-amber-400", bgColor: "bg-amber-50/50 dark:bg-amber-950/10" },
  info: { label: "Information", color: "bg-blue-500", textColor: "text-blue-600 dark:text-blue-400", bgColor: "bg-blue-50/50 dark:bg-blue-950/10" },
} as const

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const secs = Math.floor(diff / 1000)
  if (secs < 60) return `Il y a ${secs}s`
  const mins = Math.floor(secs / 60)
  if (mins < 60) return mins === 1 ? "Il y a 1 min" : `Il y a ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return hours === 1 ? "Il y a 1h" : `Il y a ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 30) return days === 1 ? "Il y a 1j" : `Il y a ${days}j`
  const months = Math.floor(days / 30)
  return months === 1 ? "Il y a 1 mois" : `Il y a ${months} mois`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString("fr-FR", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

function Avatar({ name, email, image }: { name?: string | null; email?: string | null; image?: string | null }) {
  const initials = (name ?? email ?? "S")[0].toUpperCase()
  if (image) return <img src={image} alt="" className="size-6 rounded-full" />
  return (
    <span className="size-6 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">
      {initials}
    </span>
  )
}

function cleanDetails(details: Record<string, unknown> | null): { pairs: { label: string; value: string }[]; metrics: { label: string; value: string }[] } {
  if (!details) return { pairs: [], metrics: [] }
  const d = details
  const pairs: { label: string; value: string }[] = []
  const metrics: { label: string; value: string }[] = []

  if (d.oldStatus && d.status) pairs.push({ label: "Transition", value: `${d.oldStatus} → ${d.status}` })
  if (d.fromStatus && d.toStatus) pairs.push({ label: "Transition", value: `${d.fromStatus} → ${d.toStatus}` })
  if (d.oldValue && d.newValue) pairs.push({ label: "Valeur modifiée", value: `${String(d.oldValue)} → ${String(d.newValue)}` })
  if (d.reason) pairs.push({ label: "Motif", value: String(d.reason) })
  if (d.notes) pairs.push({ label: "Notes", value: String(d.notes) })
  if (d.email) pairs.push({ label: "Email", value: String(d.email) })
  if (d.planName) pairs.push({ label: "Plan", value: String(d.planName) })
  if (d.planId && !d.planName) pairs.push({ label: "Plan", value: String(d.planId) })
  if (d.bannedBy) pairs.push({ label: "Banni par", value: String(d.bannedBy) })
  if (d.error) pairs.push({ label: "Erreur", value: String(d.error) })
  if (d.userAgent) pairs.push({ label: "Navigateur", value: String(d.userAgent) })
  if (d.domain) pairs.push({ label: "Domaine", value: String(d.domain) })

  // Snapshot avant/après (MT7)
  if (d.before && d.after && typeof d.before === "object" && typeof d.after === "object") {
    const before = d.before as Record<string, unknown>
    const after = d.after as Record<string, unknown>
    const allKeys = [...new Set([...Object.keys(before), ...Object.keys(after)])].filter(
      (k) => k !== "updatedAt" && k !== "id"
    )
    for (const key of allKeys) {
      if (String(before[key] ?? "") !== String(after[key] ?? "")) {
        pairs.push({
          label: key,
          value: `${String(before[key] ?? "—")} → ${String(after[key] ?? "—")}`,
        })
      }
    }
  }


  if (d.recipientCount) metrics.push({ label: "Destinataires", value: String(d.recipientCount) })
  if (d.bounceCount) metrics.push({ label: "Rebonds", value: String(d.bounceCount) })
  if (d.count && !d.recipientCount) metrics.push({ label: "Quantité", value: String(d.count) })
  if (d.queueFailed) metrics.push({ label: "File d'attente", value: "Échec partiel" })
  if (d.isScheduled) metrics.push({ label: "Planifié", value: "Oui" })
  if (d.changes && Array.isArray(d.changes)) {
    metrics.push({ label: "Modifications", value: d.changes.join(", ") })
  }

  return { pairs, metrics }
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
  const [integrity, setIntegrity] = useState<{ verified: boolean; totalEntries: number; hashedEntries: number; unhashedEntries: number } | null>(null)
  const [integrityLoading, setIntegrityLoading] = useState(false)
  const [showPurgeModal, setShowPurgeModal] = useState(false)
  const [focusIndex, setFocusIndex] = useState(-1)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])

  const query = searchParams.get("q") ?? ""
  const actionFilter = searchParams.get("action") ?? ""
  const resourceTypeFilter = searchParams.get("resourceType") ?? ""
  const resourceId = searchParams.get("resourceId") ?? ""
  const severityFilter = searchParams.get("severity") ?? ""
  const startDate = searchParams.get("startDate") ?? ""
  const endDate = searchParams.get("endDate") ?? ""
  const view = (searchParams.get("view") as AuditView) ?? "timeline"
  const page = parseInt(searchParams.get("page") ?? "1")

  const updateParams = useCallback((updates: Record<string, string | null>) => {
    const p = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "") p.delete(key)
      else p.set(key, value)
    }
    if (updates.page === undefined && !Object.prototype.hasOwnProperty.call(updates, "page")) p.set("page", "1")
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
      if (severityFilter) p.set("severity", severityFilter)
      if (startDate) p.set("startDate", startDate)
      if (endDate) p.set("endDate", endDate)
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
  }, [query, actionFilter, resourceTypeFilter, resourceId, severityFilter, startDate, endDate, page])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  const isLiveView = !query && !actionFilter && !resourceTypeFilter && !resourceId && !severityFilter && !startDate && !endDate && view === "timeline"
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

  const fetchIntegrity = useCallback(async () => {
    setIntegrityLoading(true)
    try {
      const res = await fetch("/api/admin/audit-logs/integrity")
      if (res.ok) setIntegrity(await res.json())
    } catch {
      // silent
    } finally {
      setIntegrityLoading(false)
    }
  }, [])

  useEffect(() => { fetchIntegrity() }, [fetchIntegrity])

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
    const groups = new Map<string, { resourceType: string; resourceId: string | null; resourceLabel: string | null; logs: AuditEvent[] }>()
    for (const log of logs) {
      const label = log.resourceLabel ?? getResourceLabel(log.resourceType)
      const key = log.resourceId ? `${log.resourceType}:${log.resourceId}` : log.resourceType
      if (!groups.has(key)) groups.set(key, { resourceType: log.resourceType, resourceId: log.resourceId, resourceLabel: log.resourceLabel, logs: [] })
      groups.get(key)!.logs.push(log)
    }
    return Array.from(groups.entries()).map(([key, val]) => ({ key, ...val }))
  }, [view, logs])

  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE))

  // Groupement des événements identiques consécutifs (MT3)
  const groupedLogs = useMemo(() => {
    if (view !== "timeline") return null
    const result: (AuditEvent & { _count?: number })[] = []
    for (const log of logs) {
      const last = result[result.length - 1]
      if (
        last &&
        last.userId === log.userId &&
        last.action === log.action &&
        last.resourceType === log.resourceType &&
        last.resourceId === log.resourceId &&
        last.severity === log.severity
      ) {
        last._count = (last._count ?? 1) + 1
      } else {
        result.push({ ...log })
      }
    }
    return result
  }, [view, logs])

  // Récupère le resourceLabel depuis les logs pour un resourceId donné
  const findResourceLabel = useCallback((rid: string): string | null => {
    for (const log of logs) {
      if (log.resourceId === rid && log.resourceLabel) return log.resourceLabel
    }
    return null
  }, [logs])

  const resourceLabelFromId = resourceId ? findResourceLabel(resourceId) : null

  // Raccourcis clavier : j/k navigation, Enter détails
  useEffect(() => {
    const displayLogs = groupedLogs ?? logs
    if (!displayLogs.length) return
    function handleKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return
      if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault()
        setFocusIndex((i) => Math.min(i + 1, displayLogs.length - 1))
      }
      if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault()
        setFocusIndex((i) => Math.max(i - 1, 0))
      }
      if (e.key === "Enter" && focusIndex >= 0) {
        const id = displayLogs[focusIndex]?.id
        if (id) setExpandedId((prev) => (prev === id ? null : id))
      }
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [logs, groupedLogs, focusIndex])

  // Scroll dans la vue pour suivre le focus
  useEffect(() => {
    if (focusIndex < 0) return
    cardRefs.current[focusIndex]?.scrollIntoView({ block: "nearest", behavior: "smooth" })
  }, [focusIndex])

  const activeChips: { label: string; onRemove: () => void }[] = []
  if (query) activeChips.push({ label: `Recherche : ${query}`, onRemove: () => updateParams({ q: null }) })
  if (actionFilter) activeChips.push({ label: `Action : ${getActionLabel(actionFilter)}`, onRemove: () => updateParams({ action: null }) })
  if (resourceTypeFilter) activeChips.push({ label: `Ressource : ${getResourceLabel(resourceTypeFilter)}`, onRemove: () => updateParams({ resourceType: null }) })
  if (resourceId) activeChips.push({ label: `Ressource : ${resourceLabelFromId ?? resourceId.slice(0, 8) + "..."}`, onRemove: () => updateParams({ resourceId: null }) })
  if (severityFilter) {
    const s = SEVERITY_CONFIG[severityFilter as keyof typeof SEVERITY_CONFIG]
    if (s) activeChips.push({ label: `Gravité : ${s.label}`, onRemove: () => updateParams({ severity: null }) })
  }
  if (startDate) activeChips.push({ label: `Du : ${new Date(startDate).toLocaleDateString("fr-FR")}`, onRemove: () => updateParams({ startDate: null }) })
  if (endDate) activeChips.push({ label: `Au : ${new Date(endDate).toLocaleDateString("fr-FR")}`, onRemove: () => updateParams({ endDate: null }) })

  function getResourceUrl(resourceType: string, resourceId: string | null): string | null {
    const base = RESOURCE_ROUTES[resourceType]
    if (!base || !resourceId) return null
    return `${base}/${resourceId}`
  }

  function userUrl(userId: string | null): string | null {
    if (!userId) return null
    return `/admin/members/${userId}`
  }

  const errorCount = useMemo(() => logs.filter((l) => l.severity === "error").length, [logs])

  function renderDetails(log: AuditEvent) {
    const { pairs, metrics } = cleanDetails(log.details)
    const shouldRender = pairs.length > 0 || metrics.length > 0 || log.resourceId || log.userAgent

    if (!shouldRender) return null

    return (
      <div className="mt-3 pt-3 border-t border-border/30 space-y-3">
        {/* Métriques en badges */}
        {metrics.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {metrics.map((m, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted/50 text-[11px] text-muted-foreground font-medium">
                {m.label} : {m.value}
              </span>
            ))}
          </div>
        )}

        {/* Paires clé-valeur */}
        {pairs.length > 0 && (
          <div className="space-y-1.5 text-xs text-muted-foreground">
            {pairs.map((p, i) => (
              <div key={i} className="flex gap-2">
                <span className="font-medium shrink-0 w-28">{p.label}</span>
                <span className="break-words">{p.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Date complète + IP + User-Agent */}
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground/50">
          <span>{formatDate(log.createdAt)}</span>
          {log.ipAddress && <span>· {log.ipAddress}</span>}
          {log.userAgent && <span className="truncate max-w-[200px]" title={log.userAgent}>· {log.userAgent}</span>}
        </div>

        {/* Lien vers la ressource */}
        {log.resourceId && (
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => updateParams({ resourceId: log.resourceId, page: "1" })}
              className="text-[11px] text-primary/70 hover:text-primary transition-colors"
            >
              Voir toutes les actions sur cette ressource →
            </button>
            {getResourceUrl(log.resourceType, log.resourceId) && (
              <a
                href={getResourceUrl(log.resourceType, log.resourceId)!}
                className="inline-flex items-center gap-1 text-[11px] text-primary/70 hover:text-primary transition-colors"
              >
                <ExternalLink className="size-3" />
                Ouvrir la ressource
              </a>
            )}
          </div>
        )}
      </div>
    )
  }

  function AuditCard({ log, count }: { log: AuditEvent; count?: number }) {
    const isExpanded = expandedId === log.id
    const ActionIcon = getActionIcon(log.action)
    const ResourceIcon = getResourceIcon(log.resourceType)
    const sev = SEVERITY_CONFIG[log.severity as keyof typeof SEVERITY_CONFIG] ?? SEVERITY_CONFIG.info

    const desc = renderDescription({
      action: log.action,
      resourceType: log.resourceType,
      resourceLabel: log.resourceLabel,
      details: log.details,
      user: log.user,
    })

    return (
      <div className={`rounded-lg border border-border/50 ${sev.bgColor}`}>
        <div className="p-3.5">
          {/* Top row: user + time */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className={`size-2 rounded-full shrink-0 ${sev.color}`} />
              {count && count > 1 ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground/70 bg-muted/50 px-1.5 py-0.5 rounded shrink-0">
                  ×{count}
                </span>
              ) : null}
              {userUrl(log.userId) ? (
                <a href={userUrl(log.userId)!} className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-primary transition-colors truncate">
                  <Avatar name={log.user?.name} email={log.user?.email} image={log.user?.image} />
                  <span className="truncate">{log.user?.name ?? log.user?.email ?? "Système"}</span>
                </a>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground truncate">
                  <Avatar name={log.user?.name} email={log.user?.email} image={log.user?.image} />
                  <span className="truncate">{log.user?.name ?? log.user?.email ?? "Système"}</span>
                </span>
              )}
            </div>
            <span className="shrink-0 text-[11px] text-muted-foreground/50" title={formatDate(log.createdAt)}>
              {timeAgo(log.createdAt)}
            </span>
          </div>

          {/* Badge row */}
          <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-semibold ${sev.textColor} ${sev.bgColor}`}>
              <ActionIcon className="size-3" />
              {getActionLabel(log.action)}
            </span>
            {getResourceUrl(log.resourceType, log.resourceId) ? (
              <a href={getResourceUrl(log.resourceType, log.resourceId)!}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] text-muted-foreground/70 hover:text-primary transition-colors bg-muted/30"
              >
                <ResourceIcon className="size-3" />
                {getResourceLabel(log.resourceType)}
              </a>
            ) : (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] text-muted-foreground/70 bg-muted/30">
                <ResourceIcon className="size-3" />
                {getResourceLabel(log.resourceType)}
              </span>
            )}
          </div>

          {/* Description (contexte uniquement — plus redondante) */}
          {desc && (
            <p className="text-sm text-foreground/80 leading-relaxed mb-2">
              {desc}
            </p>
          )}

          {/* Footer: IP + expand */}
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground/50">
            {log.ipAddress && (
              <span className="inline-flex items-center gap-1 font-mono">
                <Globe className="size-3" />
                {log.ipAddress}
              </span>
            )}
            <button
              onClick={() => setExpandedId(isExpanded ? null : log.id)}
              className="ml-auto inline-flex items-center gap-1 hover:text-foreground transition-colors"
            >
              {isExpanded ? (
                <>Masquer <ChevronUp className="size-3" /></>
              ) : (
                <>Détails <ChevronDown className="size-3" /></>
              )}
            </button>
          </div>

          {isExpanded && renderDetails(log)}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Shield className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Centre d&apos;audit</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <span>{total} événement{total > 1 ? "s" : ""}</span>
              {errorCount > 0 && (
                <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-medium">
                  <span className="size-1.5 rounded-full bg-rose-500" />
                  {errorCount} erreur{errorCount > 1 ? "s" : ""}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Live indicator */}
          {newEventCount > 0 && (
            <button onClick={acceptLiveEvents}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/30 hover:bg-emerald-500/20 transition-colors animate-pulse"
            >
              <span className="size-1.5 rounded-full bg-emerald-500" />
              {newEventCount} nouveau{newEventCount > 1 ? "x" : ""}
            </button>
          )}

          {/* Groupe Export */}
          <div className="flex items-center gap-1">
            <button onClick={fetchLogs}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border/50 hover:bg-muted/50 transition-colors"
              title="Rafraîchir"
            >
              <RefreshCw className="size-3.5" />
            </button>
            <button
              onClick={async () => {
                if (!filters) return
                const p = new URLSearchParams()
                if (query) p.set("q", query)
                if (actionFilter) p.set("action", actionFilter)
                if (resourceTypeFilter) p.set("resourceType", resourceTypeFilter)
                if (severityFilter) p.set("severity", severityFilter)
                if (startDate) p.set("startDate", startDate)
                if (endDate) p.set("endDate", endDate)
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
              CSV
            </button>
            <button
              onClick={() => {
                const p = new URLSearchParams()
                if (query) p.set("q", query)
                if (actionFilter) p.set("action", actionFilter)
                if (resourceTypeFilter) p.set("resourceType", resourceTypeFilter)
                if (severityFilter) p.set("severity", severityFilter)
                if (startDate) p.set("startDate", startDate)
                if (endDate) p.set("endDate", endDate)
                window.open(`/api/admin/audit-logs/export?${p}`, "_blank")
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border/50 hover:bg-muted/50 transition-colors"
            >
              <FileText className="size-3.5" />
              PDF
            </button>
          </div>

          {/* Groupe Administration */}
          <div className="flex items-center gap-1">
            {integrity && (
              <button onClick={fetchIntegrity} disabled={integrityLoading}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                  integrity.verified
                    ? "border-emerald-200/50 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/10"
                    : "border-amber-200/50 dark:border-amber-900/30 text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/10"
                }`}
                title={integrity.verified ? "Chaîne d'intégrité vérifiée" : "Problème d'intégrité détecté"}
              >
                <span className={`size-1.5 rounded-full ${integrity.verified ? "bg-emerald-500" : "bg-amber-500"}`} />
                <span className="hidden sm:inline">{integrity.verified ? "Intégrité OK" : `${integrity.unhashedEntries ?? 0} anomalie(s)`}</span>
              </button>
            )}
            <button onClick={() => setShowPurgeModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-rose-200/50 text-rose-600 hover:bg-rose-50/50 dark:border-rose-900/30 dark:text-rose-400 dark:hover:bg-rose-950/20 transition-colors"
            >
              <Trash2 className="size-3.5" />
              <span className="hidden sm:inline">Purger</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50" />
            <input
              type="text"
              placeholder="Rechercher par action, ressource, utilisateur, email, IP, UUID..."
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
            onClick={() => updateParams({ q: null, action: null, resourceType: null, resourceId: null, severity: null, startDate: null, endDate: null, page: null })}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border/50 hover:bg-muted/50 text-muted-foreground transition-colors"
          >
            <Filter className="size-3.5" />
            Réinitialiser
          </button>
        </div>

        {/* Filtres avancés : période + sévérité + presets */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-muted-foreground shrink-0">Rapide :</span>
            <button onClick={() => updateParams({ severity: severityFilter === "error" ? null : "error", page: "1" })}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors inline-flex items-center gap-1 ${
                severityFilter === "error"
                  ? "bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border-rose-200/50 dark:border-rose-900/30"
                  : "border-border/50 text-muted-foreground hover:bg-muted/50"
              }`}
            >
              <span className="size-1.5 rounded-full bg-rose-500" />
              Erreurs
            </button>
            <button onClick={() => updateParams({ severity: severityFilter === "warning" ? null : "warning", page: "1" })}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors inline-flex items-center gap-1 ${
                severityFilter === "warning"
                  ? "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-200/50 dark:border-amber-900/30"
                  : "border-border/50 text-muted-foreground hover:bg-muted/50"
              }`}
            >
              <span className="size-1.5 rounded-full bg-amber-500" />
              Avertissements
            </button>
            <button onClick={() => updateParams({ action: actionFilter === "session.login" ? null : "session.login", page: "1" })}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                actionFilter === "session.login"
                  ? "bg-primary/10 text-primary border-primary/20"
                  : "border-border/50 text-muted-foreground hover:bg-muted/50"
              }`}
            >
              🔑 Connexions
            </button>
            <span className="text-xs text-muted-foreground/40">|</span>
            <span className="text-xs text-muted-foreground shrink-0">Période :</span>
            <button onClick={() => updateParams({ startDate: new Date().toISOString().slice(0, 10), endDate: null, page: "1" })}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                startDate === new Date().toISOString().slice(0, 10) && !endDate
                  ? "bg-primary/10 text-primary border-primary/20"
                  : "border-border/50 text-muted-foreground hover:bg-muted/50"
              }`}
            >Aujourd'hui</button>
            <button onClick={() => {
              const d = new Date(); d.setDate(d.getDate() - 7)
              updateParams({ startDate: d.toISOString().slice(0, 10), endDate: null, page: "1" })
            }}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                startDate && !endDate && Math.abs((new Date().getTime() - new Date(startDate).getTime()) / 86400000 - 7) < 2
                  ? "bg-primary/10 text-primary border-primary/20"
                  : "border-border/50 text-muted-foreground hover:bg-muted/50"
              }`}
            >7 jours</button>
            <button onClick={() => {
              const d = new Date(); d.setDate(d.getDate() - 30)
              updateParams({ startDate: d.toISOString().slice(0, 10), endDate: null, page: "1" })
            }}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                startDate && !endDate && Math.abs((new Date().getTime() - new Date(startDate).getTime()) / 86400000 - 30) < 5
                  ? "bg-primary/10 text-primary border-primary/20"
                  : "border-border/50 text-muted-foreground hover:bg-muted/50"
              }`}
            >30 jours</button>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground shrink-0">Du</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => updateParams({ startDate: e.target.value || null, page: "1" })}
              className="h-9 rounded-lg border border-border/50 bg-background px-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <label className="text-xs text-muted-foreground shrink-0">Au</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => updateParams({ endDate: e.target.value || null, page: "1" })}
              className="h-9 rounded-lg border border-border/50 bg-background px-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <select
            value={severityFilter}
            onChange={(e) => updateParams({ severity: e.target.value || null, page: "1" })}
            className="h-9 rounded-lg border border-border/50 bg-background px-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Toutes gravités</option>
            {Object.entries(SEVERITY_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>
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
          <p className="text-sm text-muted-foreground/60">
            {query || actionFilter || resourceTypeFilter || resourceId || severityFilter || startDate || endDate
              ? "Aucun événement ne correspond aux filtres."
              : "Aucun événement d'audit pour le moment."}
          </p>
          {(query || actionFilter || resourceTypeFilter || resourceId || severityFilter || startDate || endDate) && (
            <button
              onClick={() => updateParams({ q: null, action: null, resourceType: null, resourceId: null, severity: null, startDate: null, endDate: null, page: null })}
              className="text-xs text-primary/70 hover:text-primary"
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
      ) : view === "user" && groupedByUser ? (
        <div className="space-y-6">
          {groupedByUser.map(({ key, user, logs: groupLogs }) => {
            const uid = groupLogs.find((l) => l.userId)?.userId ?? null
            return (
              <div key={key}>
                <div className="flex items-center gap-2 mb-3">
                  {uid ? (
                    <a href={userUrl(uid)!} className="inline-flex items-center gap-2 hover:text-foreground transition-colors">
                      <Avatar name={user?.name} email={user?.email} image={user?.image} />
                      <span className="text-sm font-medium">{user?.name ?? user?.email ?? "Système"}</span>
                    </a>
                  ) : (
                    <>
                      <Avatar name={user?.name} email={user?.email} image={user?.image} />
                      <span className="text-sm font-medium">{user?.name ?? user?.email ?? "Système"}</span>
                    </>
                  )}
                  <span className="text-xs text-muted-foreground/50">{groupLogs.length} action{groupLogs.length > 1 ? "s" : ""}</span>
                </div>
                <div className="space-y-2">
                  {groupLogs.map((log) => <AuditCard key={log.id} log={log} />)}
                </div>
              </div>
            )
          })}
        </div>
      ) : view === "resource" && groupedByResource ? (
        <div className="space-y-6">
          {groupedByResource.map(({ key, resourceType, resourceId: rid, resourceLabel: rl, logs: groupLogs }) => (
            <div key={key}>
              <div className="flex items-center gap-2 mb-3">
                <FileText className="size-4 text-muted-foreground/70" />
                <span className="text-sm font-medium">{rl ?? getResourceLabel(resourceType)}</span>
                {rid && rl && <span className="text-xs text-muted-foreground/50 font-mono">{rid.slice(0, 8)}</span>}
                <span className="text-xs text-muted-foreground/50">{groupLogs.length} action{groupLogs.length > 1 ? "s" : ""}</span>
              </div>
              <div className="space-y-2">
                {groupLogs.map((log) => <AuditCard key={log.id} log={log} />)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="relative">
          {/* Ligne verticale de timeline */}
          <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border/50" />

          <div className="space-y-1">
            {(groupedLogs ?? logs).map((log, i) => {
              const sev = SEVERITY_CONFIG[log.severity as keyof typeof SEVERITY_CONFIG] ?? SEVERITY_CONFIG.info
              return (
                <div key={log.id} ref={(el) => { cardRefs.current[i] = el }}
                  className={`flex gap-3 ${focusIndex === i ? "" : ""}`}
                >
                  {/* Point sur la timeline */}
                  <div className="flex flex-col items-center shrink-0 pt-4">
                    <span className={`size-[10px] rounded-full ring-2 ring-background ${sev.color}`} />
                  </div>
                  {/* Carte */}
                  <div className={`flex-1 min-w-0 rounded-lg transition-shadow ${focusIndex === i ? "ring-2 ring-primary/30" : ""}`}>
                    <AuditCard log={log} count={(log as any)._count} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border/30">
          <p className="text-xs text-muted-foreground/50 order-2 sm:order-1">
            Page {page} sur {totalPages} ({total} résultat{total > 1 ? "s" : ""})
          </p>
          <div className="flex items-center gap-2 order-1 sm:order-2">
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

      {/* Purge confirmation modal */}
      {showPurgeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowPurgeModal(false)}>
          <div className="bg-background rounded-xl border border-border/50 shadow-xl p-6 max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="size-10 rounded-full bg-rose-100 dark:bg-rose-950/30 flex items-center justify-center">
                <Trash2 className="size-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Confirmer la purge</h3>
                <p className="text-xs text-muted-foreground/70">Cette action est irréversible.</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Tous les logs d&apos;audit de plus de <strong>90 jours</strong> seront définitivement supprimés.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowPurgeModal(false)}
                className="px-4 py-2 text-xs font-medium rounded-lg border border-border/50 hover:bg-muted/50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={async () => {
                  try {
                    const res = await fetch("/api/admin/audit-logs", { method: "DELETE" })
                    if (!res.ok) throw new Error()
                    const data = await res.json()
                    alert(`${data.deleted} logs supprimés (plus de ${data.olderThanDays} jours)`)
                    setShowPurgeModal(false)
                    fetchLogs()
                  } catch {
                    alert("Erreur lors de la purge")
                  }
                }}
                className="px-4 py-2 text-xs font-medium rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-colors"
              >
                Confirmer la purge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
