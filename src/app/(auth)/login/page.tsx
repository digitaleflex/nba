"use client"

import { useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Button, Input, Card, CardContent, Tooltip, TooltipTrigger, TooltipContent } from "@nba/design-system"
import { PasswordField } from "@nba/app/components/password-field"
import { TrendingUp, HelpCircle } from "lucide-react"
import { safeAuthErrorMessage, AUTH_MESSAGES } from "@nba/lib/auth-error-messages"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const errors: Record<string, string> = {}
  if (!email.trim()) errors.email = "Veuillez saisir votre email."
  if (!password) errors.password = "Veuillez saisir votre mot de passe."

  function handleBlur(field: string) {
    setTouched((prev) => ({ ...prev, [field]: true }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (errors.email || errors.password) {
      setTouched({ email: true, password: true })
      return
    }

    setLoading(true)

    try {
      // Vérifier si le compte est banni/supprimé avant d'envoyer les identifiants
      const statusRes = await fetch(`/api/auth/check-login?email=${encodeURIComponent(email)}`)
      if (statusRes.ok) {
        const status = await statusRes.json()
        if (status.status !== "ok") {
          const message = status.message ?? "Ce compte ne peut pas se connecter pour le moment."
          const params = new URLSearchParams({ status: status.status })
          if (message) params.set("reason", message)
          if (status.at) params.set("at", status.at)
          window.location.href = `/blocked?${params.toString()}`
          return
        }
      }

      // Fetch direct vers l'API Better Auth (le client authClient avait des soucis de navigation)
      const res = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        const message = safeAuthErrorMessage(data.message) ?? AUTH_MESSAGES.WRONG_CREDENTIALS
        setError(message)
        toast.error(message)
        setLoading(false)
        return
      }

      toast.success("Connexion réussie ! Redirection…")

      // Le Set-Cookie est posé par le serveur. On navigue directement.
      // window.location.href force un full reload pour s'assurer que
      // le middleware lit le nouveau cookie.
      window.location.href = "/dashboard"
    } catch (e) {
      setError("Impossible de contacter le serveur. Vérifiez votre connexion internet.")
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20 animate-float">
            <TrendingUp className="size-7 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="text-primary">Never</span>BrokeAgain
          </h1>
          <p className="text-sm text-muted-foreground">
            Connectez-vous à votre tableau de bord
          </p>
        </div>

        <Card size="sm" className="relative overflow-hidden border-t-gradient">
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
                  onBlur={() => handleBlur("email")}
                  required
                  autoComplete="email"
                  aria-invalid={touched.email && !!errors.email}
                />
                {touched.email && errors.email && (
                  <p className="text-[11px] text-destructive mt-1" role="alert">{errors.email}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <PasswordField
                  label="Mot de passe"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => handleBlur("password")}
                  autoComplete="current-password"
                  error={touched.password ? errors.password : undefined}
                />
              </div>
              {error && (
                <p role="alert" className="text-sm text-destructive flex items-center gap-1.5 bg-destructive/10 rounded-lg px-3 py-2">
                  <span className="size-1.5 rounded-full bg-destructive shrink-0" />
                  {error}
                </p>
              )}
              <Button type="submit" className="w-full h-9 bg-gradient-primary border-0 shadow-primary" loading={loading}>
                {loading ? "Connexion…" : "Se connecter"}
              </Button>
              <div className="text-center">
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Link
                        href="/forgot-password"
                        className="text-xs text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
                      />
                    }
                  >
                    Mot de passe oublié ? <HelpCircle className="size-3" />
                  </TooltipTrigger>
                  <TooltipContent>Recevez un lien de réinitialisation par email.</TooltipContent>
                </Tooltip>
              </div>
            </CardContent>
          </form>
        </Card>

        <p className="text-sm text-muted-foreground text-center">
          Pas encore de compte ?{" "}
          <Link
            href="/register"
            className="font-medium text-primary hover:text-primary/80 transition-colors"
          >
            S&rsquo;inscrire
          </Link>
        </p>
      </div>
    </div>
  )
}
