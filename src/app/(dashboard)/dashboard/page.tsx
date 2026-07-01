import { getServerSession } from "@nba/lib/get-session"
import { prisma } from "@nba/lib/db"
import { Card, CardContent } from "@nba/design-system"
import { TrendingUp, BarChart3, Users, Activity } from "lucide-react"
import { SessionList } from "../components/session-list"

export default async function DashboardPage() {
  const session = await getServerSession()
  if (!session) return null

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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                <Activity className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Signaux</p>
                <p className="text-xl font-bold">
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
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-chart-1/10">
                <BarChart3 className="size-5 text-chart-1" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Performance</p>
                <p className="text-xl font-bold">
                  {readSignals} lu{readSignals > 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-success/10">
                <Users className="size-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Statut</p>
                <p className="text-xl font-bold capitalize">
                  {user?.onboardingStatus.toLowerCase().replace(/_/g, " ")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <SessionList />
    </div>
  )
}
