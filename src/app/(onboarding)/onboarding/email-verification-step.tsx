"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, Button } from "@nba/design-system"
import { Mail, Shield, Loader2, AlertCircle } from "lucide-react"
import { StepEmail } from "./components/step-email"

export function EmailVerificationStep({
  emailVerified: initiallyVerified,
}: {
  emailVerified: boolean
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [state, setState] = useState<{ status: string; checklist: Record<string, boolean>; progress: number; nextStep: string | null } | null>(
    initiallyVerified
      ? { status: "", checklist: { emailVerified: true, kycSubmitted: false, brokerSubmitted: false, reviewed: false }, progress: 20, nextStep: null }
      : null,
  )

  const fetchState = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/onboarding/state")
      const data = await res.json()
      if (!data || typeof data !== "object") {
        setError("Réponse inattendue du serveur")
        return
      }
      setState(data as typeof state)
    } catch {
      setError("Erreur de chargement de votre progression")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!initiallyVerified) fetchState()
  }, [])

  const emailVerified = state?.checklist?.emailVerified ?? initiallyVerified

  useEffect(() => {
    if (emailVerified) {
      const t = setTimeout(() => router.push("/dashboard"), 1200)
      return () => clearTimeout(t)
    }
  }, [emailVerified, router])

  if (loading && !state && !initiallyVerified) {
    return (
      <div className="flex h-[30vh] items-center justify-center" role="status" aria-label="Chargement en cours">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-8">
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

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">
          Bienvenue
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
