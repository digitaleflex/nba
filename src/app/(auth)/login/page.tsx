"use client"

import { useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Button, Input, Card, CardContent, Tooltip, TooltipTrigger, TooltipContent } from "@nba/design-system"
import { TrendingUp, Eye, EyeOff, HelpCircle } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!email.trim()) {
      setError("Veuillez saisir votre email.")
      return
    }
    if (!password) {
      setError("Veuillez saisir votre mot de passe.")
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
        const message = data.message ?? "Identifiants invalides"
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
      setError("Erreur de connexion. Veuillez réessayer.")
      setLoading(false)
    }
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
            <span className="text-primary">Never</span>BrokeAgain
          </h1>
          <p className="text-sm text-muted-foreground">
            Connectez-vous à votre tableau de bord
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
              <div className="space-y-1.5">
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                  Mot de passe
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </div>
              {error && (
                <p role="alert" className="text-sm text-destructive flex items-center gap-1.5 bg-destructive/10 rounded-lg px-3 py-2">
                  <span className="size-1.5 rounded-full bg-destructive shrink-0" />
                  {error}
                </p>
              )}
              <Button type="submit" className="w-full h-9" disabled={loading}>
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
