"use client"

import { useEffect, useState, useCallback } from "react"
import { Trash2, Loader2 } from "lucide-react"
import { Card, Button } from "@nba/design-system"
import { AuditLog, CachedGet } from "./types"

interface AuditTabProps {
  cachedGet: CachedGet
  invalidate: () => void
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAudits()
  }, [fetchAudits])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Journal d&apos;audit</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Timeline de type GitHub enregistrant toutes les modifications critiques de la plateforme.
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
              const data = await res.json()
              alert(`${data.deleted} logs supprimés (plus de ${data.olderThanDays} jours)`)
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
              audits.map((log) => (
                <div key={log.id} className="relative pl-6 border-l border-border pb-6 last:pb-0">
                  <span className="absolute -left-1.5 top-1.5 size-3 rounded-full border border-border bg-card flex items-center justify-center">
                    <span className="size-1 rounded-full bg-primary" />
                  </span>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-semibold text-xs text-foreground">
                        {log.action}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(log.createdAt).toLocaleString("fr-FR")}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Réalisé par : {log.user?.name || "System"} • Appareil : {log.ipAddress || "Interne"}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-10 text-center text-muted-foreground">Aucun log enregistré.</div>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
