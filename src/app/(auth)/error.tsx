"use client"

import { useEffect } from "react"
import Link from "next/link"
import { TrendingUp, RefreshCw, LogIn } from "lucide-react"

export default function AuthError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--color-primary)_0%,_transparent_50%)] opacity-[0.03] pointer-events-none" />
      <div className="w-full max-w-sm text-center space-y-8">
        <div className="inline-flex size-16 items-center justify-center rounded-2xl bg-destructive/10 ring-1 ring-destructive/20">
          <TrendingUp className="size-8 text-destructive" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Erreur d&rsquo;authentification</h1>
          <p className="text-sm text-muted-foreground">
            Une erreur est survenue. Veuillez réessayer ou vous reconnecter.
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground/60 mt-3 font-mono">
              Code d&rsquo;erreur : {error.digest}
            </p>
          )}
        </div>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80 transition-colors cursor-pointer"
          >
            <RefreshCw className="size-4" />
            Réessayer
          </button>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            <LogIn className="size-4" />
            Connexion
          </Link>
        </div>
      </div>
    </div>
  )
}
