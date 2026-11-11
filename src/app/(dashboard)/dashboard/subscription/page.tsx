"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, Button } from "@nba/design-system"
import {
  Check, Loader2, AlertCircle, Calendar, RefreshCw, MessageCircle,
  Clock, ArrowRight, Zap,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { apiFetch, getErrorMessage } from "@nba/lib/fetch-client"

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

function daysUntil(dateStr: string | Date) {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000)
}

function daysSince(dateStr: string | Date) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
}

function endDate(request: AccessRequest): Date | null {
  if (!request.reviewedAt) return null
  return new Date(new Date(request.reviewedAt).getTime() + request.plan.durationDays * 86400000)
}

function isActive(request: AccessRequest) {
  const end = endDate(request)
  return request.status === "APPROVED" && (!end || end.getTime() > Date.now())
}

function isExpired(request: AccessRequest) {
  const end = endDate(request)
  return request.status === "APPROVED" && end && end.getTime() <= Date.now()
}

export default function SubscriptionPage() {
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiFetch("/api/dashboard/subscription")
      .then((r) => r.json())
      .then((d) => setAccessRequests(Array.isArray(d.requests) ? d.requests : []))
      .catch((err) => {
        setError(getErrorMessage(err))
        toast.error("Impossible de charger tes abonnements.")
      })
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
            <p role="alert" className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>Réessayer</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const approved = accessRequests.filter(r => r.status === "APPROVED")
  const activeList = approved.filter(isActive)
  const expiredList = approved.filter(isExpired)
  const pending = accessRequests.filter(r => r.status === "PENDING")
  const rejected = accessRequests.filter(r => r.status === "REJECTED")
  const hasAny = accessRequests.length > 0

  // Plan prioritaire : celui qui expire bientôt ou le premier approuvé
  const currentPlan = activeList[0] ?? expiredList[0] ?? null
  const currentPlanEnd = currentPlan ? endDate(currentPlan) : null
  const currentPlanDaysLeft = currentPlanEnd ? daysUntil(currentPlanEnd) : null
  const isCurrentExpired = currentPlan ? isExpired(currentPlan) : false
  const currentPlanExpiredDays = currentPlan && isCurrentExpired && currentPlanEnd ? daysSince(currentPlanEnd) : null

  const checkoutUrl = currentPlan
    ? (Array.isArray(currentPlan.plan.features) ? currentPlan.plan.features : []).find(f => f.startsWith("http")) ?? null
    : null

  const features = currentPlan
    ? (Array.isArray(currentPlan.plan.features) ? currentPlan.plan.features : []).filter(f => !f.startsWith("http"))
    : []

  // Tous les plans disponibles (uniques par planId) pour affichage secondaire
  const otherPlans = accessRequests
    .filter(r => !currentPlan || r.planId !== currentPlan.planId)
    .reduce((acc, r) => {
      if (!acc.find(x => x.planId === r.planId)) acc.push(r)
      return acc
    }, [] as AccessRequest[])

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Abonnement</h1>
        <p className="text-sm text-muted-foreground">Gère ton accès aux signaux premium</p>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          BANNIÈRE D'URGENCE — expiration ou inactivité
      ══════════════════════════════════════════════════════════════ */}
      {isCurrentExpired && (
        <div className="rounded-xl border-2 border-destructive/30 bg-destructive/5 p-5 space-y-3">
          <div className="flex items-start gap-3">
            <Clock className="size-5 text-destructive mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="font-bold text-destructive">
                Ton abonnement a expiré
              </p>
              <p className="text-sm text-foreground/80">
                Accès au plan <strong>{currentPlan!.plan.name}</strong> expiré le{" "}
                {currentPlanEnd!.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                {currentPlanExpiredDays !== null && currentPlanExpiredDays > 0 && (
                  <> — il y a <strong>{currentPlanExpiredDays} jour{currentPlanExpiredDays > 1 ? "s" : ""}</strong></>
                )}
              </p>
              <p className="text-sm text-muted-foreground">
                Tes signaux ne sont plus diffusés. Renouvelle pour retrouver l&apos;accès immédiatement.
              </p>
            </div>
          </div>
          {checkoutUrl && (
            <a href={checkoutUrl} target="_blank" rel="noopener noreferrer" className="block">
              <Button className="w-full gap-2 cursor-pointer" size="lg">
                <RefreshCw className="size-4" />
                Renouveler maintenant — {currentPlan!.plan.price} {currentPlan!.plan.currency}
                <ArrowRight className="size-4" />
              </Button>
            </a>
          )}
        </div>
      )}

      {/* Bannière "pas encore d'abonnement" */}
      {!hasAny && (
        <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-5 space-y-3">
          <div className="flex items-start gap-3">
            <Zap className="size-5 text-primary mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="font-bold text-foreground">Bienvenue sur SignauxX</p>
              <p className="text-sm text-muted-foreground">
                Choisis un plan ci-dessous pour recevoir nos signaux premium dans ton groupe Telegram.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Bannière "en attente" */}
      {pending.length > 0 && activeList.length === 0 && expiredList.length === 0 && (
        <div className="rounded-xl border-2 border-amber-500/20 bg-amber-500/5 p-5 space-y-2">
          <div className="flex items-start gap-3">
            <Clock className="size-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-bold text-amber-700">Demande en cours de traitement</p>
              <p className="text-sm text-muted-foreground">
                Ta demande d&apos;accès est en cours de validation par un administrateur.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          PLAN ACTIF / EXPIRÉ — carte principale
      ══════════════════════════════════════════════════════════════ */}
      {currentPlan && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Check className={cn("size-4", isCurrentExpired ? "text-destructive" : "text-success")} />
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              {isCurrentExpired ? "Dernier abonnement" : "Abonnement actif"}
            </h2>
          </div>

          <Card className={cn(
            "border-2 shadow-md",
            isCurrentExpired ? "border-destructive/30" : "border-success/20"
          )}>
            <CardContent className="p-6 space-y-5">
              {/* Header plan */}
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-foreground">{currentPlan.plan.name}</h3>
                  {currentPlan.plan.description && (
                    <p className="text-sm text-muted-foreground">{currentPlan.plan.description}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-foreground tabular-nums">
                    {currentPlan.plan.price}
                    <span className="text-sm font-normal text-muted-foreground ml-1">{currentPlan.plan.currency}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {currentPlan.plan.durationDays} jours
                  </p>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm pt-3 border-t border-border/50">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-0.5">Approuvé le</p>
                  <p className="font-semibold text-foreground">
                    {currentPlan.reviewedAt
                      ? new Date(currentPlan.reviewedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-0.5">Expire le</p>
                  <p className="font-semibold text-foreground">
                    {currentPlanEnd
                      ? currentPlanEnd.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-0.5">
                    {isCurrentExpired ? "Expiré depuis" : "Jours restants"}
                  </p>
                  <p className={cn(
                    "font-bold",
                    isCurrentExpired ? "text-destructive" : (currentPlanDaysLeft !== null && currentPlanDaysLeft <= 7 ? "text-amber-600" : "text-foreground")
                  )}>
                    {isCurrentExpired
                      ? `${currentPlanExpiredDays} jour${currentPlanExpiredDays !== 1 ? "s" : ""}`
                      : currentPlanDaysLeft !== null
                        ? `${currentPlanDaysLeft} jour${currentPlanDaysLeft !== 1 ? "s" : ""}`
                        : "—"}
                  </p>
                </div>
              </div>

              {/* Features */}
              {features.length > 0 && (
                <div className="pt-3 border-t border-border/50">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-2">Inclus dans ce plan</p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {features.map((f, i) => (
                      <li key={i} className="flex items-center gap-1.5 text-sm text-foreground">
                        <Check className="size-3.5 text-success shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* CTA */}
              {checkoutUrl && (
                <a href={checkoutUrl} target="_blank" rel="noopener noreferrer" className="block pt-2">
                  <Button
                    className={cn("w-full gap-2 cursor-pointer", isCurrentExpired && "bg-destructive hover:bg-destructive/90")}
                    size="lg"
                  >
                    {isCurrentExpired ? (
                      <><RefreshCw className="size-4" /> Renouveler l&apos;accès</>
                    ) : (
                      <><Calendar className="size-4" /> Prolonger l&apos;accès</>
                    )}
                  </Button>
                </a>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          AUTRES PLANS — comparaison secondaire
      ══════════════════════════════════════════════════════════════ */}
      {otherPlans.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
            Autres plans
          </h2>
          <div className="grid gap-3">
            {otherPlans.map((r) => {
              const rCheckout = (Array.isArray(r.plan.features) ? r.plan.features : []).find(f => f.startsWith("http"))
              const rFeatures = (Array.isArray(r.plan.features) ? r.plan.features : []).filter(f => !f.startsWith("http"))
              return (
                <Card key={r.id} className="border-border/50">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-foreground">{r.plan.name}</p>
                        {r.plan.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">{r.plan.description}</p>
                        )}
                      </div>
                      <p className="text-lg font-bold text-foreground tabular-nums shrink-0">
                        {r.plan.price} <span className="text-xs font-normal text-muted-foreground">{r.plan.currency}</span>
                      </p>
                    </div>
                    {rFeatures.length > 0 && (
                      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        {rFeatures.map((f, i) => (
                          <li key={i} className="flex items-center gap-1">
                            <Check className="size-3 text-success/70" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    )}
                    {rCheckout && (
                      <a href={rCheckout} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm" className="w-full gap-1.5 cursor-pointer">
                          Choisir ce plan
                          <ArrowRight className="size-3" />
                        </Button>
                      </a>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          DEMANDES REFUSÉES — contact admin
      ══════════════════════════════════════════════════════════════ */}
      {rejected.length > 0 && (
        <Card className="border-destructive/20">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="size-4" />
              <p className="font-semibold text-sm">Demande refusée</p>
            </div>
            {rejected[0].notes && (
              <p className="text-sm text-muted-foreground italic">&ldquo;{rejected[0].notes}&rdquo;</p>
            )}
            <Link href="/dashboard/messages">
              <Button variant="outline" size="sm" className="gap-1.5 cursor-pointer">
                <MessageCircle className="size-3.5" />
                Contacter un administrateur
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(" ")
}
