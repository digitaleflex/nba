"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, cn } from "@nba/design-system"
import { Clock, Play, RefreshCw, Loader2, CheckCircle2, XCircle, HelpCircle, FileText } from "lucide-react"
import { toast } from "sonner"

interface CronJob {
  name: string
  schedule: string
  command: string
  logFile: string | null
  lastRun: string | null
  lastStatus: "success" | "failed" | "unknown"
  lastMessage: string | null
  enabled: boolean
}

const CRON_LABELS: Record<string, { label: string; desc: string }> = {
  "email-stuck-pending": { label: "Email stuck pending", desc: "Marque FAILED les livraisons PENDING > 1h" },
  "email-reputation-check": { label: "Réputation email", desc: "Calcule bounce/complaint rate" },
  "cleanup-ghost-access": { label: "Cleanup accès fantômes", desc: "Révoque les accès des inactifs" },
  "cleanup-email-events": { label: "GDPR email events", desc: "Supprime les événements email > 6 mois" },
  "email-daily-digest": { label: "Digest quotidien", desc: "Résumé des activités des dernières 24h" },
  "journal-weekly-report": { label: "Rapport journal hebdo", desc: "Rapport de trading de la semaine aux membres" },
  "cleanup": { label: "Cleanup backup", desc: "Nettoyage hebdomadaire externe" },
  "backup-postgres": { label: "Backup PostgreSQL", desc: "Sauvegarde quotidienne de la base" },
  "healthcheck-alert": { label: "Healthcheck", desc: "Alerte de santé des services" },
  "monitor": { label: "Monitor GitHub", desc: "Surveillance des dépôts" },
}

function getFriendlySchedule(raw: string): string {
  const parts = raw.trim().split(/\s+/)
  if (parts.length < 5) return raw
  const [min, hour, dom, month, dow] = parts

  if (min === "0" && hour === "*" && dom === "*" && month === "*" && dow === "*") return "Toutes les heures"
  if (min === "0" && hour !== "*" && dom === "*" && month === "*" && dow === "*") return `Tous les jours à ${hour}h`
  if (min === "0" && hour !== "*" && dom === "*" && month === "*" && ["0","1","2","3","4","5","6","7"].includes(dow)) {
    const jours = ["dimanche","lundi","mardi","mercredi","jeudi","vendredi","samedi","dimanche"]
    const idx = dow === "7" ? 0 : parseInt(dow)
    return `${jours[idx]} à ${hour}h`
  }
  if (min === "*/5") return "Toutes les 5 min"
  if (min === "*") return "Toutes les minutes"
  return raw
}

function getEstTimeAgo(dateStr: string | null): string {
  if (!dateStr) return "—"
  const match = dateStr.match(/(\d{4}-\d{2}-\d{2})T?\d{2}:\d{2}:\d{2}/)
  if (match) return match[1]
  const logMatch = dateStr.match(/(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/)
  if (logMatch) return logMatch[1]
  return dateStr.slice(0, 16)
}

export function CronsTab() {
  const [jobs, setJobs] = useState<CronJob[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCrons = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/crons")
      if (!res.ok) throw new Error("Erreur de chargement")
      const data = await res.json()
      setJobs(data.jobs ?? [])
    } catch {
      setError("Impossible de charger les cron jobs")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCrons()
    const id = setInterval(fetchCrons, 60_000)
    return () => clearInterval(id)
  }, [fetchCrons])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return <p className="py-10 text-center text-sm text-muted-foreground">{error}</p>
  }

  if (jobs.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Cron Jobs</h2>
          <p className="text-sm text-muted-foreground">Aucun cron job configuré.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Cron Jobs</h2>
          <p className="text-sm text-muted-foreground">
            {jobs.length} tâche{jobs.length > 1 ? "s" : ""} planifiée{jobs.length > 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => { setLoading(true); fetchCrons() }}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          <RefreshCw className="size-3.5" /> Actualiser
        </button>
      </div>

      <div className="space-y-2">
        {jobs.map((job, idx) => {
          const meta = CRON_LABELS[job.name] ?? { label: job.name, desc: "" }
          const StatusIcon = job.lastStatus === "success" ? CheckCircle2
            : job.lastStatus === "failed" ? XCircle
            : HelpCircle
          const statusColor = job.lastStatus === "success" ? "text-emerald-500"
            : job.lastStatus === "failed" ? "text-rose-500"
            : "text-muted-foreground/50"

          return (
            <Card key={idx}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center gap-1 pt-0.5">
                    <StatusIcon className={cn("size-5", statusColor)} />
                    <div className={cn(
                      "size-1.5 rounded-full",
                      job.lastStatus === "success" ? "bg-emerald-500"
                        : job.lastStatus === "failed" ? "bg-rose-500"
                        : "bg-muted-foreground/30"
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold">{meta.label}</h3>
                      {meta.desc && (
                        <span className="text-xs text-muted-foreground hidden sm:inline">{meta.desc}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" /> {getFriendlySchedule(job.schedule)}
                      </span>
                      {job.lastRun && (
                        <span className="flex items-center gap-1">
                          <Play className="size-3" /> Dernier : {getEstTimeAgo(job.lastRun)}
                        </span>
                      )}
                      {job.logFile && (
                        <span className="flex items-center gap-1 text-muted-foreground/60" title={job.logFile}>
                          <FileText className="size-3" /> {job.logFile.split("/").pop()}
                        </span>
                      )}
                    </div>
                    {job.lastMessage && (
                      <p className="text-xs text-muted-foreground/60 mt-1.5 font-mono truncate" title={job.lastMessage}>
                        {job.lastMessage}
                      </p>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground/40 font-mono shrink-0 pt-0.5">
                    {job.schedule}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
