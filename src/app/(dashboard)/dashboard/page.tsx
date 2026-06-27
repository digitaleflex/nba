import { headers } from "next/headers"
import { auth } from "@nba/lib/auth"
import { prisma } from "@nba/lib/db"
import { Card, CardContent } from "@nba/design-system"
import { TrendingUp, BarChart3, Users, Activity } from "lucide-react"

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return null

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { onboardingStatus: true, role: { select: { name: true } } },
  })

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
                <p className="text-xl font-bold">—</p>
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
                <p className="text-xl font-bold">—</p>
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
    </div>
  )
}
