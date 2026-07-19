"use client"

import { Card } from "@nba/design-system"

interface StatsTabProps {
  opsData: any
}

export function StatsTab({ opsData }: StatsTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Statistiques globales</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Compteurs clés consolidés d&apos;activité de la plateforme NBA.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        <Card className="border-border bg-card/30 p-6 space-y-1">
          <span className="text-[10px] text-muted-foreground uppercase font-bold">Membres</span>
          <p className="text-2xl font-bold text-foreground">
            {opsData?.stats?.totalMembers || 0}
          </p>
        </Card>
        <Card className="border-border bg-card/30 p-6 space-y-1">
          <span className="text-[10px] text-muted-foreground uppercase font-bold">Signaux émis</span>
          <p className="text-2xl font-bold text-foreground">
            {opsData?.stats?.publishedSignalsCount || 0}
          </p>
        </Card>
        <Card className="border-border bg-card/30 p-6 space-y-1">
          <span className="text-[10px] text-muted-foreground uppercase font-bold">Dossiers KYC Validés</span>
          <p className="text-2xl font-bold text-foreground">
            {opsData?.stats?.approvedKycCount || 0}
          </p>
        </Card>
        <Card className="border-border bg-card/30 p-6 space-y-1">
          <span className="text-[10px] text-muted-foreground uppercase font-bold">E-mails envoyés</span>
          <p className="text-2xl font-bold text-foreground">
            {opsData?.stats?.totalEmailsSent ?? 0}
          </p>
        </Card>
        <Card className="border-border bg-card/30 p-6 space-y-1">
          <span className="text-[10px] text-muted-foreground uppercase font-bold">E-mails en échec</span>
          <p className="text-2xl font-bold text-foreground">
            {opsData?.attention?.failedEmailsCount ?? 0}
          </p>
        </Card>
        <Card className="border-border bg-card/30 p-6 space-y-1">
          <span className="text-[10px] text-muted-foreground uppercase font-bold">Notifications envoyées</span>
          <p className="text-2xl font-bold text-foreground">
            {opsData?.stats?.totalNotificationsSent ?? 0}
          </p>
        </Card>
      </div>
    </div>
  )
}
