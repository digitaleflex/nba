"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Loader2, Inbox, UserPlus, FileCheck, Link2, Bug, MessageCircle, PartyPopper, ArrowRight } from "lucide-react"
import { Card, CardContent } from "@nba/design-system"

interface Summary {
  requests: number
  kyc: number
  broker: number
  bugs: number
  support: number
  total: number
}

const QUEUES = [
  { key: "requests", label: "Demandes d'accès", desc: "Abonnements en attente de validation", href: "/admin?tab=requests", icon: UserPlus },
  { key: "kyc", label: "KYC", desc: "Documents d'identité à vérifier", href: "/admin?tab=kyc", icon: FileCheck },
  { key: "broker", label: "Broker", desc: "Comptes broker à vérifier", href: "/admin?tab=broker", icon: Link2 },
  { key: "bugs", label: "Bugs", desc: "Rapports de bugs ouverts", href: "/admin?tab=bugs", icon: Bug },
  { key: "support", label: "Support", desc: "Tickets support ouverts", href: "/admin/support", icon: MessageCircle },
] as const

export default function ATraiterPage() {
  const [data, setData] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/review/summary")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setData(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <Inbox className="size-5 text-primary" />
          À traiter
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          {loading ? "Chargement…" : data && data.total > 0
            ? `${data.total} élément${data.total > 1 ? "s" : ""} en attente d'une action`
            : "Rien en attente. Belle journée."}
        </p>
      </div>

      {loading ? (
        <div className="py-16 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
      ) : !data ? (
        <p className="text-sm text-destructive">Erreur de chargement.</p>
      ) : data.total === 0 ? (
        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <PartyPopper className="size-8 text-emerald-500" />
            <p className="font-semibold">Tout est à jour</p>
            <p className="text-xs text-muted-foreground">Aucune demande, vérification, bug ou ticket en attente.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {QUEUES.map((q) => {
            const count = data[q.key] ?? 0
            const Icon = q.icon
            return (
              <Link key={q.key} href={q.href}>
                <Card className={`transition-colors hover:border-primary/40 ${count > 0 ? "border-primary/20" : "opacity-70"}`}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${count > 0 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                      <Icon className="size-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{q.label}</p>
                      <p className="text-xs text-muted-foreground truncate">{q.desc}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`text-lg font-extrabold tabular-nums ${count > 0 ? "text-primary" : "text-muted-foreground"}`}>
                        {count}
                      </span>
                      <ArrowRight className="size-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
