"use client"

import Link from "next/link"
import { TrendingUp, ArrowLeft, ShieldX, Mail } from "lucide-react"
import { SUPPORT_EMAIL } from "@nba/lib/constants"

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--color-primary)_0%,_transparent_50%)] opacity-[0.03] pointer-events-none" />
      <div className="w-full max-w-sm text-center space-y-8">
        <div className="inline-flex size-16 items-center justify-center rounded-2xl bg-warning/10 ring-1 ring-warning/20">
          <ShieldX className="size-8 text-warning" />
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">403</h1>
          <p className="text-lg font-semibold">Accès refusé</p>
          <p className="text-sm text-muted-foreground">
            Vous n&rsquo;avez pas les permissions nécessaires pour accéder à cette page.
            Si vous pensez qu&rsquo;il s&rsquo;agit d&rsquo;une erreur, contactez votre administrateur.
          </p>
        </div>
        <div className="flex flex-col items-center gap-3">
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <ArrowLeft className="size-4" />
              Page précédente
            </button>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80 transition-colors"
            >
              Tableau de bord
            </Link>
          </div>
          <a
            href={`mailto:${SUPPORT_EMAIL}?subject=Erreur%20403`}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2 inline-flex items-center gap-1"
          >
            <Mail className="size-3" />
            Contacter le support
          </a>
        </div>
      </div>
    </div>
  )
}
