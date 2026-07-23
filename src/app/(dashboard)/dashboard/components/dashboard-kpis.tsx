"use client"

import { useRouter } from "next/navigation"
import { Tooltip, TooltipTrigger, TooltipContent, Card, CardContent, cn } from "@nba/design-system"
import { AutoRetryCountdown } from "@nba/components/auto-retry-countdown"
import { type LucideIcon, RefreshCw, HelpCircle, Database } from "lucide-react"

interface KpiDef {
  label: string
  value: string
  icon: LucideIcon
  tone: string
}

interface DashboardKpisProps {
  kpis: KpiDef[]
  dbUnavailable: boolean
}

export function DashboardKpis({ kpis, dbUnavailable }: DashboardKpisProps) {
  const router = useRouter()

  if (dbUnavailable) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground/80 bg-muted/40 rounded-lg px-3 py-2">
          <Database className="size-4 text-muted-foreground/60" />
          <span>Données momentanément inaccessibles</span>
          <AutoRetryCountdown
            onRetry={() => router.refresh()}
            label="réessai"
          />
          <button
            type="button"
            onClick={() => router.refresh()}
            className="ml-auto text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1"
          >
            <RefreshCw className="size-3" />
            Réessayer
          </button>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi) => (
            <Card key={kpi.label} className="border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">{kpi.label}</span>
                  <kpi.icon className={cn("size-4", kpi.tone)} />
                </div>
                <p className="text-2xl font-bold tabular-nums text-muted-foreground flex items-center gap-2">
                  —
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="size-3.5 text-muted-foreground/50" />
                    </TooltipTrigger>
                    <TooltipContent>
                      Données momentanément inaccessibles — réessai automatique dans quelques secondes
                    </TooltipContent>
                  </Tooltip>
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
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
  )
}
