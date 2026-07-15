"use client"

import { useEffect, useState, useCallback } from "react"
import { Loader2, FileX } from "lucide-react"
import { Card, CardContent, Badge, Button, cn } from "@nba/design-system"
import { EmptyState } from "@nba/app/components/empty-state"
import { BrokerVerification, CachedGet, OpenPanel, RegisterRefetch } from "./types"

interface BrokerTabProps {
  cachedGet: CachedGet
  invalidate: () => void
  onOpenPanel: OpenPanel
  registerRefetch: RegisterRefetch
}

export function BrokerTab({ cachedGet, onOpenPanel, registerRefetch }: BrokerTabProps) {
  const [brokerDocs, setBrokerDocs] = useState<BrokerVerification[]>([])
  const [loadingBroker, setLoadingBroker] = useState(false)
  const [brokerPage, setBrokerPage] = useState(1)
  const [brokerTotalPages, setBrokerTotalPages] = useState(1)
  const [brokerStatusFilter, setBrokerStatusFilter] = useState("ALL")

  const fetchBroker = useCallback(async () => {
    setLoadingBroker(true)
    try {
      const params = new URLSearchParams()
      if (brokerStatusFilter !== "ALL") params.set("status", brokerStatusFilter)
      params.set("page", String(brokerPage))
      const { ok, data } = await cachedGet(`/api/admin/broker?${params}`)
      if (ok) {
        setBrokerDocs(data.docs ?? data)
        setBrokerTotalPages(data.pagination?.totalPages ?? 1)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingBroker(false)
    }
  }, [cachedGet, brokerStatusFilter, brokerPage])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchBroker()
    registerRefetch(() => {
      fetchBroker()
    })
    return () => registerRefetch(null)
  }, [fetchBroker, registerRefetch])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Vérifications Broker</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Vérifiez la liaison de compte broker des utilisateurs avec les vidéos fournies.
          </p>
        </div>
        <div className="flex gap-2">
          {["ALL", "PENDING", "APPROVED", "REJECTED"].map((s) => (
            <button
              key={s}
              onClick={() => { setBrokerStatusFilter(s); setBrokerPage(1) }}
              className={cn(
                "text-[10px] px-3 py-1 rounded-full border transition-colors cursor-pointer",
                brokerStatusFilter === s
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:border-primary/50"
              )}
            >
              {s === "ALL" ? "Tous" : s}
            </button>
          ))}
        </div>
      </div>

      {loadingBroker ? (
        <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
      ) : brokerDocs.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {brokerDocs.map((doc) => (
              <Card key={doc.id} className="border-border bg-card/30">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-foreground text-xs">{doc.user?.name}</h4>
                      <p className="text-[10px] text-muted-foreground">{doc.user?.email}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[9px] uppercase",
                        doc.status === "APPROVED" && "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
                        doc.status === "REJECTED" && "bg-rose-500/10 text-rose-600 border-rose-500/20",
                        doc.status === "PENDING" && "bg-amber-500/10 text-amber-600 border-amber-500/20"
                      )}
                    >
                      {doc.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-muted/40 border border-border/60 text-[10px]">
                    <div>
                      <span className="text-[9px] text-muted-foreground block uppercase">Broker</span>
                      <span className="font-semibold text-foreground">{doc.brokerName}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-muted-foreground block uppercase">Numéro Compte</span>
                      <span className="font-semibold text-foreground">{doc.accountId}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/60 text-[10px] text-muted-foreground">
                    <span>Soumis le : {new Date(doc.submittedAt || doc.createdAt).toLocaleDateString()}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-[10px] border-border h-7 cursor-pointer"
                      onClick={() => {
                        onOpenPanel({ title: "Vérification Broker", type: "broker", data: doc })
                      }}
                    >
                      Visionner Preuve
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {brokerTotalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={brokerPage <= 1}
                onClick={() => setBrokerPage((p) => Math.max(1, p - 1))}
                className="text-xs cursor-pointer"
              >
                ← Précédent
              </Button>
              <span className="text-[10px] text-muted-foreground">
                Page {brokerPage} / {brokerTotalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={brokerPage >= brokerTotalPages}
                onClick={() => setBrokerPage((p) => p + 1)}
                className="text-xs cursor-pointer"
              >
                Suivant →
              </Button>
            </div>
          )}
        </>
      ) : (
        <EmptyState icon={FileX} title="Aucune vérification broker" />
      )}
    </div>
  )
}
