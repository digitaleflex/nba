"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, Badge, Button } from "@nba/design-system"
import { Check, Loader2, AlertCircle, Radio, Calendar, Tag, Hash } from "lucide-react"
import Link from "next/link"

interface Plan {
  id: string
  name: string
  description: string | null
  price: number
  currency: string
  durationDays: number
  features: string[]
  isActive: boolean
}

interface AccessRequest {
  id: string
  planId: string
  status: string
  createdAt: string
  reviewedAt: string | null
  notes: string | null
  plan: Plan
}

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className: string }> = {
  APPROVED: { label: "Actif", variant: "default", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  PENDING: { label: "En attente", variant: "outline", className: "text-amber-600 border-amber-500/30 bg-amber-500/10" },
  REJECTED: { label: "Refusé", variant: "destructive", className: "" },
  SUSPENDED: { label: "Suspendu", variant: "outline", className: "text-muted-foreground" },
  REVOKED: { label: "Révoqué", variant: "destructive", className: "" },
}

function PlanCard({ request, isCurrentChoice }: { request: AccessRequest; isCurrentChoice: boolean }) {
  const { plan, status, createdAt, reviewedAt, notes } = request
  const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING
  const endDate = reviewedAt
    ? new Date(new Date(reviewedAt).getTime() + plan.durationDays * 86400000)
    : null

  return (
    <Card className="border-border/50">
      <CardContent className="p-5 space-y-4">
        {/* Header : nom + statut */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
              {isCurrentChoice && (
                <Badge variant="outline" className="text-[10px] text-primary border-primary/30 bg-primary/5">
                  Choix initial
                </Badge>
              )}
            </div>
            {plan.description && (
              <p className="text-sm text-muted-foreground">{plan.description}</p>
            )}
          </div>
          <Badge variant={statusConfig.variant} className={statusConfig.className}>
            {statusConfig.label}
          </Badge>
        </div>

        {/* Détails : prix, durée, date */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
          <div className="space-y-0.5">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Prix</p>
            <p className="font-semibold text-foreground">
              {Number(plan.price) === 0 ? "Gratuit" : `${plan.price} ${plan.currency}`}
            </p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Durée</p>
            <p className="font-semibold text-foreground">{plan.durationDays} jours</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Demandé le</p>
            <p className="font-semibold text-foreground">
              {new Date(createdAt).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Dates d'approbation / expiration */}
        {(reviewedAt || endDate) && (
          <div className="grid grid-cols-2 gap-3 text-sm pt-2 border-t border-border/50">
            {reviewedAt && (
              <div className="space-y-0.5">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Approuvé le</p>
                <p className="text-foreground">
                  {new Date(reviewedAt).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
            )}
            {endDate && (
              <div className="space-y-0.5">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Expire le</p>
                <p className="text-foreground">
                  {endDate.toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Features */}
        {plan.features && plan.features.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-border/50">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Inclus</p>
            <ul className="space-y-1">
              {plan.features.map((f, i) => (
                <li key={i} className="flex items-center gap-1.5 text-sm text-foreground">
                  <Check className="size-3.5 text-primary shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Notes admin (si refusée) */}
        {notes && status === "REJECTED" && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
            <p className="text-[10px] uppercase tracking-wider font-bold mb-1">Raison du refus</p>
            <p className="italic">"{notes}"</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function SubscriptionPage() {
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/dashboard/subscription")
      .then((r) => r.json())
      .then((subData) => setAccessRequests(subData.requests || []))
      .catch(() => setError("Erreur de chargement"))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Abonnement</h1>
        <Card className="border-destructive/30">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <AlertCircle className="size-10 text-destructive" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>Réessayer</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const approved = accessRequests.filter((r) => r.status === "APPROVED")
  const pending = accessRequests.filter((r) => r.status === "PENDING")
  const rejected = accessRequests.filter((r) => r.status === "REJECTED")
  const others = accessRequests.filter((r) => !["APPROVED", "PENDING", "REJECTED"].includes(r.status))
  const hasAny = accessRequests.length > 0

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Abonnement</h1>
        <p className="text-sm text-muted-foreground">Gérez vos accès aux groupes de diffusion</p>
      </div>

      {!hasAny && (
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <Radio className="size-10 text-warning" />
            <div className="space-y-1">
              <p className="font-semibold text-warning">Aucun abonnement actif</p>
              <p className="text-sm text-muted-foreground">
                Vous n&apos;avez pas encore sélectionné d&apos;abonnement.
              </p>
            </div>
            <Link href="/onboarding">
              <Button variant="outline" size="sm">Choisir un abonnement</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Section 1 : Abonnements actifs (approuvés) */}
      {approved.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Check className="size-4 text-emerald-600" />
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Abonnements actifs ({approved.length})
            </h2>
          </div>
          {approved.map((r) => (
            <PlanCard key={r.id} request={r} isCurrentChoice={approved.length === 1} />
          ))}
        </div>
      )}

      {/* Section 2 : Demandes en attente (choix initial) */}
      {pending.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Tag className="size-4 text-amber-600" />
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Choix initial en attente ({pending.length})
            </h2>
          </div>
          {pending.map((r) => (
            <PlanCard key={r.id} request={r} isCurrentChoice={pending.length === 1 && approved.length === 0} />
          ))}
        </div>
      )}

      {/* Section 3 : Refusées */}
      {rejected.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 text-destructive" />
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Demandes refusées ({rejected.length})
            </h2>
          </div>
          {rejected.map((r) => (
            <PlanCard key={r.id} request={r} isCurrentChoice={false} />
          ))}
        </div>
      )}

      {/* Section 4 : Autres (suspendu, révoqué) */}
      {others.length > 0 && (
        <div className="space-y-3">
          {others.map((r) => (
            <PlanCard key={r.id} request={r} isCurrentChoice={false} />
          ))}
        </div>
      )}
    </div>
  )
}
