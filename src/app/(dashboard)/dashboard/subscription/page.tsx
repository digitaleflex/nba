"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, Badge, Button } from "@nba/design-system"
import { CreditCard, Check, Loader2, AlertCircle, Radio } from "lucide-react"
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
  plan: Plan
}

export default function SubscriptionPage() {
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch("/api/public/plans").then((r) => r.json()),
      fetch("/api/dashboard/subscription").then((r) => r.json()).catch(() => ({ requests: [] })),
    ])
      .then(([plansData, subData]) => {
        setPlans(Array.isArray(plansData) ? plansData : [])
        setAccessRequests(subData.requests || [])
      })
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

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Abonnement</h1>
        <p className="text-sm text-muted-foreground">Gérez vos accès aux groupes de diffusion</p>
      </div>

      {approved.length > 0 ? (
        <Card className="border-primary/10">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-success/10 text-success">
                <Check className="size-5" />
              </div>
              <div>
                <p className="font-semibold">Abonnement actif</p>
                <p className="text-sm text-muted-foreground">
                  Vous avez accès à {approved.length} groupe{approved.length > 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {approved.map((r) => (
                <Badge key={r.id} variant="secondary" className="px-3 py-1">
                  {r.plan.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <Radio className="size-10 text-warning" />
            <div className="space-y-1">
              <p className="font-semibold text-warning">Aucun abonnement actif</p>
              <p className="text-sm text-muted-foreground">
                Vous n&apos;avez pas encore accès à un groupe de diffusion.
              </p>
            </div>
            <Link href="/onboarding">
              <Button variant="outline" size="sm">Voir les offres</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {pending.length > 0 && (
        <Card className="border-muted">
          <CardContent className="p-5 space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Demandes en attente
            </h3>
            {pending.map((r) => (
              <div key={r.id} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium">{r.plan.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Demandé le {new Date(r.createdAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <Badge variant="outline" className="text-warning border-warning/30">En attente</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Offres disponibles</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {plans.filter((p) => p.isActive).map((plan) => {
            const isSubscribed = approved.some((r) => r.planId === plan.id) || pending.some((r) => r.planId === plan.id)
            return (
              <Card key={plan.id} className={`relative overflow-hidden ${isSubscribed ? "border-primary/20" : ""}`}>
                {isSubscribed && (
                  <div className="absolute right-3 top-3">
                    <Badge variant="default" className="bg-primary text-[10px]">
                      {approved.some((r: any) => r.planId === plan.id) ? "Actif" : "En attente"}
                    </Badge>
                  </div>
                )}
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <CreditCard className="size-4 text-primary" />
                    <h3 className="font-semibold">{plan.name}</h3>
                  </div>
                  <p className="text-2xl font-bold">
                    {plan.currency} {Number(plan.price).toFixed(2)}
                    <span className="text-sm font-normal text-muted-foreground">
                      /{plan.durationDays}j
                    </span>
                  </p>
                  {plan.description && (
                    <p className="text-xs text-muted-foreground">{plan.description}</p>
                  )}
                  {Array.isArray(plan.features) && plan.features.length > 0 && (
                    <ul className="space-y-1">
                      {plan.features.map((f: string, i: number) => (
                        <li key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Check className="size-3 text-primary shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
