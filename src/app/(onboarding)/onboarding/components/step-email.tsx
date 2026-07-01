"use client"

import { useState } from "react"
import { Button, Card, CardContent } from "@nba/design-system"
import { Mail, CheckCircle2, Loader2, ArrowRight } from "lucide-react"

interface StepEmailProps {
  onNext: () => void
}

export function StepEmail({ onNext }: StepEmailProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [sent, setSent] = useState(false)
  const [verified, setVerified] = useState(false)
  const [code, setCode] = useState("")

  async function handleSendEmail() {
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/onboarding/send-otp", { method: "POST" })
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error || "Erreur lors de l'envoi de l'email")
      
      setSent(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOTP() {
    if (code.length !== 6) {
      setError("Le code doit contenir 6 chiffres")
      return
    }

    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/onboarding/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code })
      })
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error || "Code invalide")
      
      setVerified(true)
      setTimeout(() => onNext(), 1500)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (verified) {
    return (
      <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500 text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-success/10 text-success">
          <CheckCircle2 className="size-8" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Email vérifié avec succès !</h2>
          <p className="text-muted-foreground mt-2">Passage à l'étape suivante...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
          <Mail className="size-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Vérification de l'email</h2>
          <p className="text-sm text-muted-foreground">Sécurisez votre compte en validant votre adresse</p>
        </div>
      </div>

      <Card size="sm" className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <CardContent className="space-y-4 pt-6 text-center">
          
          {!sent ? (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                Nous allons vous envoyer un code de vérification à 6 chiffres par email.
              </p>
              <Button onClick={handleSendEmail} className="w-full h-9" disabled={loading}>
                {loading ? (
                  <Loader2 className="size-4 animate-spin mr-2" />
                ) : (
                  <Mail className="size-4 mr-2" />
                )}
                {loading ? "Envoi en cours..." : "Recevoir le code"}
              </Button>
              {error && <p className="text-sm text-destructive mt-2">{error}</p>}
            </>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg bg-primary/5 p-4 text-sm border border-primary/20">
                Code envoyé ! Veuillez vérifier votre boîte de réception (et vos spams).
              </div>
              
              <div className="space-y-2">
                <input 
                  type="text" 
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  aria-label="Code de vérification à 6 chiffres"
                  className="flex h-12 w-full rounded-md border border-input bg-transparent px-3 py-1 text-center text-2xl tracking-widest shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <Button onClick={handleVerifyOTP} className="w-full h-9" disabled={loading || code.length !== 6}>
                {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                Valider le code
                {!loading && <ArrowRight className="size-4 ml-2" />}
              </Button>

              <button 
                onClick={handleSendEmail} 
                disabled={loading}
                className="text-xs text-muted-foreground hover:text-primary transition-colors mt-2"
              >
                Renvoyer le code
              </button>

              {error && <p className="text-sm text-destructive mt-2">{error}</p>}
            </div>
          )}
          
        </CardContent>
      </Card>
    </div>
  )
}
