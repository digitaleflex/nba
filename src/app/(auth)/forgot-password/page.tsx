"use client"

import { useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { authClient } from "@nba/lib/auth-client"
import { Button, Input, Card, CardContent } from "@nba/design-system"
import { TrendingUp, Mail, ArrowLeft, CheckCircle } from "lucide-react"
import { isValidEmail } from "../register/components/form-utils"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (!isValidEmail(email)) {
      setError("Veuillez saisir une adresse email valide.")
      return
    }
    setLoading(true)

    const { error: err } = await authClient.requestPasswordReset({
      email,
      redirectTo: "/reset-password",
    })

    if (err) {
      const message = err.message ?? err.statusText
      setError(message)
      toast.error(message)
      setLoading(false)
      return
    }

    setSent(true)
    toast.success("Lien de réinitialisation envoyé.")
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--color-primary)_0%,_transparent_50%)] opacity-[0.03] pointer-events-none" />
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center space-y-3">
            <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-success/10 ring-1 ring-success/20">
              <CheckCircle className="size-7 text-success" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Email envoyé</h1>
            <p className="text-sm text-muted-foreground">
              Si un compte existe avec cette adresse, vous recevrez un lien de réinitialisation.
            </p>
          </div>
          <Card size="sm" className="relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Vérifiez votre boîte de réception et suivez les instructions.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                <ArrowLeft className="size-4" />
                Retour à la connexion
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--color-primary)_0%,_transparent_50%)] opacity-[0.03] pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--color-ring)_0%,_transparent_50%)] opacity-[0.02] pointer-events-none" />

      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20 animate-float">
            <TrendingUp className="size-7 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            Mot de passe oublié
          </h1>
          <p className="text-sm text-muted-foreground">
            Entrez votre email pour recevoir un lien de réinitialisation
          </p>
        </div>

        <Card size="sm" className="relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="exemple@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              {error && (
                <p role="alert" className="text-sm text-destructive flex items-center gap-1.5 bg-destructive/10 rounded-lg px-3 py-2">
                  <span className="size-1.5 rounded-full bg-destructive shrink-0" />
                  {error}
                </p>
              )}
              <Button type="submit" className="w-full h-9" disabled={loading}>
                {loading ? "Envoi…" : "Envoyer le lien"}
              </Button>
            </CardContent>
          </form>
        </Card>

        <p className="text-sm text-muted-foreground text-center">
          <Link
            href="/login"
            className="font-medium text-primary hover:text-primary/80 transition-colors"
          >
            <ArrowLeft className="size-3.5 inline mr-1" />
            Retour à la connexion
          </Link>
        </p>
      </div>
    </div>
  )
}
