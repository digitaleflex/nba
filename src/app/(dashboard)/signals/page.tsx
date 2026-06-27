import { getSignals } from "@nba/modules/signals/services/get-signals"
import { prisma } from "@nba/lib/db"
import { getServerSession } from "@nba/lib/get-session"
import { Card, CardContent, Badge, Button } from "@nba/design-system"
import { Radio, Calendar, Info } from "lucide-react"
import { parseSimpleMarkdown } from "@nba/lib/utils"
import Link from "next/link"

export default async function SignalsPage() {
  const session = await getServerSession()
  if (!session) return null

  const signals = await getSignals()

  // Record/update reads for the loaded signals
  for (const sig of signals) {
    try {
      await prisma.signalRead.upsert({
        where: {
          signalId_userId: {
            signalId: sig.id,
            userId: session.user.id
          }
        },
        create: {
          signalId: sig.id,
          userId: session.user.id,
          viewCount: 1
        },
        update: {
          viewCount: { increment: 1 }
        }
      })
    } catch (err) {
      console.error(`Failed to record signal read for ${sig.id}:`, err)
    }
  }

  // Check if member has active plans
  const approvedRequests = await prisma.accessRequest.findMany({
    where: {
      userId: session.user.id,
      status: "APPROVED",
    },
    include: {
      plan: true,
    },
  })

  const hasActivePlans = approvedRequests.length > 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Flux de Signaux</h1>
        <p className="text-sm text-muted-foreground">
          Consultez les derniers signaux de trading publiés en temps réel.
        </p>
      </div>

      {!hasActivePlans ? (
        <Card className="border-warning/30 bg-warning/5/10">
          <CardContent className="pt-6 space-y-4 text-center max-w-lg mx-auto">
            <Info className="size-10 text-warning mx-auto" />
            <div className="space-y-1.5">
              <h3 className="font-semibold text-warning">Aucun groupe actif</h3>
              <p className="text-sm text-muted-foreground">
                Vous n'avez actuellement aucun abonnement actif approuvé. Vous devez souscrire à une offre et finaliser votre onboarding pour accéder aux signaux.
              </p>
            </div>
            <Link href="/onboarding" className="block w-full">
              <Button className="w-full">
                Compléter mon onboarding
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : signals.length === 0 ? (
        <Card className="border-border">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <Radio className="size-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-foreground">Aucun signal disponible</p>
              <p className="text-sm">
                Vous avez accès à <strong>{approvedRequests.map((r: any) => r.plan.name).join(", ")}</strong>. 
                Les signaux apparaîtront ici dès qu'ils seront publiés.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 max-w-3xl">
          {signals.map((sig: any) => (
            <Card key={sig.id} className="relative overflow-hidden border border-primary/10 shadow-sm bg-card">
              <div className="absolute inset-y-0 left-0 w-1 bg-primary" />
              <CardContent className="p-5 space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between text-xs text-muted-foreground border-b border-border/40 pb-3">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="size-3.5" />
                    {sig.publishedAt ? new Date(sig.publishedAt).toLocaleString("fr-FR", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    }) : "À l'instant"}
                  </span>
                  
                  <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary text-[10px] tracking-wider font-extrabold uppercase py-0.5 px-2">
                    Nouveau signal
                  </Badge>
                </div>
                
                {/* Content body */}
                <div 
                  className="text-sm font-medium text-foreground whitespace-pre-wrap leading-relaxed space-y-2 break-words"
                  dangerouslySetInnerHTML={{ __html: parseSimpleMarkdown(sig.content) }}
                />
                
                {/* Attached Graphics Gallery */}
                {Array.isArray(sig.imageUrls) && sig.imageUrls.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    {sig.imageUrls.map((url: string, idx: number) => (
                      <div key={idx} className="relative overflow-hidden rounded-xl border border-border bg-background/50 aspect-video">
                        <img 
                          src={`/api/files/${url}`} 
                          alt="" 
                          className="w-full h-full object-cover hover:scale-102 transition-transform duration-200" 
                        />
                      </div>
                    ))}
                  </div>
                ) : sig.imageUrl ? (
                  <div className="relative overflow-hidden rounded-xl border border-border bg-muted/20">
                    <img 
                      src={`/api/files/${sig.imageUrl}`} 
                      alt="Graphique du signal" 
                      className="w-full max-h-[360px] object-cover" 
                    />
                  </div>
                ) : null}

                {/* Details Link */}
                <div className="flex justify-end pt-2 border-t border-border/20">
                  <Link href={`/dashboard/signals/${sig.id}`}>
                    <Button variant="ghost" size="sm" className="text-xs text-primary hover:text-primary-foreground">
                      Voir la page du signal →
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
