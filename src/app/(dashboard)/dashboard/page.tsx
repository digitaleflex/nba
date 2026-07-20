import Link from "next/link"
import { redirect } from "next/navigation"
import { getServerSession } from "@nba/lib/get-session"
import { prisma } from "@nba/lib/db"
import { Card, CardContent, Button, cn } from "@nba/design-system"
import {
  TrendingUp,
  BookOpen,
  Trophy,
  Flame,
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

  const [tradeAgg, streak, lastReflection, recentTrades] = await Promise.all([
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

  const totalTrades = tradeAgg._count
  const totalPnl = Number(tradeAgg._sum.pnl ?? 0)
  const winRate = totalTrades > 0 ? Math.round((recentTrades / totalTrades) * 100) : 0
  const disciplineStreak = streak?.count ?? 0

  const kpis = [
    {
      label: "PnL total",
      value: `${totalPnl >= 0 ? "+" : ""}${totalPnl.toFixed(0)} €`,
      icon: TrendingUp,
      tone: totalPnl >= 0 ? "text-emerald-500" : "text-rose-500",
    },
    {
      label: "Win rate",
      value: `${winRate} %`,
      icon: Trophy,
      tone: "text-primary",
    },
    {
      label: "Trades",
      value: String(totalTrades),
      icon: BookOpen,
      tone: "text-foreground",
    },
    {
      label: "Série discipliné",
      value: `${disciplineStreak} j`,
      icon: Flame,
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

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">{kpi.label}</span>
                <kpi.icon className={cn("size-4", kpi.tone)} />
              </div>
              <p className={cn("text-2xl font-bold tabular-nums", kpi.tone)}>{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

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
