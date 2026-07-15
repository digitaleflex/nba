"use client"

import { useEffect, useState, useCallback } from "react"
import { Trash2, Loader2, Shield, User, FileText, Mail, Bell, Monitor } from "lucide-react"
import { Card, Button, Badge, cn } from "@nba/design-system"
import { AuditLog, CachedGet } from "./types"

interface AuditTabProps {
  cachedGet: CachedGet
  invalidate: () => void
}

const RESOURCE_ICONS: Record<string, typeof Shield> = {
  access_request: FileText,
  signal: Bell,
  user: User,
  email: Mail,
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: "text-emerald-400",
  APPROVE: "text-emerald-400",
  REJECT: "text-rose-400",
  REVOKE: "text-rose-400",
  SUSPEND: "text-amber-400",
  UPDATE: "text-sky-400",
  DELETE: "text-red-400",
  LOGIN: "text-blue-400",
  REGISTER: "text-violet-400",
}

function formatDetails(details: unknown, resourceType: string): string {
  if (!details || typeof details !== "object") return ""
  const d = details as Record<string, unknown>
  const parts: string[] = []

  if (d.reason && typeof d.reason === "string") parts.push(`Motif: ${d.reason}`)
  if (d.planId && typeof d.planId === "string") parts.push(`Plan: ${d.planId}`)
  if (d.oldStatus && typeof d.oldStatus === "string") parts.push(`${d.oldStatus} → ${d.status}`)
  else if (d.status && typeof d.status === "string") parts.push(`Statut: ${d.status}`)
  if (d.count != null) parts.push(`x${d.count}`)
  if (d.duration && typeof d.duration === "string") parts.push(`Durée: ${d.duration}`)

  return parts.join(" • ")
}

export function AuditTab({ cachedGet, invalidate }: AuditTabProps) {
  const [audits, setAudits] = useState<AuditLog[]>([])
  const [loadingAudits, setLoadingAudits] = useState(false)

  const fetchAudits = useCallback(async () => {
    setLoadingAudits(true)
    try {
      const { ok, data } = await cachedGet("/api/admin/audit-logs")
      if (ok) {
        setAudits(data.logs || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingAudits(false)
    }
  }, [cachedGet])

  useEffect(() => {
    fetchAudits()
  }, [fetchAudits])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Journal d&apos;audit</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Toutes les modifications critiques de la plateforme.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="text-xs"
          onClick={async () => {
            if (!confirm("Supprimer les logs d'audit de plus de 90 jours ?")) return
            invalidate()
            const res = await fetch("/api/admin/audit-logs", { method: "DELETE" })
            if (res.ok) {
              const { deleted, olderThanDays } = await res.json()
              alert(`${deleted} logs supprimés (> ${olderThanDays} jours)`)
              fetchAudits()
            }
          }}
        >
          <Trash2 className="size-3 mr-1" />
          Purger les vieux logs
        </Button>
      </div>

      <Card className="border-border bg-card/10">
        <div className="p-6">
          <div className="space-y-6">
            {loadingAudits ? (
              <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
            ) : audits.length > 0 ? (
              audits.map((log) => {
                const IconComp = RESOURCE_ICONS[log.resourceType] || Shield
                const actionColor = ACTION_COLORS[log.action] || "text-foreground"
                const detailsStr = formatDetails(log.details, log.resourceType)

                return (
                  <div key={log.id} className="relative pl-7 border-l border-border pb-6 last:pb-0">
                    <span className={cn(
                      "absolute -left-3 top-0.5 size-6 rounded-full border-2 border-border bg-card flex items-center justify-center",
                      log.action === "APPROVE" || log.action === "CREATE" ? "border-emerald-500/40" : "",
                      log.action === "REJECT" || log.action === "REVOKE" || log.action === "DELETE" ? "border-rose-500/40" : "",
                      log.action === "SUSPEND" ? "border-amber-500/40" : "",
                    )}>
                      <IconComp className="size-3 text-muted-foreground" />
                    </span>
                    <div className="space-y-1.5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={cn("font-semibold text-xs", actionColor)}>
                            {log.action}
                          </span>
                          {log.resourceType && (
                            <Badge variant="outline" className="text-[9px] border-border/50">
                              {log.resourceType.replace(/_/g, " ")}
                            </Badge>
                          )}
                          {log.resourceId && (
                            <span className="text-[9px] font-mono text-muted-foreground">
                              #{log.resourceId.slice(0, 8)}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {new Date(log.createdAt).toLocaleString("fr-FR", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <User className="size-3" />
                          {log.user?.name || log.user?.email || "System"}
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Monitor className="size-3" />
                          {log.ipAddress || "Interne"}
                        </span>
                      </div>
                      {detailsStr && (
                        <p className="text-[10px] text-foreground/70 bg-muted/30 rounded-md px-2 py-1">
                          {detailsStr}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="py-10 text-center text-muted-foreground">Aucun log enregistré.</div>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
