"use client"

import { useEffect } from "react"
import Link from "next/link"
import { TrendingUp, RefreshCw, ArrowRight } from "lucide-react"
export default function OnboardingError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <div className="w-full max-w-sm text-center space-y-8">
        <div className="inline-flex size-16 items-center justify-center rounded-2xl bg-destructive/10 ring-1 ring-destructive/20">
          <TrendingUp className="size-8 text-destructive" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Erreur onboarding</h1>
          <p className="text-sm text-muted-foreground">
            Une erreur est survenue lors de la configuration de votre compte.
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground/60 mt-3 font-mono">
              Code d&rsquo;erreur : {error.digest}
            </p>
          )}
        </div>
        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-3 justify-center">
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80 transition-colors cursor-pointer"
            >
              <RefreshCw className="size-4" />
              Réessayer
            </button>
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              <ArrowRight className="size-4" />
              Onboarding
            </Link>
          </div>
          <Link
            href="/dashboard/support"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
          >
            Contacter le support
          </Link>
        </div>
      </div>
    </div>
  )
}
