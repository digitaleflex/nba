"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, Badge, Button } from "@nba/design-system"
import { ArrowLeft, Check, Loader2, AlertCircle, Calendar, Tag } from "lucide-react"

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

export default function SelectPlanPage() {
  const router = useRouter()
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [confirmStep, setConfirmStep] = useState<"select" | "confirm" | "sending" | "done">("select")
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/public/plans")
      .then((r) => r.json())
      .then((data) => setPlans(data.filter((p: Plan) => p.isActive)))
      .catch(() => setError("Erreur de chargement des plans"))
      .finally(() => setLoading(false))
  }, [])

  async function handleConfirm() {
    if (!selectedPlan) return
    setConfirmStep("sending")
    setSubmitError(null)

    try {
      const res = await fetch("/api/public/select-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ planId: selectedPlan.id }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setSubmitError(data.message ?? "Erreur lors de la sélection")
        setConfirmStep("confirm")
        return
      }

      setConfirmStep("done")
      // Redirection après un court délai pour afficher le succès
      setTimeout(() => router.push("/dashboard/subscription"), 2000)
    } catch (e) {
      setSubmitError("Erreur de connexion. Veuillez réessayer.")
      setConfirmStep("confirm")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto py-8">
        <Link href="/dashboard/subscription" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Retour
        </Link>
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

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header avec retour */}
      <div className="space-y-1">
        <Link
          href="/dashboard/subscription"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" /> Retour à l&apos;abonnement
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">
          {confirmStep === "select" && "Choisir un abonnement"}
          {confirmStep === "confirm" && "Confirmer votre choix"}
          {confirmStep === "sending" && "Envoi en cours..."}
          {confirmStep === "done" && "Demande envoyée ✓"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {confirmStep === "select" && "Sélectionnez l'offre qui correspond à votre profil"}
          {confirmStep === "confirm" && "Vérifiez les informations avant de soumettre à notre équipe"}
          {confirmStep === "sending" && "Votre demande est en cours de traitement..."}
          {confirmStep === "done" && "Votre demande a été envoyée. Vous allez être redirigé."}
        </p>
      </div>

      {/* Étape 1 : Sélection */}
      {confirmStep === "select" && (
        <div className="grid gap-4 sm:grid-cols-2">
          {plans.map((plan) => (
            <button
              key={plan.id}
              type="button"
              onClick={() => {
                setSelectedPlan(plan)
                setConfirmStep("confirm")
              }}
              className="text-left rounded-xl border-2 border-border bg-card p-5 transition-all hover:border-primary/50 hover:shadow-md focus:outline-none focus:border-primary"
            >
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground text-lg">{plan.name}</h3>
                {plan.description && (
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                )}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="size-3.5" />
                  <span>{plan.durationDays} jours d&apos;accès</span>
                </div>
                {plan.features && plan.features.length > 0 && (
                  <ul className="space-y-1 pt-2 border-t border-border/50">
                    {plan.features.slice(0, 3).map((f, i) => (
                      <li key={i} className="flex items-center gap-1.5 text-sm text-foreground">
                        <Check className="size-3 text-primary shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Étape 2 : Confirmation */}
      {confirmStep === "confirm" && selectedPlan && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2 text-foreground">
              <Tag className="size-4 text-primary" />
              <h3 className="font-semibold">Récapitulatif de votre demande</h3>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="space-y-0.5">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Plan choisi</p>
                  <p className="font-semibold text-foreground">{selectedPlan.name}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Durée d&apos;accès</p>
                  <p className="font-semibold text-foreground">{selectedPlan.durationDays} jours</p>
                </div>
                <div className="space-y-0.5 col-span-2">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Statut</p>
                  <Badge variant="outline" className="text-amber-600 border-amber-500/30 bg-amber-500/10 w-fit">
                    En attente d&apos;approbation par notre équipe
                  </Badge>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-sm text-foreground space-y-1">
              <p className="font-semibold text-amber-600">⚠ Avant de confirmer :</p>
              <ul className="list-disc pl-5 space-y-0.5 text-muted-foreground">
                <li>Votre demande sera envoyée à notre équipe pour vérification</li>
                <li>L&apos;accès au contenu sera activé après approbation</li>
                <li>Vous serez notifié dès que votre demande sera traitée</li>
              </ul>
            </div>

            {submitError && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive flex items-center gap-2">
                <AlertCircle className="size-4" />
                {submitError}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setSelectedPlan(null)
                  setConfirmStep("select")
                  setSubmitError(null)
                }}
              >
                Modifier mon choix
              </Button>
              <Button className="flex-1" onClick={handleConfirm}>
                <Check className="size-4 mr-1.5" />
                Confirmer et envoyer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Étape 3 : Envoi en cours */}
      {confirmStep === "sending" && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Envoi de votre demande...</p>
          </CardContent>
        </Card>
      )}

      {/* Étape 4 : Succès */}
      {confirmStep === "done" && (
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
              <Check className="size-8" />
            </div>
            <div>
              <p className="font-semibold text-emerald-600 text-lg">Demande envoyée avec succès</p>
              <p className="text-sm text-muted-foreground mt-1">
                Notre équipe va vérifier et approuver votre demande
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
