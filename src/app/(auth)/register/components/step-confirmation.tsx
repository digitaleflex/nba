"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@nba/design-system"
import { Check, RefreshCw } from "lucide-react"

interface Plan {
  id: string
  name: string
  description: string | null
  sortOrder: number
}

interface StepConfirmationProps {
  plans: Plan[]
  selectedPlan: string | null
  firstName: string
  lastName: string
  email: string
  whatsapp: string
  error: string
  setError: (err: string) => void
  loading: boolean
  setLoading: (load: boolean) => void
  onSubmit: (e: React.FormEvent) => void
  onPrev: () => void
}

export function StepConfirmation({
  plans,
  selectedPlan,
  firstName,
  lastName,
  email,
  whatsapp,
  error,
  setError,
  loading,
  setLoading,
  onSubmit,
  onPrev,
}: StepConfirmationProps) {
  const currentPlan = plans.find((p) => p.id === selectedPlan)
  const [captchaQuestion, setCaptchaQuestion] = useState("")
  const [captchaToken, setCaptchaToken] = useState("")
  const [captchaAnswer, setCaptchaAnswer] = useState("")

  const fetchCaptcha = async () => {
    try {
      const res = await fetch("/api/auth/captcha")
      if (res.ok) {
        const { question, token } = await res.json()
        setCaptchaQuestion(question)
        setCaptchaToken(token)
        setCaptchaAnswer("")
      }
    } catch {}
  }

  useEffect(() => { fetchCaptcha() }, [])

  const handleSubmitWithCaptcha = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!captchaAnswer.trim()) {
      setError("Veuillez resoudre le captcha")
      return
    }
    try {
      const verify = await fetch("/api/auth/captcha/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: captchaToken, answer: parseInt(captchaAnswer, 10) }),
      })
      const result = await verify.json()
      if (!result.valid) {
        setError("Captcha incorrect. Veuillez reessayer.")
        fetchCaptcha()
        return
      }
    } catch {
      setError("Erreur de verification captcha")
      return
    }
    onSubmit(e)
  }

  return (
    <form onSubmit={handleSubmitWithCaptcha}>
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground text-center">
          Verifiez vos informations avant de finaliser
        </p>
        <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3 text-sm">
          <div className="flex items-center gap-2">
            <Check className="size-4 text-primary shrink-0" />
            <span className="text-muted-foreground">Service :</span>
            <span className="font-medium text-foreground">{currentPlan?.name ?? "—"}</span>
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
          <div role="alert" className={`text-sm flex flex-col gap-2 rounded-lg px-3 py-2 ${
            error.includes("déjà") || error.includes("existe")
              ? "text-muted-foreground bg-muted/50"
              : "text-destructive bg-destructive/10"
          }`}>
            <div className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full shrink-0 bg-muted-foreground" />
              {error}
            </div>
            {(error.includes("déjà") || error.includes("existe")) && (
              <div className="flex flex-col gap-1.5 pt-1">
                <Link href="/login" className="text-xs text-primary hover:text-primary/80 underline underline-offset-2">Se connecter</Link>
                <Link href="/forgot-password" className="text-xs text-primary hover:text-primary/80 underline underline-offset-2">Mot de passe oublie ?</Link>
              </div>
            )}
          </div>
        )}

        {/* CAPTCHA */}
        {captchaQuestion && (
          <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Verification anti-bot</p>
              <button type="button" onClick={fetchCaptcha} className="text-muted-foreground hover:text-foreground cursor-pointer">
                <RefreshCw className="size-3.5" />
              </button>
            </div>
            <p className="text-sm font-medium text-foreground">{captchaQuestion}</p>
            <input
              type="number"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
              placeholder="Votre reponse"
              value={captchaAnswer}
              onChange={(e) => setCaptchaAnswer(e.target.value)}
              autoComplete="off"
            />
          </div>
        )}

        <Button type="submit" className="w-full h-9" loading={loading}>
          {loading ? "Inscription en cours…" : "Creer mon compte"}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          En creant votre compte, vous acceptez nos{" "}
          <Link href="/cgu" className="text-primary hover:text-primary/80">Conditions Generales</Link>{" "}
          et notre{" "}
          <Link href="/privacy" className="text-primary hover:text-primary/80">Politique de confidentialite</Link>.
        </p>
      </div>
      <div className="mt-6">
        <Button type="button" variant="outline" onClick={onPrev} className="w-full">
          Modifier les informations
        </Button>
      </div>
    </form>
  )
}
