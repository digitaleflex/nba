"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, Button } from "@nba/design-system"
import { Check, Mail, Shield, Loader2, AlertCircle } from "lucide-react"

import { StepEmail } from "./components/step-email"

interface OnboardingState {
  status: string
  checklist: Record<string, boolean>
  progress: number
  nextStep: string | null
}

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

  const emailVerified = state.checklist.emailVerified

  useEffect(() => {
    if (emailVerified) {
      const t = setTimeout(() => router.push("/dashboard"), 1200)
      return () => clearTimeout(t)
    }
  }, [emailVerified, router])

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">
          Bienvenue <span className="text-primary">👋</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          Vérifiez votre email pour activer votre compte.
        </p>
      </div>

      <div className="pt-4">
        {!emailVerified ? (
          <StepEmail onNext={fetchState} />
        ) : (
          <div className="flex flex-col items-center justify-center py-10 space-y-4 animate-in zoom-in-95 duration-500">
            <div className="flex size-16 items-center justify-center rounded-full bg-success/10 text-success">
              <Shield className="size-8" />
            </div>
            <h2 className="text-xl font-bold">Email vérifié !</h2>
            <p className="text-muted-foreground text-center">
              Redirection vers le tableau de bord...
            </p>
            <Loader2 className="size-6 animate-spin text-muted-foreground mt-4" />
          </div>
        )}
      </div>
    </div>
  )
}
