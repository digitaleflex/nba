"use client"

import Link from "next/link"
import { TrendingUp, Home, ArrowLeft, Mail } from "lucide-react"
import { SUPPORT_EMAIL } from "@nba/lib/constants"

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--color-primary)_0%,_transparent_50%)] opacity-[0.03] pointer-events-none" />
      <div className="w-full max-w-sm text-center space-y-8">
        <div className="inline-flex size-16 items-center justify-center rounded-2xl bg-muted ring-1 ring-border">
          <TrendingUp className="size-8 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">404</h1>
          <p className="text-lg font-semibold">Page introuvable</p>
          <p className="text-sm text-muted-foreground">
            La page que vous recherchez n&rsquo;existe pas ou a été déplacée.
            Vérifiez l&rsquo;URL ou retournez à l&rsquo;accueil.
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
              href="/"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80 transition-colors"
            >
              <Home className="size-4" />
              Accueil
            </Link>
          </div>
          <a
            href={`mailto:${SUPPORT_EMAIL}?subject=Erreur%20404`}
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
