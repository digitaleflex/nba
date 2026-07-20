"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, Button, Badge } from "@nba/design-system"
import { Shield, FileText, CheckCircle2, AlertTriangle, Clock, Link2, Loader2, ArrowRight, AlertCircle } from "lucide-react"
import { StepKyc } from "../../../(onboarding)/onboarding/components/step-kyc"
import { StepBroker } from "../../../(onboarding)/onboarding/components/step-broker"

interface OnboardingState {
  status: string
  checklist: Record<string, boolean>
  progress: number
  nextStep: string | null
  kycStatus?: string | null
  kycFeedback?: string | null
  brokerStatus?: string | null
  brokerFeedback?: string | null
}

export default function VerificationPage() {
  const [state, setState] = useState<OnboardingState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeKycSubmit, setActiveKycSubmit] = useState(false)
  const [activeBrokerSubmit, setActiveBrokerSubmit] = useState(false)

  const fetchState = () => {
    setLoading(true)
    setError(null)
    fetch("/api/onboarding/state")
      .then((r) => { if (!r.ok) throw new Error("Erreur"); return r.json() })
      .then((data) => {
        setState(data ?? {})
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
        setError("Erreur de chargement de l'état de vérification")
      })
  }

  useEffect(() => {
    fetchState()
  }, [])

  if (loading || !state) {
    return (
      <div className="flex h-[50vh] items-center justify-center" role="status" aria-label="Chargement en cours">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-8 max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Shield className="size-6 text-primary" />
            Centre de vérification
          </h1>
        </div>
        <Card className="border-destructive/30">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <AlertCircle className="size-10 text-destructive" />
            <p role="alert" className="font-semibold text-destructive">Erreur de chargement</p>
            <p role="alert" className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchState}>Réessayer</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isKycApproved = state.kycStatus === "APPROVED"
  const isKycPending = state.kycStatus === "PENDING"
  const isKycRejected = state.kycStatus === "REJECTED"
  const hasKyc = !!state.kycStatus

  const isBrokerApproved = state.brokerStatus === "APPROVED"
  const isBrokerPending = state.brokerStatus === "PENDING"
  const isBrokerRejected = state.brokerStatus === "REJECTED"
  const hasBroker = !!state.brokerStatus

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Shield className="size-6 text-primary" />
          Centre de vérification
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gérez et suivez le statut de validation de votre compte NeverBrokeAgain.
        </p>
      </div>

      {/* Global Status Overview */}
      <Card className="relative overflow-hidden bg-card/40 border border-border/50">
        <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Statut global du compte</span>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold">
                {state.status === "ACTIVE" ? "Compte Entièrement Validé" : "Vérification Recommandée"}
              </h2>
              <Badge
                variant="outline"
                className={
                  state.status === "ACTIVE"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                }
              >
                {state.status === "ACTIVE" ? "ACTIF" : "VÉRIFICATION REQUISE"}
              </Badge>
            </div>
          </div>
          <div className="w-full sm:w-48 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-muted-foreground">Progression</span>
              <span className="text-foreground">{state.progress}%</span>
            </div>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-500 ease-out" 
                style={{ width: `${state.progress}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Card 1: KYC Identity */}
        <Card className="border border-border/50 bg-card/30 overflow-hidden relative">
          <CardContent className="p-5 sm:p-6 space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <FileText className="size-5 text-primary shrink-0" />
                  <h3 className="font-bold text-foreground">1. Pièce d'identité (KYC)</h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  Carte nationale, passeport ou permis de conduire.
                </p>
              </div>

              {/* Status Badge */}
              <Badge
                className={
                  isKycApproved
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : isKycPending
                      ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      : isKycRejected
                        ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                        : "bg-muted text-muted-foreground border-border"
                }
              >
                {isKycApproved ? "Validé" : isKycPending ? "En attente" : isKycRejected ? "Refusé" : "Non soumis"}
              </Badge>
            </div>

            {/* Rejection Feedback */}
            {isKycRejected && (
              <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3 text-xs text-rose-400 space-y-1 animate-in fade-in duration-200">
                <p className="font-bold">❌ Motif du refus :</p>
                <p className="italic">&ldquo;{state.kycFeedback}&rdquo;</p>
              </div>
            )}

            {/* Visual indicator of success or submission form trigger */}
            {isKycApproved ? (
              <div className="flex items-center gap-2 text-xs text-emerald-500 font-medium bg-emerald-500/5 p-3 rounded-lg border border-emerald-500/10 animate-in fade-in duration-200">
                <CheckCircle2 className="size-4 shrink-0" />
                <span>Vos documents d'identité ont été approuvés par nos services.</span>
              </div>
            ) : isKycPending ? (
              <div className="flex items-center gap-2 text-xs text-amber-500 font-medium bg-amber-500/5 p-3 rounded-lg border border-amber-500/10 animate-in fade-in duration-200">
                <Clock className="size-4 shrink-0 animate-pulse" />
                <span>Documents soumis. Validation par l'équipe d'administration en cours.</span>
              </div>
            ) : activeKycSubmit || !hasKyc || isKycRejected ? (
              <div className="pt-2 animate-in fade-in duration-300">
                <StepKyc onNext={() => {
                  setActiveKycSubmit(false)
                  fetchState()
                }} />
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-between"
                onClick={() => setActiveKycSubmit(true)}
              >
                <span>Soumettre mon identité</span>
                <ArrowRight className="size-4" />
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Card 2: Broker Verification */}
        <Card className="border border-border/50 bg-card/30 overflow-hidden relative">
          <CardContent className="p-5 sm:p-6 space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Link2 className="size-5 text-primary shrink-0" />
                  <h3 className="font-bold text-foreground">2. Compte Broker</h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  Lier et valider votre compte de trading broker actif.
                </p>
              </div>

              {/* Status Badge */}
              <Badge
                className={
                  isBrokerApproved
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : isBrokerPending
                      ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      : isBrokerRejected
                        ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                        : "bg-muted text-muted-foreground border-border"
                }
              >
                {isBrokerApproved ? "Validé" : isBrokerPending ? "En attente" : isBrokerRejected ? "Refusé" : "Non soumis"}
              </Badge>
            </div>

            {/* Rejection Feedback */}
            {isBrokerRejected && (
              <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3 text-xs text-rose-400 space-y-1 animate-in fade-in duration-200">
                <p className="font-bold">❌ Motif du refus :</p>
                <p className="italic">&ldquo;{state.brokerFeedback}&rdquo;</p>
              </div>
            )}

            {/* Broker status / submission */}
            {isBrokerApproved ? (
              <div className="flex items-center gap-2 text-xs text-emerald-500 font-medium bg-emerald-500/5 p-3 rounded-lg border border-emerald-500/10 animate-in fade-in duration-200">
                <CheckCircle2 className="size-4 shrink-0" />
                <span>Votre compte Broker a été connecté et validé avec succès.</span>
              </div>
            ) : isBrokerPending ? (
              <div className="flex items-center gap-2 text-xs text-amber-500 font-medium bg-amber-500/5 p-3 rounded-lg border border-amber-500/10 animate-in fade-in duration-200">
                <Clock className="size-4 shrink-0 animate-pulse" />
                <span>Compte soumis. Revue technique en cours par nos équipes.</span>
              </div>
            ) : activeBrokerSubmit || !hasBroker || isBrokerRejected ? (
              <div className="pt-2 animate-in fade-in duration-300">
                <StepBroker onNext={() => {
                  setActiveBrokerSubmit(false)
                  fetchState()
                }} />
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-between"
                onClick={() => setActiveBrokerSubmit(true)}
              >
                <span>Connecter mon Broker</span>
                <ArrowRight className="size-4" />
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
