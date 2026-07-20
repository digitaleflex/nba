"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { authClient } from "@nba/lib/auth-client"
import { toast } from "sonner"
import { Card, CardContent } from "@nba/design-system"
import { TrendingUp, Check } from "lucide-react"

// Importation des sous-composants d'étape
import { StepService } from "./components/step-service"
import { StepIdentity } from "./components/step-identity"
import { StepContact } from "./components/step-contact"
import { StepSecurity } from "./components/step-security"
import { StepConfirmation } from "./components/step-confirmation"
import { safeAuthErrorMessage } from "@nba/lib/auth-error-messages"

interface Plan {
  id: string
  name: string
  description: string | null
  sortOrder: number
}

const STEPS = ["Service", "Identité", "Contact", "Sécurité", "Confirmation"]
const STORAGE_KEY = "nba_register"

function useSessionState<T>(key: string, initial: T): [T, (v: T) => void] {
  const [state, setState] = useState<T>(initial)

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(`${STORAGE_KEY}_${key}`)
      if (stored) {
        setState(JSON.parse(stored))
      }
    } catch {}
  }, [key])

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setState((prev) => {
      const next = typeof value === "function" ? (value as (prev: T) => T)(prev) : value
      try {
        sessionStorage.setItem(`${STORAGE_KEY}_${key}`, JSON.stringify(next))
      } catch {}
      return next
    })
  }, [key])

  return [state, setValue]
}

export default function RegisterPage() {
  const router = useRouter()
  const [plans, setPlans] = useState<Plan[]>([])
  const [step, setStep] = useSessionState("step", 0)
  const [selectedPlan, setSelectedPlan] = useSessionState<string | null>("plan", null)
  const [firstName, setFirstName] = useSessionState("firstName", "")
  const [lastName, setLastName] = useSessionState("lastName", "")
  const [email, setEmail] = useSessionState("email", "")
  const [whatsapp, setWhatsapp] = useSessionState("whatsapp", "")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch("/api/public/plans")
      .then((r) => { if (!r.ok) throw new Error("Erreur"); return r.json() })
      .then((data) => setPlans(Array.isArray(data) ? data : []))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const { error: err } = await authClient.signUp.email({
      name: `${firstName} ${lastName}`.trim(),
      email,
      password,
      callbackURL: "/onboarding",
    })

    if (err) {
      if (err.message && err.message.toLowerCase().includes("banni")) {
        setError(safeAuthErrorMessage(err.message))
      } else if (err.status === 422 || (err.message && (err.message.toLowerCase().includes("already exists") || err.message.toLowerCase().includes("email taken")))) {
        setError("Ce compte existe déjà. Veuillez vous connecter.")
        toast.error("Un compte existe déjà avec cet email.")
        setTimeout(() => router.push("/login"), 1800)
        setLoading(false)
        return
      } else if (err.status === 400) {
        setError("Données invalides. Veuillez vérifier vos informations.")
      } else {
        setError(safeAuthErrorMessage(err.message ?? err.statusText))
      }
      setLoading(false)
      return
    }

    toast.success("Compte créé ! Préparation de votre espace…")

    // Liaison du plan choisi. En cas d'échec (réseau/serveur), on continue
    // vers l'onboarding : l'accès signal est recalculé côté serveur et
    // l'utilisateur pourra compléter depuis son espace. Pas de blocage silencieux.
    try {
      const res = await fetch("/api/public/select-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: selectedPlan }),
      })
      if (!res.ok) {
        toast.warning("Votre service sera à confirmer depuis votre espace.")
      }
    } catch {
      toast.warning("Votre service sera à confirmer depuis votre espace.")
    }

    // Clear persisted form data after successful registration
    const keys = Object.keys(sessionStorage)
    for (const key of keys) {
      if (key.startsWith(STORAGE_KEY)) sessionStorage.removeItem(key)
    }

    router.push("/onboarding")
    router.refresh()
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--color-primary)_0%,_transparent_50%)] opacity-[0.03] pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--color-ring)_0%,_transparent_50%)] opacity-[0.02] pointer-events-none" />

      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-3">
          <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20 animate-float">
            <TrendingUp className="size-7 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="text-primary">Never</span>BrokeAgain
          </h1>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-1 sm:gap-2">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-1 sm:gap-2">
              <div
                className={`flex size-7 sm:size-8 shrink-0 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                  i < step
                    ? "bg-primary text-primary-foreground"
                    : i === step
                      ? "bg-primary/10 text-primary ring-1 ring-primary/30"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {i < step ? <Check className="size-3 sm:size-4" /> : i + 1}
              </div>
              <span
                className={`inline text-[10px] sm:text-xs ${i === step ? "font-medium text-foreground" : "text-muted-foreground"} ${i !== step && "hidden sm:inline"}`}
              >
                {label}
              </span>
              {i < STEPS.length - 1 && (
                <div className={`mx-0.5 sm:mx-1 h-px w-4 sm:w-8 ${i < step ? "bg-primary" : "bg-border"}`} />
              )}
            </div>
          ))}
        </div>

        <Card size="sm" className="relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          <CardContent className="pt-6">
            {step === 0 && (
              <StepService
                plans={plans}
                selectedPlan={selectedPlan}
                onSelectPlan={setSelectedPlan}
                onNext={() => setStep(1)}
              />
            )}

            {step === 1 && (
              <StepIdentity
                firstName={firstName}
                onChangeFirstName={setFirstName}
                lastName={lastName}
                onChangeLastName={setLastName}
                onPrev={() => setStep(0)}
                onNext={() => setStep(2)}
              />
            )}

            {step === 2 && (
              <StepContact
                email={email}
                onChangeEmail={setEmail}
                whatsapp={whatsapp}
                onChangeWhatsapp={setWhatsapp}
                onPrev={() => setStep(1)}
                onNext={() => setStep(3)}
              />
            )}

            {step === 3 && (
              <StepSecurity
                password={password}
                onChangePassword={setPassword}
                confirmPassword={confirmPassword}
                onChangeConfirmPassword={setConfirmPassword}
                onPrev={() => setStep(2)}
                onNext={() => setStep(4)}
              />
            )}

            {step === 4 && (
              <StepConfirmation
                plans={plans}
                selectedPlan={selectedPlan}
                firstName={firstName}
                lastName={lastName}
                email={email}
                whatsapp={whatsapp}
                error={error}
                setError={setError}
                loading={loading}
                setLoading={setLoading}
                onSubmit={handleSubmit}
                onPrev={() => setStep(3)}
              />
            )}
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Déjà un compte ?{" "}
          <Link href="/login" className="font-medium text-primary hover:text-primary/80">Se connecter</Link>
        </p>
      </div>
    </div>
  )
}
