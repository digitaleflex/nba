import Link from "next/link"
import { TrendingUp, Home } from "lucide-react"

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
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80 transition-colors"
        >
          <Home className="size-4" />
          Retour à l&rsquo;accueil
        </Link>
      </div>
    </div>
  )
}
