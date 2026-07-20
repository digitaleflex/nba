import Link from "next/link"
import { TrendingUp, Clock } from "lucide-react"

export default function MaintenancePage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--color-primary)_0%,_transparent_50%)] opacity-[0.03] pointer-events-none" />
      <div className="w-full max-w-sm text-center space-y-8">
        <div className="inline-flex size-16 items-center justify-center rounded-2xl bg-amber-500/10 ring-1 ring-amber-500/20">
          <Clock className="size-8 text-amber-500" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Maintenance en cours</h1>
          <p className="text-sm text-muted-foreground">
            Nous effectuons une maintenance programmée pour améliorer votre expérience.
            Revenez dans quelques instants.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80 transition-colors"
        >
          Réessayer
        </Link>
      </div>
    </div>
  )
}
