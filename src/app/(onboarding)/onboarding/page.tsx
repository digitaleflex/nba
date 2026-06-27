"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@nba/design-system"
import { Check, ArrowRight, Mail, User, FileText, Video, Shield } from "lucide-react"

interface OnboardingState {
  status: string
  checklist: Record<string, boolean>
  progress: number
  nextStep: string | null
}

const STEPS = [
  { key: "emailVerified", label: "Vérifier votre email", icon: Mail, href: null },
  { key: "profileCompleted", label: "Compléter votre profil", icon: User, href: "/onboarding/profile" },
  { key: "kycSubmitted", label: "Vérification d'identité (KYC)", icon: FileText, href: "/onboarding/kyc" },
  { key: "brokerSubmitted", label: "Vérification Broker", icon: Video, href: "/onboarding/broker" },
  { key: "reviewed", label: "Validation par notre équipe", icon: Shield, href: null },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [state, setState] = useState<OnboardingState | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/onboarding/state")
      .then((r) => r.json())
      .then(setState)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!state) return null

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">
          Bienvenue <span className="text-primary">👋</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          Votre compte est presque prêt. Complétez les étapes ci-dessous.
        </p>
      </div>

      <Card className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <CardContent className="pt-6">
          <div className="mb-6 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Progression</span>
              <span className="text-muted-foreground">{state.progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
                style={{ width: `${state.progress}%` }}
              />
            </div>
          </div>

          <div className="space-y-2">
            {STEPS.map((step, i) => {
              const done = state.checklist[step.key]
              const isNext = !done && step.href

              return (
                <div
                  key={step.key}
                  className={`flex items-center gap-3 rounded-lg p-3 transition-colors ${
                    isNext
                      ? "bg-primary/5 ring-1 ring-primary/20"
                      : done
                        ? "bg-success/5"
                        : "bg-muted/30"
                  }`}
                >
                  <div
                    className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
                      done ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {done ? <Check className="size-4" /> : <step.icon className="size-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-medium ${done ? "text-success" : "text-foreground"}`}>
                      {step.label}
                    </p>
                  </div>
                  {isNext ? (
                    <Link
                      href={step.href}
                      className="flex shrink-0 items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/80 transition-colors"
                    >
                      Continuer
                      <ArrowRight className="size-3" />
                    </Link>
                  ) : done ? (
                    <span className="text-xs text-success">Complété</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">En attente</span>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {state.status === "ACTIVE" && (
        <div className="text-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80 transition-colors"
          >
            Accéder aux signaux
            <ArrowRight className="size-4" />
          </Link>
        </div>
      )}
    </div>
  )
}
