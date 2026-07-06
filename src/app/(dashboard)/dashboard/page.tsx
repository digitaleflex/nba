import { redirect } from "next/navigation"
import { getServerSession } from "@nba/lib/get-session"
import { prisma } from "@nba/lib/db"
import { Card, CardContent } from "@nba/design-system"
import { TrendingUp, BarChart3, Users, Activity } from "lucide-react"

export default async function DashboardPage() {
  const session = await getServerSession()
  if (!session) redirect("/login")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { onboardingStatus: true, role: { select: { name: true } } },
  })

  const [
    totalSignals,
    readSignals,
    favoriteSignals,
  ] = await Promise.all([
    prisma.signal.count({
      where: { status: "PUBLISHED", deletedAt: null },
    }),
    prisma.signalRead.count({
      where: { userId: session.user.id },
    }),
    prisma.signalFavorite.count({
      where: { userId: session.user.id },
    }),
  ])

  const unreadSignals = Math.max(0, totalSignals - readSignals)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Bonjour, {session.user.name}
        </h1>
        <p className="text-sm text-muted-foreground">
          Bienvenue sur votre tableau de bord
        </p>
      </div>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
        <Card className="relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                <Activity className="size-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Signaux</p>
                <p className="text-base sm:text-xl font-bold truncate">
                  {unreadSignals > 0 ? (
                    <span className="text-primary">{unreadSignals} non lu{unreadSignals > 1 ? "s" : ""}</span>
                  ) : (
                    <span>{totalSignals} reçu{totalSignals > 1 ? "s" : ""}</span>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-chart-1/10 shrink-0">
                <BarChart3 className="size-5 text-chart-1" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Performance</p>
                <p className="text-base sm:text-xl font-bold truncate">
                  {readSignals} lu{readSignals > 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden col-span-2 lg:col-span-1">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-success/10 shrink-0">
                <Users className="size-5 text-success" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Statut</p>
                <p className="text-base sm:text-xl font-bold capitalize truncate">
                  {user?.onboardingStatus.toLowerCase().replace(/_/g, " ")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  )
}
