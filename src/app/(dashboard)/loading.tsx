import { Loader2 } from "lucide-react"

export default function DashboardLoading() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3" role="status" aria-label="Chargement">
      <Loader2 className="size-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Récupération de votre tableau de bord…</p>
    </div>
  )
}
