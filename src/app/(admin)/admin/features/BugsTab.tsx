"use client"

import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, Button, Badge, cn } from "@nba/design-system"
import { Bug, ChevronLeft, Loader2, AlertCircle, Circle, Clock, CheckCircle2, XCircle, Send } from "lucide-react"
import { toast } from "sonner"
import type { CachedGet } from "./types"

interface BugReport {
  id: string
  title: string
  body: string
  createdAt: string
  user: { id: string; name: string; email: string } | null
  data: {
    subject?: string
    message?: string
    severity?: string
    steps?: string
    status?: string
    adminNote?: string
    context?: Record<string, string | undefined>
    respondedBy?: string
    respondedAt?: string
    userEmail?: string
    userName?: string
  } | null
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Circle }> = {
  OPEN: { label: "Ouvert", color: "text-amber-600 border-amber-500/20 bg-amber-500/10", icon: Circle },
  IN_PROGRESS: { label: "En cours", color: "text-blue-600 border-blue-500/20 bg-blue-500/10", icon: Clock },
  FIXED: { label: "Corrigé", color: "text-emerald-600 border-emerald-500/20 bg-emerald-500/10", icon: CheckCircle2 },
  CLOSED: { label: "Fermé", color: "text-muted-foreground border-border bg-muted/40", icon: XCircle },
}

const SEVERITY_CONFIG: Record<string, { label: string; className: string }> = {
  high: { label: "Critique", className: "text-red-600 border-red-500/20 bg-red-500/10" },
  medium: { label: "Moyen", className: "text-orange-600 border-orange-500/20 bg-orange-500/10" },
  low: { label: "Mineur", className: "text-muted-foreground border-border bg-muted/40" },
}

const STATUS_ORDER = ["OPEN", "IN_PROGRESS", "FIXED", "CLOSED"]

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("fr-FR", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

function severityLabel(sev?: string) {
  return SEVERITY_CONFIG[sev ?? "low"]?.label ?? "Mineur"
}

const CONTEXT_LABELS: Record<string, string> = {
  url: "Page",
  userAgent: "Navigateur / UA",
  platform: "Plateforme",
  screen: "Écran",
  language: "Langue",
  timezone: "Fuseau",
  ip: "IP",
}

export function BugsTab({ cachedGet }: { cachedGet: CachedGet }) {
  const [bugs, setBugs] = useState<BugReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>("ALL")
  const [selected, setSelected] = useState<BugReport | null>(null)
  const [note, setNote] = useState("")
  const [saving, setSaving] = useState(false)

  const fetchBugs = useCallback(async () => {
    const url = filter === "ALL" ? "/api/admin/bugs" : `/api/admin/bugs?status=${filter}`
    const { ok, data } = await cachedGet(url, 15000)
    if (ok) setBugs(Array.isArray(data?.bugs) ? data.bugs : [])
    else setError("Impossible de charger les bugs.")
  }, [cachedGet, filter])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    setError(null)
    fetchBugs().finally(() => setLoading(false))
  }, [fetchBugs])

  const handleStatusChange = async (status: string) => {
    if (!selected) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/bugs/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminNote: note.trim() || undefined }),
      })
      if (!res.ok) throw new Error("Erreur")
      toast.success(`Bug marqué « ${STATUS_CONFIG[status]?.label} »`)
      setNote("")
      setSelected(null)
      fetchBugs()
    } catch {
      toast.error("Erreur lors de la mise à jour du bug")
    } finally {
      setSaving(false)
    }
  }

  const counts = {
    total: bugs.length,
    open: bugs.filter((b) => (b.data?.status ?? "OPEN") === "OPEN").length,
  }

  if (selected) {
    const d = selected.data ?? {}
    const status = d.status ?? "OPEN"
    const sc = STATUS_CONFIG[status] ?? STATUS_CONFIG.OPEN
    const StatusIcon = sc.icon
    const sev = severityLabel(d.severity)
    const sevCfg = SEVERITY_CONFIG[d.severity ?? "low"] ?? SEVERITY_CONFIG.low
    const contextEntries = Object.entries(d.context ?? {}).filter(([, v]) => !!v)
    const reporterName = d.userName || selected.user?.name || "Inconnu"
    const reporterEmail = d.userEmail || selected.user?.email || ""

    return (
      <div className="space-y-6">
        <button onClick={() => setSelected(null)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="size-4" /> Retour aux bugs
        </button>

        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-foreground">{d.subject || selected.title}</h1>
              <Badge variant="outline" className={cn("text-[10px]", sevCfg.className)}>{sev}</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
              <span className="font-semibold text-foreground/80">{reporterName}</span>
              {reporterEmail && (
                <>
                  <span className="text-muted-foreground/60">·</span>
                  <a href={`/admin?tab=members&search=${reporterEmail}`} className="hover:text-foreground transition-colors underline underline-offset-2 decoration-dotted">
                    {reporterEmail}
                  </a>
                </>
              )}
              <span className="text-muted-foreground/60">·</span>
              <span>{formatDate(selected.createdAt)}</span>
            </p>
          </div>
          <Badge variant="outline" className={cn("text-[10px] shrink-0", sc.color)}>
            <StatusIcon className="size-3 mr-1" />{sc.label}
          </Badge>
        </div>

        <Card className="border-border bg-card/30">
          <CardContent className="p-5 space-y-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Description</p>
              <p className="text-sm text-foreground/85 whitespace-pre-wrap">{d.message || selected.body}</p>
            </div>
            {d.steps && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Étapes pour reproduire</p>
                <p className="text-sm text-foreground/85 whitespace-pre-wrap">{d.steps}</p>
              </div>
            )}
            {contextEntries.length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Contexte technique</p>
                <div className="rounded-lg border border-border bg-background/50 p-3 space-y-1">
                  {contextEntries.map(([k, v]) => (
                    <div key={k} className="flex gap-2 text-xs">
                      <span className="w-28 shrink-0 text-muted-foreground">{CONTEXT_LABELS[k] ?? k}</span>
                      <span className="text-foreground/80 font-mono break-all">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {d.adminNote && (
          <Card className="border-emerald-500/20 bg-emerald-500/5">
            <CardContent className="p-5 space-y-1.5">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                Note admin · {d.respondedBy || "Admin"} {d.respondedAt ? `· ${formatDate(d.respondedAt)}` : ""}
              </p>
              <p className="text-sm text-foreground/85 whitespace-pre-wrap">{d.adminNote}</p>
            </CardContent>
          </Card>
        )}

        <Card className="border-border bg-card/30">
          <CardContent className="p-5 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground w-full">Changer le statut</p>
              {STATUS_ORDER.map((s) => {
                const cfg = STATUS_CONFIG[s]
                const Icon = cfg.icon
                const isActive = s === status
                return (
                  <Button
                    key={s}
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    className="cursor-pointer"
                    disabled={saving}
                    onClick={() => handleStatusChange(s)}
                  >
                    <Icon className="size-3.5 mr-1.5" />{cfg.label}
                  </Button>
                )
              })}
            </div>
            <textarea
              className="min-h-20 w-full rounded-lg border border-border bg-background p-3 text-sm text-foreground resize-y focus:outline-none focus:border-primary/50"
              placeholder="Note interne (envoyée au rapporteur si renseignée)…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <div className="flex justify-end">
              <Button
                variant="default"
                size="sm"
                className="cursor-pointer"
                disabled={saving || !note.trim()}
                onClick={() => handleStatusChange(status)}
              >
                {saving ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                <span className="ml-1.5">{saving ? "Enregistrement..." : "Notifier le rapporteur"}</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Bugs</h1>
          <p className="text-xs text-muted-foreground mt-1">
            {counts.open} bug{counts.open !== 1 ? "s" : ""} ouvert{counts.open !== 1 ? "s" : ""} sur {counts.total} — signalés par les membres et admins.
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {(["ALL", ...STATUS_ORDER] as const).map((s) => {
            const cfg = s === "ALL" ? { label: "Tous" } : STATUS_CONFIG[s]
            return (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={cn(
                  "text-[11px] px-3 py-1.5 rounded-full border transition-colors cursor-pointer",
                  filter === s ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-muted/50",
                )}
              >
                {cfg.label}
              </button>
            )
          })}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="size-6 animate-spin text-primary" /></div>
      ) : error ? (
        <Card className="border-border"><CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <AlertCircle className="size-10 text-destructive" />
          <p className="font-semibold text-foreground">{error}</p>
        </CardContent></Card>
      ) : bugs.length === 0 ? (
        <Card className="border-border"><CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <Bug className="size-10 text-muted-foreground" />
          <p className="font-semibold text-foreground">Aucun bug</p>
          <p className="text-sm text-muted-foreground">Les bugs signalés apparaîtront ici.</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          {bugs.map((bug) => {
            const d = bug.data ?? {}
            const status = d.status ?? "OPEN"
            const sc = STATUS_CONFIG[status] ?? STATUS_CONFIG.OPEN
            const StatusIcon = sc.icon
            const sevCfg = SEVERITY_CONFIG[d.severity ?? "low"] ?? SEVERITY_CONFIG.low
            const reporterName = d.userName || bug.user?.name || "Inconnu"

            return (
              <button key={bug.id} onClick={() => setSelected(bug)} className="w-full text-left">
                <Card className="border-border hover:bg-muted/20 transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-semibold text-sm text-foreground truncate">{d.subject || bug.title}</p>
                          <Badge variant="outline" className={cn("text-[10px] shrink-0", sevCfg.className)}>
                            {severityLabel(d.severity)}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate flex items-center gap-1.5">
                          <span className="font-medium">{reporterName}</span>
                          <span className="text-muted-foreground/50">·</span>
                          <span>{d.userEmail || bug.user?.email || ""}</span>
                        </p>
                        <p className="text-xs text-foreground/70 mt-1 line-clamp-2">{d.message || bug.body}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <Badge variant="outline" className={cn("text-[10px]", sc.color)}>
                          <StatusIcon className="size-3 mr-1" />{sc.label}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">{formatDate(bug.createdAt)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
