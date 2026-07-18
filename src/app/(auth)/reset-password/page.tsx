"use client"

import { useState, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { authClient } from "@nba/lib/auth-client"
import { Button, Input, Card, CardContent } from "@nba/design-system"
import { TrendingUp, Eye, EyeOff, CheckCircle, ArrowLeft } from "lucide-react"

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const router = useRouter()
  const { token } = use(searchParams)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas")
      return
    }

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères")
      return
    }

    if (!token) {
      setError("Ce lien de réinitialisation est incomplet ou invalide. Demandez-en un nouveau.")
      return
    }

    setLoading(true)

    const { error: err } = await authClient.resetPassword({
      newPassword: password,
      token,
    })

    if (err) {
      const message = err.message ?? err.statusText
      setError(message)
      toast.error(message)
      setLoading(false)
      return
    }

    setDone(true)
    toast.success("Mot de passe réinitialisé avec succès.")
    setLoading(false)
  }

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--color-primary)_0%,_transparent_50%)] opacity-[0.03] pointer-events-none" />
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center space-y-3">
            <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-success/10 ring-1 ring-success/20">
              <CheckCircle className="size-7 text-success" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Mot de passe réinitialisé</h1>
            <p className="text-sm text-muted-foreground">
              Votre mot de passe a été modifié avec succès.
            </p>
          </div>
          <Card size="sm" className="relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            <CardContent className="pt-6 text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                <ArrowLeft className="size-4" />
                Se connecter
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
            Nouveau mot de passe
          </h1>
          <p className="text-sm text-muted-foreground">
            Choisissez un nouveau mot de passe sécurisé
          </p>
        </div>

        <Card size="sm" className="relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-1.5">
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                  Nouveau mot de passe
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className="pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="confirm" className="text-sm font-medium text-foreground">
                  Confirmer le mot de passe
                </label>
                <Input
                  id="confirm"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>
              {error && (
                <div className="space-y-2">
                  <p role="alert" className="text-sm text-destructive flex items-center gap-1.5 bg-destructive/10 rounded-lg px-3 py-2">
                    <span className="size-1.5 rounded-full bg-destructive shrink-0" />
                    {error}
                  </p>
                  {error.includes("lien") && (
                    <Link
                      href="/forgot-password"
                      className="text-sm font-medium text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1"
                    >
                      <ArrowLeft className="size-3.5" />
                      Demander un nouveau lien
                    </Link>
                  )}
                </div>
              )}
              <Button type="submit" className="w-full h-9" disabled={loading || !token}>
                {loading ? "Réinitialisation…" : "Réinitialiser le mot de passe"}
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
