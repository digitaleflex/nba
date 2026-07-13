"use client"

import { useEffect, useState, useCallback } from "react"
import { Loader2 } from "lucide-react"
import { Card, Badge, cn } from "@nba/design-system"
import { CachedGet } from "./types"

interface MembresTabProps {
  cachedGet: CachedGet
}

export function MembresTab({ cachedGet }: MembresTabProps) {
  const [membres, setMembres] = useState<any[]>([])
  const [membrePlanFilter, setMembrePlanFilter] = useState("")
  const [membrePlans, setMembrePlans] = useState<any[]>([])
  const [loadingMembres, setLoadingMembres] = useState(false)

  const fetchMembres = useCallback(async () => {
    setLoadingMembres(true)
    try {
      const params = new URLSearchParams()
      if (membrePlanFilter) params.set("planId", membrePlanFilter)
      const url = `/api/admin/members?${params}`
      const { ok, data } = await cachedGet(url)
      if (ok) {
        setMembres(data.members || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingMembres(false)
    }
  }, [cachedGet, membrePlanFilter])

  const fetchMembrePlans = useCallback(async () => {
    try {
      const { ok, data } = await cachedGet("/api/public/plans")
      if (ok) {
        setMembrePlans(Array.isArray(data) ? data : [])
      }
    } catch (err) {
      console.error(err)
    }
  }, [cachedGet])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMembrePlans()
    fetchMembres()
  }, [fetchMembrePlans, fetchMembres])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Membres</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Membres validés, filtrés par abonnement
          </p>
        </div>
      </div>

      {/* Filtre par abonnement */}
      <div className="flex items-center gap-2">
        <select
          value={membrePlanFilter}
          onChange={(e) => setMembrePlanFilter(e.target.value)}
          className="h-9 rounded-lg border border-border bg-background px-3 text-xs text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
        >
          <option value="">Tous les abonnements</option>
          {membrePlans.map((p: any) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <span className="text-xs text-muted-foreground">
          {loadingMembres ? "..." : `${membres.length} membre${membres.length > 1 ? "s" : ""}`}
        </span>
      </div>

      {/* Liste */}
      <Card className="border-border bg-card/30">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-card/30 text-muted-foreground font-bold uppercase tracking-wider text-[10px]">
                <th className="px-4 py-3">Membre</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Abonnement(s)</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Inscrit le</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loadingMembres ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center"><Loader2 className="animate-spin text-primary inline" /></td>
                </tr>
              ) : membres.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted-foreground">Aucun membre trouvé</td>
                </tr>
              ) : (
                membres.map((m: any) => (
                  <tr key={m.id} className="hover:bg-card/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{m.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{m.email}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {m.accessRequests?.map((ar: any) => (
                          <Badge key={ar.plan.id} variant="secondary" className="text-[10px] px-1.5 py-0">
                            {ar.plan.name}
                          </Badge>
                        ))}
                        {(!m.accessRequests || m.accessRequests.length === 0) && (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={cn(
                        "text-[10px] px-1.5 py-0",
                        m.isActive ? "text-emerald-600 border-emerald-500/20 bg-emerald-500/10" : "text-muted-foreground"
                      )}>
                        {m.isActive ? "Actif" : "Inactif"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(m.createdAt).toLocaleDateString("fr-FR")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
