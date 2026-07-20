import { Loader2 } from "lucide-react"

export default function AuthLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-dvh gap-3" role="status" aria-label="Chargement">
      <Loader2 className="size-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Préparation de votre espace…</p>
    </div>
  )
}
