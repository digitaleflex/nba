"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { authClient } from "@nba/lib/auth-client"
import { Button, Input, Card, CardContent, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@nba/design-system"
import { TrendingUp, Eye, EyeOff, Check, ArrowLeft, ArrowRight, AlertCircle } from "lucide-react"

interface Plan {
  id: string
  name: string
  description: string | null
  sortOrder: number
}

const STEPS = ["Service", "Identité", "Contact", "Sécurité", "Confirmation"]

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  if (score <= 1) return { score, label: "Faible", color: "bg-destructive" }
  if (score <= 2) return { score, label: "Moyen", color: "bg-warning" }
  if (score <= 3) return { score, label: "Bon", color: "bg-primary" }
  return { score, label: "Très bon", color: "bg-success" }
}

const RULES = [
  { test: (p: string) => p.length >= 8, label: "Au moins 8 caractères" },
  { test: (p: string) => /[A-Z]/.test(p), label: "Une lettre majuscule" },
  { test: (p: string) => /[a-z]/.test(p), label: "Une lettre minuscule" },
  { test: (p: string) => /[0-9]/.test(p), label: "Un chiffre" },
  { test: (p: string) => /[^A-Za-z0-9]/.test(p), label: "Un caractère spécial" },
]

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
  const [password, setPassword] = useSessionState("password", "")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [touched, setTouched] = useState(false)

  const strength = useMemo(() => getPasswordStrength(password), [password])

  useEffect(() => {
    fetch("/api/public/plans")
      .then((r) => r.json())
      .then(setPlans)
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
      let message = err.message ?? err.statusText
      if (err.status === 422 || message.toLowerCase().includes("already exists") || message.toLowerCase().includes("email taken")) {
        setError("Ce compte existe déjà. Veuillez vous connecter.")
      } else if (err.status === 400) {
        setError("Données invalides. Veuillez vérifier vos informations.")
      } else {
        setError("Une erreur est survenue lors de l'inscription. Veuillez réessayer.")
      }
      setLoading(false)
      return
    }

    await fetch("/api/public/select-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId: selectedPlan }),
    })

    // Clear persisted form data after successful registration
    const keys = Object.keys(sessionStorage)
    for (const key of keys) {
      if (key.startsWith(STORAGE_KEY)) sessionStorage.removeItem(key)
    }

    router.push("/onboarding")
    router.refresh()
  }

  function canGoNext(): boolean {
    if (step === 0) return !!selectedPlan
    if (step === 1) return !!firstName && !!lastName
    if (step === 2) return !!email && !!whatsapp
    if (step === 3) return password.length >= 8
    return true
  }

  function nextStep() {
    if (step === 0 && selectedPlan) setStep(1)
    else if (step === 1 && firstName && lastName) setStep(2)
    else if (step === 2 && email && whatsapp) setStep(3)
    else if (step === 3 && password.length >= 8) setStep(4)
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
                className={`hidden sm:inline text-xs sm:text-sm ${i === step ? "font-medium text-foreground" : "text-muted-foreground"}`}
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
            {/* Step 0 — Service */}
            {step === 0 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground text-center">
                  Choisissez le service auquel vous souhaitez accéder
                </p>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Service</label>
                  <Select value={selectedPlan ?? ""} onValueChange={setSelectedPlan}>
                    <SelectTrigger className="w-full h-10 bg-background">
                      <SelectValue placeholder="Sélectionnez un service" />
                    </SelectTrigger>
                    <SelectContent>
                      {plans.sort((a, b) => a.sortOrder - b.sortOrder).map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>{plan.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedPlan && (
                    <div className="flex items-center gap-2 rounded-lg bg-primary/5 px-3 py-2.5 text-sm ring-1 ring-primary/10">
                      <div className="flex size-7 items-center justify-center rounded-md bg-primary/10">
                        <TrendingUp className="size-3.5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">Service sélectionné</p>
                        <p className="font-medium text-foreground">
                          {plans.find((p) => p.id === selectedPlan)?.name}
                        </p>
                      </div>
                      <Check className="size-4 text-primary" />
                    </div>
                  )}
                </div>
                <Button type="button" className="w-full h-9" disabled={!canGoNext()} onClick={nextStep}>
                  Continuer <ArrowRight className="size-4" />
                </Button>
              </div>
            )}

            {/* Step 1 — Identité */}
            {step === 1 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground text-center">Commençons par votre identité</p>
                <div className="space-y-1.5">
                  <label htmlFor="firstName" className="text-sm font-medium text-foreground">Prénom</label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="Kofi"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    autoComplete="given-name"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="lastName" className="text-sm font-medium text-foreground">Nom</label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Mensah"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    autoComplete="family-name"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setStep(0)} className="flex-1">
                    <ArrowLeft className="size-4" /> Retour
                  </Button>
                  <Button type="button" className="flex-1" disabled={!canGoNext()} onClick={nextStep}>
                    Suivant <ArrowRight className="size-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2 — Contact */}
            {step === 2 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground text-center">Vos coordonnées</p>
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-sm font-medium text-foreground">Email</label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="a.mensah@exemple.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="whatsapp" className="text-sm font-medium text-foreground">WhatsApp</label>
                  <Input
                    id="whatsapp"
                    type="tel"
                    placeholder="+229 01 02 03 05 06"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    required
                    autoComplete="tel"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
                    <ArrowLeft className="size-4" /> Retour
                  </Button>
                  <Button type="button" className="flex-1" disabled={!canGoNext()} onClick={nextStep}>
                    Suivant <ArrowRight className="size-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3 — Sécurité */}
            {step === 3 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground text-center">Créez un mot de passe sécurisé</p>
                <div className="space-y-1.5">
                  <label htmlFor="password" className="text-sm font-medium text-foreground">Mot de passe</label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Min. 8 caractères"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setTouched(true) }}
                      required
                      autoComplete="new-password"
                      minLength={8}
                      className="pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                {touched && (
                  <>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Solidité</span>
                        <span className="font-medium" style={{ color: strength.color.replace("bg-", "var(--color-") }}>
                          {strength.label}
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                          style={{ width: `${(strength.score / 5) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      {RULES.map((rule) => {
                        const valid = rule.test(password)
                        return (
                          <div key={rule.label} className="flex items-center gap-2 text-sm">
                            {valid ? (
                              <Check className="size-3.5 text-success shrink-0" />
                            ) : (
                              <div className="size-3.5 shrink-0 flex items-center justify-center">
                                <AlertCircle className="size-3 text-muted-foreground" />
                              </div>
                            )}
                            <span className={valid ? "text-success" : "text-muted-foreground"}>
                              {rule.label}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </>
                )}

                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setStep(2)} className="flex-1">
                    <ArrowLeft className="size-4" /> Retour
                  </Button>
                  <Button type="button" className="flex-1" disabled={!canGoNext()} onClick={nextStep}>
                    Suivant <ArrowRight className="size-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4 — Confirmation */}
            {step === 4 && (
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground text-center">
                    Vérifiez vos informations avant de finaliser
                  </p>
                  <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Check className="size-4 text-primary shrink-0" />
                      <span className="text-muted-foreground">Service :</span>
                      <span className="font-medium text-foreground">
                        {plans.find((p) => p.id === selectedPlan)?.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="size-4 text-primary shrink-0" />
                      <span className="text-muted-foreground">Nom :</span>
                      <span className="font-medium text-foreground">{firstName} {lastName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="size-4 text-primary shrink-0" />
                      <span className="text-muted-foreground">Email :</span>
                      <span className="font-medium text-foreground">{email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="size-4 text-primary shrink-0" />
                      <span className="text-muted-foreground">WhatsApp :</span>
                      <span className="font-medium text-foreground">{whatsapp}</span>
                    </div>
                  </div>

                  {error && (
                    <div className={`text-sm flex flex-col gap-2 rounded-lg px-3 py-2 ${error === "Email de vérification renvoyé." ? "text-success bg-success/10" : "text-destructive bg-destructive/10"}`}>
                      <div className="flex items-center gap-1.5">
                        <span className={`size-1.5 rounded-full shrink-0 ${error === "Email de vérification renvoyé." ? "bg-success" : "bg-destructive"}`} />
                        {error}
                      </div>
                      {error.includes("déjà") && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-auto py-1 px-0 justify-start text-xs underline"
                          onClick={async () => {
                            setLoading(true);
                            await authClient.emailVerification.sendVerificationEmail({ email });
                            setLoading(false);
                            setError("Email de vérification renvoyé.");
                          }}
                        >
                          Renvoyer l'email de vérification
                        </Button>
                      )}
                    </div>
                  )}

                  <Button type="submit" className="w-full h-9" disabled={loading}>
                    {loading ? "Inscription en cours…" : "Créer mon compte"}
                  </Button>

                  <p className="text-center text-xs text-muted-foreground">
                    En créant votre compte, vous acceptez nos{" "}
                    <Link href="/cgu" className="text-primary hover:text-primary/80">Conditions Générales</Link>{" "}
                    et notre{" "}
                    <Link href="/privacy" className="text-primary hover:text-primary/80">Politique de confidentialité</Link>
                  </p>
                </div>
                <div className="mt-6">
                  <Button type="button" variant="outline" onClick={() => setStep(3)} className="w-full">
                    <ArrowLeft className="size-4" /> Modifier les informations
                  </Button>
                </div>
              </form>
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
