"use client"

import { useEffect, useState, useCallback } from "react"
import { Search, Loader2, ChevronLeft, ChevronRight, Shield, Clock, User } from "lucide-react"
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
  "kyc.approved": "KYC approuvé",
  "kyc.rejected": "KYC refusé",
  "broker.approved": "Broker approuvé",
  "broker.rejected": "Broker refusé",
}

function formatAction(action: string): string {
  return ACTION_LABELS[action] ?? action.replace(/_/g, " ").replace(/\./g, " → ")
}

function getActionColor(action: string): string {
  if (action.includes("approved")) return "bg-success/10 text-success border-success/20"
  if (action.includes("rejected") || action.includes("deleted")) return "bg-destructive/10 text-destructive border-destructive/20"
  if (action.includes("created") || action.includes("published")) return "bg-primary/10 text-primary border-primary/20"
  return "bg-muted text-muted-foreground border-border"
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
      } else {
        console.error("Échec de chargement des logs d'audit")
      }
    } finally {
      setLoading(false)
    }
  }, [query, actionFilter, resourceFilter, page])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const totalPages = Math.ceil(total / limit)

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
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none text-muted-foreground focus:text-foreground min-w-[160px]"
        >
          <option value="">Toutes les actions</option>
          {filters.actions.map((a) => (
            <option key={a} value={a}>{formatAction(a)}</option>
          ))}
        </select>
        <select
          value={resourceFilter}
          onChange={(e) => { setResourceFilter(e.target.value); setPage(1) }}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none text-muted-foreground focus:text-foreground min-w-[160px]"
        >
          <option value="">Toutes les ressources</option>
          {filters.resourceTypes.map((r) => (
            <option key={r} value={r}>{r.replace(/_/g, " ")}</option>
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
          {logs.map((log) => (
            <Card key={log.id} className="relative overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={cn("border", getActionColor(log.action))}>
                        {formatAction(log.action)}
                      </Badge>
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                        {log.resourceType.replace(/_/g, " ")}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {log.user && (
                        <span className="flex items-center gap-1">
                          <User className="size-3" />
                          {log.user.name}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {new Date(log.createdAt).toLocaleString("fr-FR")}
                      </span>
                      {log.ipAddress && (
                        <span className="text-[10px] font-mono">{log.ipAddress}</span>
                      )}
                    </div>
                    {log.resourceId && (
                      <p className="text-[10px] font-mono text-muted-foreground">
                        ID: {log.resourceId}
                      </p>
                    )}
                    {log.details && Object.keys(log.details).length > 0 && (
                      <pre className="mt-1 rounded-lg bg-muted/30 p-2 text-[10px] font-mono leading-relaxed overflow-x-auto">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Page {page} sur {totalPages} ({total} résultat{total !== 1 ? "s" : ""})
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
