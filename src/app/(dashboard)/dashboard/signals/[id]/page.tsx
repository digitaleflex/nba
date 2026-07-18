import { notFound, redirect } from "next/navigation"
import { prisma } from "@nba/lib/db"
import { getServerSession } from "@nba/lib/get-session"
import { canViewSignal } from "@nba/modules/signals/policies/signal-policy"
import { Card, CardContent, Badge } from "@nba/design-system"
import { Calendar, User, ChevronLeft } from "lucide-react"
import { parseSimpleMarkdown } from "@nba/lib/utils"
import Link from "next/link"
import { SignalActions } from "./components/signal-actions"

export default async function SignalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  const session = await getServerSession()
  if (!session) {
    redirect("/login")
  }

  // Fetch the signal, favorite/archive status and approved access requests in parallel
  const [signal, favorite, archive, approvedRequests, userDb] = await Promise.all([
    prisma.signal.findUnique({
      where: { id },
      include: {
        creator: { select: { name: true } },
        audience: { include: { plan: true } }
      }
    }),
    prisma.signalFavorite.findUnique({
      where: {
        signalId_userId: {
          signalId: id,
          userId: session.user.id
        }
      }
    }),
    prisma.signalArchive.findUnique({
      where: {
        signalId_userId: {
          signalId: id,
          userId: session.user.id
        }
      }
    }),
    prisma.accessRequest.findMany({
      where: { userId: session.user.id, status: "APPROVED" },
      select: { planId: true }
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: { select: { name: true } } }
    })
  ])

  const isUserAdmin = userDb?.role?.name === "ADMIN" || userDb?.role?.name === "SUPER_ADMIN"
  const userPlanIds = new Set(approvedRequests.map((r) => r.planId))

  if (!signal || signal.deletedAt) {
    notFound()
  }

  // Check access policy
  const canView = await canViewSignal(session.user.id, signal.id)
  if (!canView) {
    redirect("/dashboard/signals")
  }

  // Record a read event for this signal
  try {
    await prisma.signalRead.upsert({
      where: {
        signalId_userId: {
          signalId: signal.id,
          userId: session.user.id
        }
      },
      create: {
        signalId: signal.id,
        userId: session.user.id,
        viewCount: 1
      },
      update: {
        viewCount: { increment: 1 }
      }
    })
  } catch (err) {
    console.error("Failed to record read:", err)
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <Link href="/dashboard/signals" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors min-h-[44px] py-2 -ml-2 px-2 rounded-lg active:bg-muted">
        <ChevronLeft className="size-4" />
        Retour au flux
      </Link>

      <Card className="relative overflow-hidden border border-primary/20 shadow-md bg-card">
        <div className="absolute inset-y-0 left-0 w-1 bg-primary sm:w-1.5" />
        <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/40 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="size-3.5" />
                  {signal.publishedAt ? new Date(signal.publishedAt).toLocaleString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }) : "À l'instant"}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <User className="size-3.5" />
                  Par : Never Broke Again
                </span>
              </div>
            </div>

            <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary tracking-wider font-extrabold uppercase py-0.5 px-2">
              Signal officiel
            </Badge>
          </div>

          {/* Body Content */}
          <div 
            className="text-base font-medium text-foreground whitespace-pre-wrap leading-relaxed space-y-3 break-words"
            dangerouslySetInnerHTML={{ __html: parseSimpleMarkdown(signal.content) }}
          />

          {/* Interactive Actions for Favorite, Archive, Share, Print */}
          <SignalActions 
            signalId={signal.id}
            signalContent={signal.content}
            initialFavorited={!!favorite} 
            initialArchived={!!archive} 
          />

          {/* Graphics Gallery */}
          {Array.isArray(signal.imageUrls) && (signal.imageUrls as string[]).length > 0 ? (
            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Graphiques joints</h3>
              <div className="grid gap-4">
                {(signal.imageUrls as string[]).map((url, idx) => (
                  <div key={idx} className="relative overflow-hidden rounded-xl border bg-muted/10 h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px] w-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/files/${url}`}
                      alt={`Graphique ${idx + 1}`}
                      loading={idx === 0 ? "eager" : "lazy"}
                      className="absolute inset-0 w-full h-full object-contain"
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : signal.imageUrl ? (
            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Graphique joint</h3>
              <div className="relative overflow-hidden rounded-xl border bg-muted/10 h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px] w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/files/${signal.imageUrl}`}
                  alt="Graphique du signal"
                  loading="eager"
                  className="absolute inset-0 w-full h-full object-contain"
                />
              </div>
            </div>
          ) : null}

          {/* Target Audience Groups - Admin only */}
          {isUserAdmin && signal?.audience && signal.audience.length > 0 && (
            <div className="border-t border-border/20 pt-4 space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground">Groupes ciblés</h4>
              <div className="flex flex-wrap gap-2">
                {signal.audience.map((a: any) => (
                  <Badge key={a.plan.name} variant="secondary" className="px-2 py-0.5">
                    {a.plan.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
