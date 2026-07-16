"use client"

import { useEffect, useState, useCallback } from "react"
import { toast } from "sonner"
import { ImageIcon, Loader2, FileX } from "lucide-react"
import { Card, CardContent, Badge, Button, cn, SwipeableRow, useMediaQuery, EmptyState } from "@nba/design-system"
import { KYCDoc, CachedGet, OpenPanel, RegisterRefetch } from "./types"

interface KycTabProps {
  cachedGet: CachedGet
  onOpenPanel: OpenPanel
  registerRefetch: RegisterRefetch
}

export function KycTab({ cachedGet, onOpenPanel, registerRefetch }: KycTabProps) {
  const [kycDocs, setKycDocs] = useState<KYCDoc[]>([])
  const [loadingKyc, setLoadingKyc] = useState(false)
  const [kycPage, setKycPage] = useState(1)
  const [kycTotalPages, setKycTotalPages] = useState(1)
  const [kycStatusFilter, setKycStatusFilter] = useState("ALL")
  const [kycError, setKycError] = useState(false)

  const fetchKyc = useCallback(async () => {
    setLoadingKyc(true)
    try {
      const params = new URLSearchParams()
      if (kycStatusFilter !== "ALL") params.set("status", kycStatusFilter)
      params.set("page", String(kycPage))
      const { ok, data } = await cachedGet(`/api/admin/kyc?${params}`)
      if (ok) {
        setKycDocs(data.docs ?? data)
        setKycTotalPages(data.pagination?.totalPages ?? 1)
        setKycError(false)
      } else {
        console.error("Erreur de chargement des dossiers KYC")
        setKycError(true)
      }
    } catch (err) {
      console.error(err)
      setKycError(true)
    } finally {
      setLoadingKyc(false)
    }
  }, [cachedGet, kycStatusFilter, kycPage])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchKyc()
    registerRefetch(() => {
      fetchKyc()
    })
    return () => registerRefetch(null)
  }, [fetchKyc, registerRefetch])

  const isDesktop = useMediaQuery("(min-width: 768px)")

  const approveKyc = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/admin/kyc/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "APPROVED", notes: "Approuvé via swipe" }),
      })
      if (res.ok) {
        toast.success("Document KYC approuvé")
        fetchKyc()
      } else {
        toast.error("Erreur lors de l'approbation KYC")
      }
    },
    [fetchKyc],
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Dossiers KYC</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Examinez et validez les pièces d&apos;identité des abonnés.
          </p>
        </div>
        <div className="flex gap-2">
          {["ALL", "PENDING", "APPROVED", "REJECTED"].map((s) => (
            <button
              key={s}
              onClick={() => { setKycStatusFilter(s); setKycPage(1) }}
              className={cn(
                "text-[10px] px-3 py-1 rounded-full border transition-colors cursor-pointer",
                kycStatusFilter === s
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:border-primary/50"
              )}
            >
              {s === "ALL" ? "Tous" : s}
            </button>
          ))}
        </div>
      </div>

      {loadingKyc ? (
        <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
      ) : kycDocs.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {kycDocs.map((doc) => {
              const card = (
                <Card key={doc.id} className="border-border bg-card/30 overflow-hidden">
                  <div className="h-40 bg-card border-b border-border flex items-center justify-center text-muted-foreground relative">
                    <ImageIcon className="size-8 text-muted-foreground/30" />
                    <Badge
                      variant="outline"
                      className={cn(
                        "absolute top-3 right-3 text-[9px] uppercase",
                        doc.status === "APPROVED" && "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
                        doc.status === "REJECTED" && "bg-rose-500/10 text-rose-600 border-rose-500/20",
                        doc.status === "PENDING" && "bg-amber-500/10 text-amber-600 border-amber-500/20"
                      )}
                    >
                      {doc.status}
                    </Badge>
                  </div>
                  <CardContent className="p-4 space-y-4">
                    <div>
                      <h4 className="font-bold text-foreground text-xs">{doc.user?.name}</h4>
                      <p className="text-[10px] text-muted-foreground">{doc.user?.email}</p>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-muted-foreground border-t border-border/60 pt-3">
                      <span>Reçu le : {new Date(doc.submittedAt || doc.createdAt).toLocaleDateString()}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-[10px] border-border h-7 cursor-pointer"
                        onClick={() => {
                          onOpenPanel({ title: "Dossier KYC", type: "kyc", data: doc })
                        }}
                      >
                        Examiner
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )

              if (doc.status !== "PENDING") return card

              return (
                <SwipeableRow
                  key={doc.id}
                  disabled={isDesktop}
                  leftActions={
                    <button
                      onClick={() => onOpenPanel({ title: "Dossier KYC", type: "kyc", data: doc })}
                      className="flex h-full w-full items-center justify-center gap-2 bg-amber-500/90 text-white text-[11px] font-medium"
                    >
                      ← Examiner
                    </button>
                  }
                  rightActions={
                    <button
                      onClick={() => approveKyc(doc.id)}
                      className="flex h-full w-full items-center justify-center gap-2 bg-emerald-600/90 text-white text-[11px] font-medium"
                    >
                      Approuver →
                    </button>
                  }
                >
                  {card}
                </SwipeableRow>
              )
            })}
          </div>
          {kycTotalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={kycPage <= 1}
                onClick={() => setKycPage((p) => Math.max(1, p - 1))}
                className="text-xs cursor-pointer"
              >
                ← Précédent
              </Button>
              <span className="text-[10px] text-muted-foreground">
                Page {kycPage} / {kycTotalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={kycPage >= kycTotalPages}
                onClick={() => setKycPage((p) => p + 1)}
                className="text-xs cursor-pointer"
              >
                Suivant →
              </Button>
            </div>
          )}
        </>
      ) : kycError ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-rose-500/30 bg-rose-500/5 px-4 py-3 text-xs text-rose-700">
          <span>Impossible de charger les dossiers KYC.</span>
          <Button size="sm" variant="outline" onClick={() => fetchKyc()}>Réessayer</Button>
        </div>
      ) : (
        <EmptyState
          icon={FileX}
          title="Aucun document KYC"
          description="Les documents soumis par les membres apparaîtront ici. Appuyez sur K pour tout réinitialiser."
          shortcut="K"
          action={{
            label: kycStatusFilter !== "ALL" ? "Tous les documents" : "Actualiser",
            onClick: () => { setKycStatusFilter("ALL"); setKycPage(1) },
          }}
        />
      )}
    </div>
  )
}
