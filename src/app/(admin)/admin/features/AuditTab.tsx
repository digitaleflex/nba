"use client"

import { useEffect, useState, useCallback } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import {
  Search, ChevronLeft, ChevronRight, Download, Trash2, FileX,
  Shield, User, Monitor, Plus, Check, X, Ban, RefreshCw,
  LogIn, UserPlus, Layers, Boxes, ChevronRight as ChevronRightIcon,
} from "lucide-react"
import { toast } from "sonner"
import {
  Card, CardContent, Button, Badge, Input, cn, EmptyState, Skeleton,
} from "@nba/design-system"
import { AuditLog, CachedGet } from "./types"

interface AuditTabProps {
  cachedGet: CachedGet
  invalidate: () => void
}

const ACTION_LABELS: Record<string, string> = {
  CREATE: "Création",
  APPROVE: "Approbation",
  REJECT: "Rejet",
  REVOKE: "Révocation",
  SUSPEND: "Suspension",
  UPDATE: "Modification",
  DELETE: "Suppression",
  LOGIN: "Connexion",
  REGISTER: "Inscription",
  "admin.ban": "Bannissement",
  "admin.unban": "Réhabilitation",
  BAN: "Bannissement",
  REPLAYED: "Rejeu d'événement",
  PURGE: "Nettoyage",
}

const RESOURCE_LABELS: Record<string, string> = {
  access_request: "Demande d'accès",
  signal: "Signal",
  user: "Utilisateur",
  email: "Email",
  settings: "Paramètres",
  kyc: "Vérification KYC",
  broker: "Vérification courtier",
  session: "Session",
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
  APPROVE: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
  REJECT: "text-red-500 bg-red-500/10 border-red-500/20",
  REVOKE: "text-red-500 bg-red-500/10 border-red-500/20",
  SUSPEND: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  UPDATE: "text-blue-500 bg-blue-500/10 border-blue-500/20",
  DELETE: "text-red-500 bg-red-500/10 border-red-500/20",
  LOGIN: "text-blue-500 bg-blue-500/10 border-blue-500/20",
  REGISTER: "text-violet-500 bg-violet-500/10 border-violet-500/20",
  "admin.ban": "text-red-500 bg-red-500/10 border-red-500/20",
  "admin.unban": "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
  BAN: "text-red-500 bg-red-500/10 border-red-500/20",
  REPLAYED: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  PURGE: "text-gray-500 bg-gray-500/10 border-gray-500/20",
}

const ACTION_ICONS: Record<string, typeof Shield> = {
  CREATE: Plus,
  APPROVE: Check,
  REJECT: X,
  REVOKE: X,
  SUSPEND: Ban,
  UPDATE: RefreshCw,
  DELETE: Trash2,
  LOGIN: LogIn,
  REGISTER: UserPlus,
  "admin.ban": Ban,
  "admin.unban": Check,
  BAN: Ban,
  REPLAYED: RefreshCw,
  PURGE: Trash2,
}

function groupByUser(logs: AuditLog[]) {
  const map = new Map<string, { key: string; name: string; email: string; logs: AuditLog[] }>()
  for (const log of logs) {
    const key = log.user?.email || log.user?.name || "system"
    const existing = map.get(key)
    if (existing) existing.logs.push(log)
    else map.set(key, { key, name: log.user?.name || "Système", email: log.user?.email || "", logs: [log] })
  }
  return Array.from(map.values()).sort((a, b) => b.logs[0].createdAt.localeCompare(a.logs[0].createdAt))
}

function groupByResource(logs: AuditLog[]) {
  const map = new Map<string, { type: string; id: string; logs: AuditLog[] }>()
  for (const log of logs) {
    if (!log.resourceId) continue
    const key = `${log.resourceType}:${log.resourceId}`
    const existing = map.get(key)
    if (existing) existing.logs.push(log)
    else map.set(key, { type: log.resourceType, id: log.resourceId, logs: [log] })
  }
  return Array.from(map.values()).sort((a, b) => b.logs[0].createdAt.localeCompare(a.logs[0].createdAt))
}

function getActionDescription(
  action: string,
  resourceType: string,
  details: Record<string, unknown> | null,
  user: { name: string; email: string } | null,
): string {
  const d = details ?? {}
  const userName = user?.name || "un utilisateur"

  if (action === "CREATE" && resourceType === "access_request")
    return `Nouvelle demande d'accès soumise par ${userName}`
  if (action === "APPROVE" && resourceType === "access_request")
    return "Demande d'accès approuvée → accès au plan accordé"
  if (action === "REJECT" && resourceType === "access_request")
    return `Demande d'accès refusée${d.reason ? ` (motif: ${d.reason})` : ""}`
  if (action === "REVOKE" && resourceType === "access_request")
    return "Accès révoqué pour le plan"
  if (action === "DELETE" && resourceType === "user")
    return "Compte utilisateur supprimé définitivement"
  if (action === "UPDATE" && resourceType === "user")
    return `Profil utilisateur modifié${d.field ? ` (${d.field} changé)` : ""}`
  if (action === "admin.ban" && resourceType === "user")
    return `Utilisateur banni et blacklisté${d.reason ? ` (motif: ${d.reason})` : ""}`
  if (action === "admin.unban" && resourceType === "user")
    return "Email réhabilité, l'utilisateur peut se réinscrire"
  if (action === "UPDATE" && resourceType === "settings")
    return "Paramètres SMTP modifiés"
  if (action === "CREATE" && resourceType === "signal")
    return "Nouveau signal créé"
  if (action === "UPDATE" && resourceType === "signal")
    return "Signal modifié"
  if (action === "DELETE" && resourceType === "signal")
    return "Signal supprimé"
  if (action === "LOGIN" && resourceType === "user")
    return "Connexion utilisateur"
  if (action === "REGISTER" && resourceType === "user")
    return "Nouvel utilisateur inscrit"
  if (action === "BAN" && resourceType === "user")
    return `Compte banni${d.reason ? ` (motif: ${d.reason})` : ""}`
  if (action === "SUSPEND" && resourceType === "user")
    return "Compte suspendu"
  if (action === "REVOKE" && resourceType === "session")
    return "Toutes les sessions révoquées — reconnexion forcée"

  const actionLabel = ACTION_LABELS[action] || "Action"
  const resourceLabel = RESOURCE_LABELS[resourceType] || resourceType.replace(/_/g, " ")
  return `${actionLabel} — ${resourceLabel}`
}

function getActionIcon(action: string) {
  const Icon = ACTION_ICONS[action] || Shield
  return <Icon className="size-4" />
}

function formatRelativeTime(date: Date): string {
  const diff = Date.now() - date.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return "à l'instant"
  if (minutes < 60) return `il y a ${minutes} min`
  if (hours < 24) return `il y a ${hours} h`
  if (days < 30) return `il y a ${days} j`
  return `il y a ${Math.floor(days / 30)} mois`
}

function formatAbsoluteTime(date: Date): string {
  return date.toLocaleString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

function renderDetailValue(value: unknown): string {
  if (value === null || value === undefined) return ""
  if (typeof value === "boolean") return value ? "Oui" : "Non"
  if (typeof value === "object") return JSON.stringify(value)
  return String(value)
}

function DetailsSection({ details }: { details: Record<string, unknown> | null }) {
  if (!details || Object.keys(details).length === 0) return null

  const d = details as Record<string, unknown>
  const changes = d.changes && typeof d.changes === "object" && !Array.isArray(d.changes)
    ? (d.changes as Record<string, unknown>)
    : null
  const oldValue = d.oldValue
  const oldStatus = d.oldStatus
  const status = d.status

  return (
    <div className="mt-2 rounded-lg bg-muted/30 p-3 space-y-2">
      {oldValue !== undefined && (
        <div className="grid grid-cols-2 gap-3 text-[11px]">
          <div>
            <span className="text-muted-foreground block mb-0.5 text-[10px] font-medium uppercase tracking-wider">
              Ancienne valeur
            </span>
            <div className="bg-muted/50 rounded px-2 py-1.5 font-mono text-[11px] leading-relaxed whitespace-pre-wrap break-all">
              {renderDetailValue(oldValue) || <span className="italic text-muted-foreground">vide</span>}
            </div>
          </div>
          <div>
            <span className="text-muted-foreground block mb-0.5 text-[10px] font-medium uppercase tracking-wider">
              Nouvelle valeur
            </span>
            <div className="bg-primary/5 border border-primary/10 rounded px-2 py-1.5 font-mono text-[11px] leading-relaxed whitespace-pre-wrap break-all">
              {renderDetailValue(d.newValue) || <span className="italic text-muted-foreground">vide</span>}
            </div>
          </div>
        </div>
      )}

      {oldStatus !== undefined && status !== undefined && oldValue === undefined && (
        <div className="flex items-center gap-2 text-[11px]">
          <span className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">Statut:</span>
          <Badge variant="outline" className="text-[10px]">{String(oldStatus)}</Badge>
          <span className="text-muted-foreground">→</span>
          <Badge variant="outline" className="text-[10px]">{String(status)}</Badge>
        </div>
      )}

      {changes && (
        <div className="space-y-1">
          <span className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider block">Modifications</span>
          {Object.entries(changes).map(([key, value]) => (
            <div key={key} className="text-[11px] flex items-center gap-1">
              <span className="text-muted-foreground">{key}:</span>
              <span>{renderDetailValue(value)}</span>
            </div>
          ))}
        </div>
      )}

      {!!d.reason && (
        <div className="text-[11px]">
          <span className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">Motif:</span>{" "}
          <span>{String(d.reason)}</span>
        </div>
      )}
      {!!d.planId && (
        <div className="text-[11px]">
          <span className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">Plan concerné:</span>{" "}
          <span className="font-mono">{String(d.planId)}</span>
        </div>
      )}
      {!!d.bannedBy && (
        <div className="text-[11px]">
          <span className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">Banni par:</span>{" "}
          <span>{String(d.bannedBy)}</span>
        </div>
      )}
      {!!d.ip && (
        <div className="text-[11px]">
          <span className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">Adresse IP:</span>{" "}
          <span className="font-mono">{String(d.ip)}</span>
        </div>
      )}
      {!!d.userAgent && (
        <div className="text-[11px]">
          <span className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">Navigateur:</span>{" "}
          <span className="truncate max-w-[300px] inline-block align-bottom">{String(d.userAgent)}</span>
        </div>
      )}

      {Object.entries(d)
        .filter(
          ([k]) =>
            ![
              "oldValue",
              "newValue",
              "oldStatus",
              "status",
              "reason",
              "planId",
              "bannedBy",
              "ip",
              "userAgent",
              "field",
              "changes",
            ].includes(k),
        )
        .map(([key, value]) => (
          <div key={key} className="text-[11px]">
            <span className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">{key}:</span>{" "}
            <span>{renderDetailValue(value)}</span>
          </div>
        ))}
    </div>
  )
}

function TimelineSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Chargement de la timeline">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <div className="flex flex-col items-center gap-1">
            <Skeleton variant="shimmer" className="size-9 rounded-full" />
            <div className="w-px flex-1 bg-muted/30" />
          </div>
          <div className="flex-1 space-y-2 pb-6">
            <Skeleton variant="shimmer" className="h-4 w-3/4" />
            <Skeleton variant="shimmer" className="h-3 w-1/3" />
            <Skeleton variant="shimmer" className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function AuditTab({ cachedGet, invalidate }: AuditTabProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const [logs, setLogs] = useState<AuditLog[]>([])
  const [total, setTotal] = useState(0)
  const [filters, setFilters] = useState<{ actions: string[]; resourceTypes: string[] }>({
    actions: [],
    resourceTypes: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [purging, setPurging] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [searchInput, setSearchInput] = useState("")
  const [query, setQuery] = useState("")
  const [actionFilter, setActionFilter] = useState("")
  const [resourceFilter, setResourceFilter] = useState("")
  const [page, setPage] = useState(1)
  const limit = 30

  // Multi-view state (shareable via URL)
  const [view, setView] = useState<"timeline" | "user" | "resource">(
    (["timeline", "user", "resource"].includes(searchParams.get("view") ?? "")
      ? (searchParams.get("view") as "timeline" | "user" | "resource")
      : "timeline"),
  )
  const [selectedResource, setSelectedResource] = useState<{ type: string; id: string } | null>(() => {
    const rt = searchParams.get("resourceType")
    const rid = searchParams.get("resourceId")
    return rt && rid ? { type: rt, id: rid } : null
  })

  // Keep URL in sync with the active view (shareable links)
  const syncUrl = useCallback(
    (nextView: string, res?: { type: string; id: string } | null) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set("tab", "audit")
      params.set("view", nextView)
      if (res) {
        params.set("resourceType", res.type)
        params.set("resourceId", res.id)
      } else {
        params.delete("resourceType")
        params.delete("resourceId")
      }
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [searchParams, pathname, router],
  )

  const changeView = (v: "timeline" | "user" | "resource") => {
    setView(v)
    setSelectedResource(null)
    setPage(1)
    syncUrl(v, null)
  }

  const drillResource = (type: string, id: string) => {
    setSelectedResource({ type, id })
    setPage(1)
    syncUrl("resource", { type, id })
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(searchInput)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (query) params.set("q", query)
      if (actionFilter) params.set("action", actionFilter)
      if (resourceFilter) params.set("resourceType", resourceFilter)
      if (selectedResource) params.set("resourceId", selectedResource.id)
      params.set("view", view)
      params.set("page", String(page))
      params.set("limit", String(limit))

      const { ok, data } = await cachedGet(`/api/admin/audit-logs?${params}`)
      if (ok) {
        setLogs(data.logs || [])
        setTotal(data.total || 0)
        setFilters(data.filters || { actions: [], resourceTypes: [] })
        setError(false)
      } else {
        setError(true)
      }
    } catch (err) {
      console.error(err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [cachedGet, query, actionFilter, resourceFilter, selectedResource, view, page])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchLogs()
  }, [fetchLogs])

  const exportCSV = useCallback(async () => {
    setExporting(true)
    try {
      const baseParams = new URLSearchParams()
      if (query) baseParams.set("q", query)
      if (actionFilter) baseParams.set("action", actionFilter)
      if (resourceFilter) baseParams.set("resourceType", resourceFilter)
      if (selectedResource) baseParams.set("resourceId", selectedResource.id)

      // The audit API caps `limit` at 100, so paginate to export everything.
      const allLogs: AuditLog[] = []
      let page = 1
      const pageSize = 100
      for (;;) {
        const p = new URLSearchParams(baseParams)
        p.set("page", String(page))
        p.set("limit", String(pageSize))
        const { ok, data } = await cachedGet(`/api/admin/audit-logs?${p}`, 0)
        if (!ok) {
          toast.error("Erreur lors de l'export")
          return
        }
        const logs: AuditLog[] = data.logs || []
        allLogs.push(...logs)
        const total: number = data.total ?? 0
        if (logs.length < pageSize || allLogs.length >= total) break
        page++
      }

      const BOM = "﻿"
      const groupLabel =
        view === "user" ? "Groupe (utilisateur)" : view === "resource" ? "Groupe (ressource)" : "Groupe"
      const headers = [
        "Date",
        "Action",
        "Ressource",
        "ID Ressource",
        "Utilisateur",
        "Email",
        "IP",
        groupLabel,
        "Détails",
      ]
      const rows = allLogs.map((log) => [
        new Date(log.createdAt).toISOString(),
        ACTION_LABELS[log.action] || log.action,
        RESOURCE_LABELS[log.resourceType] || log.resourceType,
        log.resourceId ?? "",
        log.user?.name ?? "",
        log.user?.email ?? "",
        log.ipAddress ?? "",
        view === "user"
          ? log.user?.email || log.user?.name || "système"
          : view === "resource"
            ? `${log.resourceType}:${log.resourceId ?? ""}`
            : "",
        log.details ? JSON.stringify(log.details) : "",
      ])

      const csv = [headers, ...rows]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
        .join("\n")

      const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success(`${allLogs.length} logs exportés`)
    } catch {
      toast.error("Erreur lors de l'export")
    } finally {
      setExporting(false)
    }
  }, [cachedGet, query, actionFilter, resourceFilter, selectedResource, view])

  const handlePurge = async () => {
    if (!confirm("Supprimer les logs d'audit de plus de 90 jours ?")) return
    setPurging(true)
    invalidate()
    try {
      const res = await fetch("/api/admin/audit-logs", { method: "DELETE" })
      if (res.ok) {
        const { deleted } = await res.json()
        toast.success(`${deleted} logs supprimés`)
        fetchLogs()
      } else {
        toast.error("Erreur lors de la purge")
      }
    } catch {
      toast.error("Erreur lors de la purge")
    }
    setPurging(false)
  }

  const totalPages = Math.ceil(total / limit)
  const hasActiveFilters = query || actionFilter || resourceFilter

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border/40 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Journal d&apos;audit</h1>
          <p className="text-xs text-muted-foreground mt-1">
            {total > 0
              ? `${total} événement${total !== 1 ? "s" : ""} enregistré${total !== 1 ? "s" : ""}`
              : "Toutes les modifications critiques de la plateforme."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {total > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={exportCSV}
              disabled={exporting}
            >
              <Download className="size-3 mr-1" />
              {exporting ? "Export..." : "Export CSV"}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={handlePurge}
            disabled={purging}
          >
            <Trash2 className="size-3 mr-1" />
            {purging ? "Purge..." : "Purger 90j+"}
          </Button>
        </div>
      </div>

      {/* View switcher (shareable via ?view=) */}
      <div className="flex items-center gap-1.5 border-b border-border/40 pb-3">
        {([
          { id: "timeline", label: "Timeline", icon: Layers },
          { id: "user", label: "Par utilisateur", icon: User },
          { id: "resource", label: "Par ressource", icon: Boxes },
        ] as const).map((v) => (
          <button
            key={v.id}
            onClick={() => changeView(v.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer",
              view === v.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted/50",
            )}
          >
            <v.icon className="size-3.5" />
            {v.label}
          </button>
        ))}
        {selectedResource && (
          <button
            onClick={() => { setSelectedResource(null); setPage(1); syncUrl("resource", null) }}
            className="ml-auto flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
            aria-label="Fermer"
          >
            <X className="size-3" />
            {RESOURCE_LABELS[selectedResource.type] || selectedResource.type} #{selectedResource.id.slice(0, 8)}
          </button>
        )}
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <input
            placeholder="Rechercher par action, ressource ou utilisateur..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="flex h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 placeholder:text-muted-foreground/60"
            aria-label="Rechercher dans les logs"
          />
        </div>
        <select
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value)
            setPage(1)
          }}
          className="h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground outline-none focus:border-primary/50 cursor-pointer min-w-[160px]"
        >
          <option value="">Toutes les actions</option>
          {filters.actions.length > 0 ? (
            filters.actions.map((a) => (
              <option key={a} value={a}>
                {ACTION_LABELS[a] || a.replace(/_/g, " ")}
              </option>
            ))
          ) : (
            <option value="" disabled>Aucune action</option>
          )}
        </select>
        <select
          value={resourceFilter}
          onChange={(e) => {
            setResourceFilter(e.target.value)
            setPage(1)
          }}
          className="h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground outline-none focus:border-primary/50 cursor-pointer min-w-[160px]"
        >
          <option value="">Toutes les ressources</option>
          {filters.resourceTypes.length > 0 ? (
            filters.resourceTypes.map((r) => (
              <option key={r} value={r}>
                {RESOURCE_LABELS[r] || r.replace(/_/g, " ")}
              </option>
            ))
          ) : (
            <option value="" disabled>Aucune ressource</option>
          )}
        </select>
      </div>

      {/* Active filter chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-1.5">
          {query && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-medium text-secondary-foreground pr-1">
              Recherche: &quot;{query}&quot;
              <button
                onClick={() => { setSearchInput(""); setQuery("") }}
                className="ml-0.5 hover:text-foreground rounded-full p-0.5 hover:bg-muted transition-colors cursor-pointer"
                aria-label="Fermer"
              >
                <X className="size-3" />
              </button>
            </span>
          )}
          {actionFilter && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-medium text-secondary-foreground pr-1">
              {ACTION_LABELS[actionFilter] || actionFilter.replace(/_/g, " ")}
              <button
                onClick={() => setActionFilter("")}
                className="ml-0.5 hover:text-foreground rounded-full p-0.5 hover:bg-muted transition-colors cursor-pointer"
                aria-label="Fermer"
              >
                <X className="size-3" />
              </button>
            </span>
          )}
          {resourceFilter && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-medium text-secondary-foreground pr-1">
              {RESOURCE_LABELS[resourceFilter] || resourceFilter.replace(/_/g, " ")}
              <button
                onClick={() => setResourceFilter("")}
                className="ml-0.5 hover:text-foreground rounded-full p-0.5 hover:bg-muted transition-colors cursor-pointer"
                aria-label="Fermer"
              >
                <X className="size-3" />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Erreur de chargement — distinct du résultat vide */}
      {error && !loading && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-rose-500/30 bg-rose-500/5 px-4 py-3 text-xs text-rose-700" role="alert">
          <span>Impossible de charger les logs. Vérifiez votre connexion et réessayez.</span>
          <Button size="sm" variant="outline" onClick={() => fetchLogs()}>Réessayer</Button>
        </div>
      )}

      {/* Log list — multi-view */}
      {loading ? (
        <TimelineSkeleton />
      ) : logs.length === 0 && !error ? (
        <EmptyState
          icon={FileX}
          title="Aucun log trouvé"
          description={
            hasActiveFilters
              ? "Essayez de modifier vos filtres de recherche. Appuyez sur A pour réinitialiser."
              : "Les actions des administrateurs apparaîtront ici. Appuyez sur A pour rafraîchir."
          }
          action={{
            label: hasActiveFilters ? "Réinitialiser les filtres" : "Actualiser",
            onClick: () => { setSearchInput(""); setQuery(""); setActionFilter(""); setResourceFilter("") },
          }}
          shortcut="A"
        />
      ) : view === "user" ? (
        <div className="space-y-4">
          {groupByUser(logs).map((group) => (
            <Card key={group.key} className="border-border/60 bg-card shadow-sm">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <User className="size-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{group.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{group.email || "Action système"}</p>
                  </div>
                  <Badge variant="outline" className="ml-auto text-[10px]">{group.logs.length} action{group.logs.length > 1 ? "s" : ""}</Badge>
                </div>
                <div className="border-t border-border/60 pt-2 space-y-2">
                  {group.logs.slice(0, 5).map((log) => (
                    <div key={log.id} className="flex items-center gap-2 text-[11px]">
                      <span className={cn("size-1.5 rounded-full shrink-0", (ACTION_COLORS[log.action] || "").split(" ")[0])} />
                      <span className="text-foreground/90 flex-1 truncate">{getActionDescription(log.action, log.resourceType, log.details, log.user)}</span>
                      <span className="text-muted-foreground/60 shrink-0">{formatRelativeTime(new Date(log.createdAt))}</span>
                    </div>
                  ))}
                  {group.logs.length > 5 && (
                    <button onClick={() => { setSearchInput(group.email); setQuery(group.email); setPage(1) }} className="text-[10px] text-primary hover:underline cursor-pointer">
                      Voir les {group.logs.length - 5} autres…
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : view === "resource" && !selectedResource ? (
        <div className="space-y-3">
          {groupByResource(logs).map((group) => (
            <button
              key={`${group.type}:${group.id}`}
              onClick={() => drillResource(group.type, group.id)}
              className="w-full text-left flex items-center gap-3 rounded-xl border border-border/60 bg-card/30 p-4 hover:bg-muted/40 transition-colors cursor-pointer"
            >
              <div className="size-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                <Boxes className="size-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground truncate">
                  {RESOURCE_LABELS[group.type] || group.type} #{group.id.slice(0, 8)}
                </p>
                <p className="text-[10px] text-muted-foreground">{group.logs.length} action{group.logs.length > 1 ? "s" : ""} sur cette ressource</p>
              </div>
              <ChevronRightIcon className="size-4 text-muted-foreground shrink-0" />
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => {
            const date = new Date(log.createdAt)
            const actionColor = ACTION_COLORS[log.action] || "text-gray-500 bg-gray-500/10 border-gray-500/20"
            const description = getActionDescription(log.action, log.resourceType, log.details, log.user)

            return (
              <Card key={log.id} className="overflow-hidden border-border/60 bg-card shadow-sm transition-shadow hover:shadow-md">
                <div
                  className={cn(
                    "h-1 w-full",
                    (log.action === "APPROVE" || log.action === "CREATE" || log.action === "admin.unban" || log.action === "REGISTER") && "bg-emerald-500/50",
                    (log.action === "REJECT" || log.action === "REVOKE" || log.action === "DELETE" || log.action === "PURGE") && "bg-red-500/50",
                    (log.action === "SUSPEND" || log.action === "BAN" || log.action === "admin.ban" || log.action === "REPLAYED") && "bg-amber-500/50",
                    (log.action === "UPDATE" || log.action === "LOGIN") && "bg-blue-500/50",
                  )}
                />
                <CardContent className="p-4 pt-3.5">
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        "size-9 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                        actionColor,
                      )}
                    >
                      {getActionIcon(log.action)}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground leading-snug">
                            {description}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium text-muted-foreground border-border/50">
                              {RESOURCE_LABELS[log.resourceType] || log.resourceType.replace(/_/g, " ")}
                            </span>
                            {log.resourceId && !selectedResource && (
                              <button
                                onClick={() => drillResource(log.resourceType, log.resourceId!)}
                                className="text-[10px] font-mono text-primary hover:underline cursor-pointer"
                                title="Voir toutes les actions sur cette ressource"
                              >
                                #{log.resourceId.slice(0, 8)}
                              </button>
                            )}
                            {log.resourceId && selectedResource && (
                              <span className="text-[10px] font-mono text-muted-foreground">#{log.resourceId.slice(0, 8)}</span>
                            )}
                          </div>
                        </div>
                        <time
                          dateTime={date.toISOString()}
                          className="text-right shrink-0"
                          title={formatAbsoluteTime(date)}
                        >
                          <p className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatRelativeTime(date)}
                          </p>
                          <p className="text-[10px] text-muted-foreground/60 whitespace-nowrap">
                            {formatAbsoluteTime(date)}
                          </p>
                        </time>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1.5">
                        <span className="flex items-center gap-1">
                          <User className="size-3" />
                          {log.user?.name || log.user?.email || "Système"}
                        </span>
                        <span className="text-muted-foreground/30">·</span>
                        <span className="flex items-center gap-1">
                          <Monitor className="size-3" />
                          {log.ipAddress || "Interne"}
                        </span>
                      </div>

                      {log.details && Object.keys(log.details).length > 0 && (
                        <DetailsSection details={log.details} />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 border-t border-border/40">
          <p className="text-xs text-muted-foreground">
            Page {page} sur {totalPages}
            <span className="hidden sm:inline"> ({total} résultat{total !== 1 ? "s" : ""})</span>
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              aria-label="Page précédente"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              aria-label="Page suivante"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
