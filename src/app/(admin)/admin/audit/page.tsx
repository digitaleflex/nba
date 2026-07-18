"use client"

import { useEffect, useState, useCallback } from "react"
import { Search, Loader2, ChevronLeft, ChevronRight, Shield, Clock, User, ChevronDown } from "lucide-react"
import { Button, Input, Card, CardContent, Badge, cn } from "@nba/design-system"

interface AuditLog {
  id: string
  action: string
  resourceType: string
  resourceId: string | null
  details: Record<string, unknown> | null
  ipAddress: string | null
  createdAt: string
  user: { name: string; email: string } | null
}

interface Filters {
  actions: string[]
  resourceTypes: string[]
}

const ACTION_LABELS: Record<string, string> = {
  "access_request.approved": "Demande approuvée",
  "access_request.rejected": "Demande refusée",
  "signal.created": "Signal créé",
  "signal.published": "Signal publié",
  "signal.scheduled": "Signal programmé",
  "signal.updated": "Signal modifié",
  "signal.duplicated": "Signal dupliqué",
  "signal.deleted": "Signal supprimé",
  "signal.publish": "Distribution signaux",
  "kyc.approved": "KYC approuvé",
  "kyc.rejected": "KYC refusé",
  "broker.approved": "Broker approuvé",
  "broker.rejected": "Broker refusé",
  "subscription.reselect": "Choix de service",
  "subscription.reselect_duplicate": "Demande existante",
  "email.bounced": "Email rejeté",
  "email.complained": "Plainte spam",
  "email.suppressed": "Email supprimé",
  "user.suspend": "Utilisateur suspendu",
  "user.reactivate": "Utilisateur réactivé",
  "user.change_role": "Rôle modifié",
  "user.revoke_sessions": "Sessions révoquées",
  "impersonation.start": "Début impersonation",
  "impersonation.stop": "Fin impersonation",
  "signal.override_on": "Override activé",
  "signal.override_off": "Override désactivé",
  "notification.send": "Notification envoyée",
  "admin.queues.retry": "Relance files d'attente",
}

const RESOURCE_LABELS: Record<string, string> = {
  access_request: "Demande d'accès",
  signal: "Signal",
  user: "Utilisateur",
  kyc_document: "Document KYC",
  kyc: "KYC",
  broker_verification: "Vérification Broker",
  broker: "Broker",
  subscription: "Abonnement",
  system: "Système",
  notification: "Notification",
  session: "Session",
  role: "Rôle",
}

function formatResource(resourceType: string): string {
  return RESOURCE_LABELS[resourceType] ?? resourceType.replace(/_/g, " ")
}

function formatAction(action: string): string {
  return ACTION_LABELS[action] ?? action.replace(/_/g, " ").replace(/\./g, " → ")
}

function getActionColor(action: string): string {
  if (action.includes("approved") || action.includes("reactivate") || action.includes("override_on"))
    return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
  if (action.includes("rejected") || action.includes("deleted") || action.includes("suspend") || action.includes("revoked") || action.includes("revoke") || action.includes("override_off") || action.includes("bounced") || action.includes("complained") || action.includes("suppressed"))
    return "bg-rose-500/10 text-rose-500 border-rose-500/20"
  if (action.includes("created") || action.includes("published") || action.includes("publish") || action.includes("send"))
    return "bg-blue-500/10 text-blue-500 border-blue-500/20"
  if (action.includes("scheduled") || action.includes("duplicated") || action.includes("updated") || action.includes("reselect") || action.includes("change"))
    return "bg-amber-500/10 text-amber-500 border-amber-500/20"
  return "bg-muted text-muted-foreground border-border"
}

function formatDetails(details: Record<string, unknown> | null): string | null {
  if (!details) return null
  const lines: string[] = []
  const d = details as Record<string, any>

  // Statut avant/après
  if (d.fromStatus && d.toStatus) {
    lines.push(`${d.fromStatus} → ${d.toStatus}`)
  } else if (d.status) {
    lines.push(`Statut : ${d.status}`)
  }

  // Plans / groupes
  if (Array.isArray(d.recipientPlans) && d.recipientPlans.length > 0) {
    lines.push(`Groupes : ${d.recipientPlans.join(", ")}`)
  } else if (Array.isArray(d.plans) && d.plans.length > 0) {
    lines.push(`Groupes : ${d.plans.join(", ")}`)
  } else if (d.planName) {
    lines.push(`Groupe : ${d.planName}`)
  }

  // Destinataires
  if (typeof d.recipientCount === "number") {
    lines.push(`${d.recipientCount} destinataire${d.recipientCount > 1 ? "s" : ""}`)
  }

  // Email
  if (d.email && d.email !== d.from) {
    lines.push(`Email : ${d.email}`)
  }

  // File d'attente
  if (d.queueFailed) lines.push("⚠️ Échec file d'attente")
  if (d.isScheduled) lines.push("Programmé")

  return lines.length > 0 ? lines.join("  •  ") : null
}

function getResourceSummary(log: AuditLog): string {
  const d = log.details as Record<string, any> | null

  // Pour un signal : afficher le début du contenu
  if (log.resourceType === "signal" && d?.content) {
    const preview = typeof d.content === "string" ? d.content.slice(0, 80) : ""
    return preview ? `« ${preview}${d.content.length > 80 ? "…" : ""} »` : ""
  }

  // Pour une demande d'accès : afficher le plan
  if (log.resourceType === "access_request") {
    const plan = d?.planName || (Array.isArray(d?.recipientPlans) ? d.recipientPlans[0] : null)
    return plan ? `pour « ${plan} »` : ""
  }

  // Pour un email : afficher l'email concerné
  if (log.resourceType === "user" && d?.email) {
    return `(${d.email})`
  }

  return ""
}

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [total, setTotal] = useState(0)
  const [filters, setFilters] = useState<Filters>({ actions: [], resourceTypes: [] })
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [actionFilter, setActionFilter] = useState("")
  const [resourceFilter, setResourceFilter] = useState("")
  const [page, setPage] = useState(1)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const limit = 30

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (query) params.set("q", query)
      if (actionFilter) params.set("action", actionFilter)
      if (resourceFilter) params.set("resourceType", resourceFilter)
      params.set("page", String(page))
      params.set("limit", String(limit))

      const res = await fetch(`/api/admin/audit-logs?${params}`)
      if (res.ok) {
        const data = await res.json()
        setLogs(Array.isArray(data.logs) ? data.logs : [])
        setTotal(data.total ?? 0)
        setFilters(data.filters ?? { actions: [], resourceTypes: [] })
      }
    } finally {
      setLoading(false)
    }
  }, [query, actionFilter, resourceFilter, page])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  const totalPages = Math.ceil(total / limit)

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Journal d'audit</h1>
        <p className="text-sm text-muted-foreground">
          {total} événement{total !== 1 ? "s" : ""} enregistré{total !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par action, ressource ou utilisateur..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1) }}
            className="pl-9"
          />
        </div>
        <select
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); setPage(1) }}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none min-w-[180px]"
        >
          <option value="">Toutes les actions</option>
          {filters.actions.map((a) => (
            <option key={a} value={a}>{formatAction(a)}</option>
          ))}
        </select>
        <select
          value={resourceFilter}
          onChange={(e) => { setResourceFilter(e.target.value); setPage(1) }}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none min-w-[180px]"
        >
          <option value="">Toutes les ressources</option>
          {filters.resourceTypes.map((r) => (
            <option key={r} value={r}>{formatResource(r)}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      ) : logs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
            <Shield className="size-8" />
            <p className="text-sm">Aucun événement trouvé.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => {
            const detailText = formatDetails(log.details)
            const resourcePreview = getResourceSummary(log)
            const isExpanded = expanded.has(log.id)
            const hasRawDetails = log.details && Object.keys(log.details).length > 0

            return (
              <Card key={log.id} className="relative overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/5 to-transparent" />
                <CardContent className="pt-4 pb-3">
                  <div className="flex flex-col gap-2">
                    {/* Ligne 1 : action + ressource + date */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={cn("border text-[11px] font-medium", getActionColor(log.action))}>
                        {formatAction(log.action)}
                      </Badge>
                      <span className="text-xs text-muted-foreground font-medium">
                        {formatResource(log.resourceType)}
                      </span>
                      {resourcePreview && (
                        <span className="text-xs text-muted-foreground truncate max-w-[300px]" title={resourcePreview}>
                          {resourcePreview}
                        </span>
                      )}
                      <span className="text-[11px] text-muted-foreground/60 ml-auto flex items-center gap-1 shrink-0">
                        <Clock className="size-3" />
                        {new Date(log.createdAt).toLocaleString("fr-FR", {
                          day: "2-digit", month: "2-digit", year: "2-digit",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </span>
                    </div>

                    {/* Ligne 2 : utilisateur */}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      {log.user ? (
                        <span className="flex items-center gap-1">
                          <User className="size-3 shrink-0" />
                          {log.user.name}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 italic">
                          <User className="size-3 shrink-0" />
                          Système
                        </span>
                      )}
                      {log.ipAddress && (
                        <span className="font-mono text-[10px] text-muted-foreground/60">
                          {log.ipAddress}
                        </span>
                      )}
                      {hasRawDetails && (
                        <button
                          onClick={() => toggleExpand(log.id)}
                          className="ml-auto flex items-center gap-1 text-[11px] text-muted-foreground/60 hover:text-foreground transition-colors"
                        >
                          Détails
                          <ChevronDown className={cn("size-3 transition-transform", isExpanded && "rotate-180")} />
                        </button>
                      )}
                    </div>

                    {/* Ligne 3 : détails formatés */}
                    {detailText && (
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {detailText}
                      </p>
                    )}

                    {/* Détails bruts (expandable) */}
                    {isExpanded && hasRawDetails && (
                      <pre className="mt-1 rounded-lg bg-muted/40 p-2.5 text-[10px] font-mono leading-relaxed overflow-x-auto border border-border/50">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Page {page} sur {totalPages} ({total} résultat{total !== 1 ? "s" : ""})
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="size-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
