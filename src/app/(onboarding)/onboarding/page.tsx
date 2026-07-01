"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, Button } from "@nba/design-system"
import { Check, Mail, User, FileText, Video, Shield, Loader2, AlertCircle } from "lucide-react"

import { StepEmail } from "./components/step-email"
import { StepKyc } from "./components/step-kyc"
import { StepBroker } from "./components/step-broker"

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

const STEPS = [
  { key: "emailVerified", label: "Vérifier votre email", icon: Mail },
  { key: "kycSubmitted", label: "Vérification d'identité", icon: FileText },
  { key: "brokerSubmitted", label: "Connexion Broker", icon: Video },
]

export default function OnboardingWizardPage() {
  const router = useRouter()
  const [state, setState] = useState<OnboardingState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchState = () => {
    setLoading(true)
    setError(null)
    fetch("/api/onboarding/state")
      .then((r) => r.json())
      .then((data) => {
        if (data.status === "ACTIVE" || data.status === "COMPLETED") {
          router.push("/dashboard")
        } else {
          setState(data)
          setLoading(false)
        }
      })
      .catch(() => {
        setLoading(false)
        setError("Erreur de chargement de votre progression")
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
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Bienvenue</h1>
        </div>
        <Card className="border-destructive/30">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <AlertCircle className="size-10 text-destructive" />
            <p role="alert" className="font-semibold text-destructive">Erreur de chargement</p>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchState}>Réessayer</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Déterminer l'étape active basée sur la checklist
  let activeStepIndex = 0
  if (state.checklist.emailVerified) activeStepIndex = 1
  if (state.checklist.emailVerified && state.checklist.kycSubmitted) activeStepIndex = 2
  if (state.checklist.emailVerified && state.checklist.kycSubmitted && state.checklist.brokerSubmitted) activeStepIndex = 3

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">
          Bienvenue <span className="text-primary">👋</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          Votre compte est presque prêt. Complétez les étapes ci-dessous.
        </p>
      </div>

      {/* Stepper visuel */}
      <Card className="relative overflow-hidden border-none shadow-none bg-transparent">
        <CardContent className="p-0">
          <div className="mb-8 flex justify-between relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-muted rounded-full" />
            <div 
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary rounded-full transition-all duration-500" 
              style={{ width: `${(activeStepIndex / (STEPS.length - 1)) * 100}%` }}
            />
            
            {STEPS.map((step, index) => {
              const isCompleted = index < activeStepIndex
              const isActive = index === activeStepIndex
              
              return (
                <div key={step.key} className="relative z-10 flex flex-col items-center gap-2">
                  <div 
                    className={`flex size-8 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                      isCompleted 
                        ? "bg-primary border-primary text-primary-foreground" 
                        : isActive 
                          ? "bg-background border-primary text-primary shadow-[0_0_15px_rgba(var(--primary),0.3)]"
                          : "bg-background border-muted text-muted-foreground"
                    }`}
                  >
                    {isCompleted ? <Check className="size-4" /> : <step.icon className="size-4" />}
                  </div>
                  <span className={`text-[10px] sm:text-xs font-medium absolute -bottom-6 whitespace-nowrap transition-colors duration-300 ${
                    isActive ? "text-foreground" : "text-muted-foreground"
                  }`}>
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Alertes de rejet de documents */}
      {activeStepIndex === 1 && state.kycStatus === "REJECTED" && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive flex flex-col gap-1.5 animate-in slide-in-from-top-2 duration-300">
          <span className="font-bold flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-destructive shrink-0 animate-pulse" />
            Votre document d'identité a été refusé par l'administrateur
          </span>
          {state.kycFeedback && (
            <p className="text-muted-foreground pl-3.5 text-xs italic">
              Raison : &ldquo;{state.kycFeedback}&rdquo;
            </p>
          )}
          <p className="text-xs pl-3.5 text-muted-foreground mt-0.5">
            Veuillez soumettre à nouveau une photo parfaitement nette et lisible.
          </p>
        </div>
      )}

      {activeStepIndex === 2 && state.brokerStatus === "REJECTED" && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive flex flex-col gap-1.5 animate-in slide-in-from-top-2 duration-300">
          <span className="font-bold flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-destructive shrink-0 animate-pulse" />
            Votre vérification de compte Broker a été refusée
          </span>
          {state.brokerFeedback && (
            <p className="text-muted-foreground pl-3.5 text-xs italic">
              Raison : &ldquo;{state.brokerFeedback}&rdquo;
            </p>
          )}
          <p className="text-xs pl-3.5 text-muted-foreground mt-0.5">
            Veuillez soumettre à nouveau votre preuve de connexion (numéro de compte ou vidéo).
          </p>
        </div>
      )}

      <div className="pt-4">
        {activeStepIndex === 0 && <StepEmail onNext={fetchState} />}
        {activeStepIndex === 1 && <StepKyc onNext={fetchState} />}
        {activeStepIndex === 2 && <StepBroker onNext={fetchState} />}
        {activeStepIndex >= 3 && (
          <div className="flex flex-col items-center justify-center py-10 space-y-4 animate-in zoom-in-95 duration-500">
            <div className="flex size-16 items-center justify-center rounded-full bg-success/10 text-success">
              <Shield className="size-8" />
            </div>
            <h2 className="text-xl font-bold">Profil en cours de vérification</h2>
            <p className="text-muted-foreground text-center">
              Notre équipe valide actuellement vos informations. Vous allez être redirigé...
            </p>
            <Loader2 className="size-6 animate-spin text-muted-foreground mt-4" />
          </div>
        )}
      </div>
    </div>
  )
}
