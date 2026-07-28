import Link from "next/link"
import { redirect } from "next/navigation"
import { getServerSession } from "@nba/lib/get-session"
import { prisma } from "@nba/lib/db"
import { Card, CardContent, Button, cn } from "@nba/design-system"
import { DashboardKpis } from "./components/dashboard-kpis"
import { PushNotificationPrompt } from "@nba/components/push-notification-prompt"
import {
  BookOpen,
  Plus,
  PenLine,
  Radio,
  ArrowRight,
  CalendarCheck,
} from "lucide-react"

export default async function DashboardPage() {
  const session = await getServerSession()
  if (!session) redirect("/login")

  const userId = session.user.id

  let dbUnavailable = false
  let totalTrades = 0
  let totalPnl = 0
  let winRate = 0
  let disciplineStreak = 0
  let lastReflection: { date: Date; rating: number } | null = null

  try {
    const [tradeAgg, streak, reflection, recentTrades] = await Promise.all([
      prisma.trade.aggregate({
        where: { userId, deletedAt: null },
        _count: true,
        _sum: { pnl: true },
      }),
      prisma.streak.findUnique({
        where: { userId_type: { userId, type: "DISCIPLINE_STREAK" } },
      }),
      prisma.dailyReflection.findFirst({
        where: { userId },
        orderBy: { date: "desc" },
        select: { date: true, rating: true },
      }),
      prisma.trade.count({ where: { userId, deletedAt: null, result: "WIN" } }),
    ])

    totalTrades = tradeAgg._count
    totalPnl = Number(tradeAgg._sum.pnl ?? 0)
    winRate = totalTrades > 0 ? Math.round((recentTrades / totalTrades) * 100) : 0
    disciplineStreak = streak?.count ?? 0
    lastReflection = reflection
  } catch {
    dbUnavailable = true
  }

  const kpis = [
    {
      label: "PnL total",
      value: `${totalPnl >= 0 ? "+" : ""}${totalPnl.toFixed(0)} €`,
      iconName: "TrendingUp",
      tone: totalPnl >= 0 ? "text-emerald-500" : "text-rose-500",
    },
    {
      label: "Win rate",
      value: `${winRate} %`,
      iconName: "Trophy",
      tone: "text-primary",
    },
    {
      label: "Trades",
      value: String(totalTrades),
      iconName: "BookOpen",
      tone: "text-foreground",
    },
    {
      label: "Série discipliné",
      value: `${disciplineStreak} j`,
      iconName: "Flame",
      tone: "text-amber-500",
    },
  ]

  const quickActions = [
    { href: "/dashboard/journal?new=trade", label: "Nouveau trade", icon: Plus, desc: "Enregistre une entrée" },
    { href: "/dashboard/journal", label: "Réflexion du jour", icon: PenLine, desc: "Note ton état d'esprit" },
    { href: "/dashboard/signals", label: "Voir les signaux", icon: Radio, desc: "Le flux du jour" },
    { href: "/dashboard/journal", label: "Mon journal", icon: BookOpen, desc: "Historique & stats" },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tableau de bord</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Vue d&apos;ensemble de ton activité de trading.
        </p>
      </div>

      <PushNotificationPrompt />

      <DashboardKpis kpis={kpis} dbUnavailable={dbUnavailable} />

      {/* Actions rapides */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3">Actions rapides</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link key={action.label} href={action.href}>
              <Card className="border-border hover:border-primary/40 hover:bg-muted/40 transition-colors h-full">
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="size-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <action.icon className="size-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{action.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{action.desc}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Dernière réflexion + accès signals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <CalendarCheck className="size-4 text-primary" />
              <h3 className="text-sm font-semibold">Dernière réflexion</h3>
            </div>
            {lastReflection ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(lastReflection.date).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Note : {lastReflection.rating}/10
                  </p>
                </div>
                <Link href="/dashboard/journal">
                  <Button variant="outline" size="sm" className="gap-1.5">
                    Ouvrir <ArrowRight className="size-3.5" />
                  </Button>
                </Link>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Aucune réflexion pour l&apos;instant. Commence aujourd&apos;hui&nbsp;!
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-4 flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <Radio className="size-4 text-primary" />
              <h3 className="text-sm font-semibold">Signaux du jour</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4 flex-1">
              Accède au flux de signaux premium et filtre par performance.
            </p>
            <Link href="/dashboard/signals">
              <Button className="gap-1.5 w-full sm:w-auto">
                Voir les signaux <ArrowRight className="size-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
