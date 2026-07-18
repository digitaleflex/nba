import Link from "next/link"
import { ShieldX, Mail, ArrowLeft } from "lucide-react"

interface BlockedPageProps {
  searchParams: Promise<{ reason?: string; status?: string; at?: string }>
}

const STATUS_COPY: Record<string, { title: string; message: string }> = {
  banned: {
    title: "Compte suspendu",
    message:
      "Votre compte a été suspendu suite à un manquement aux conditions d'utilisation. Cette décision peut être contestée auprès de notre équipe.",
  },
  inactive: {
    title: "Compte désactivé",
    message:
      "Votre compte est actuellement désactivé. Contactez notre équipe pour réactiver votre accès.",
  },
  deleted: {
    title: "Compte supprimé",
    message:
      "Ce compte a été supprimé. Si vous pensez qu'il s'agit d'une erreur, contactez notre équipe.",
  },
}

function formatTimestamp(at?: string): string | null {
  if (!at) return null
  const d = new Date(at)
  if (Number.isNaN(d.getTime())) return null
  // Horodatage à la seconde près, en heure locale de l'utilisateur.
  return d.toLocaleString("fr-FR", {
    dateStyle: "long",
    timeStyle: "medium",
  })
}

export default async function BlockedPage({ searchParams }: BlockedPageProps) {
  const { reason, status, at } = await searchParams
  const copy = STATUS_COPY[status ?? ""] ?? {
    title: "Accès temporairement indisponible",
    message:
      "Votre compte ne peut pas se connecter pour le moment. Notre équipe peut vous aider à résoudre la situation.",
  }
  const timestamp = formatTimestamp(at)

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--color-primary)_0%,_transparent_50%)] opacity-[0.03] pointer-events-none" />
      <div className="w-full max-w-md text-center space-y-8">
        <div className="inline-flex size-16 items-center justify-center rounded-2xl bg-warning/10 ring-1 ring-warning/20">
          <ShieldX className="size-8 text-warning" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">{copy.title}</h1>
          <p className="text-sm text-muted-foreground">{copy.message}</p>
          {timestamp && (
            <p className="text-xs text-muted-foreground/80 mt-2 rounded-lg bg-muted/40 px-3 py-2">
              Intervention effectuée le {timestamp}
            </p>
          )}
          {reason && (
            <p className="text-xs text-muted-foreground/80 mt-2 rounded-lg bg-muted/40 px-3 py-2">
              Motif : {reason}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-3 justify-center">
          <Link
            href="/support"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80 transition-colors"
          >
            <Mail className="size-4" />
            Contacter le support
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeft className="size-4" />
            Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  )
}
