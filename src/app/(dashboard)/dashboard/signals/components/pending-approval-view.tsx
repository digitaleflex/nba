"use client"

import { Card, CardContent, Button, Badge } from "@nba/design-system"
import { Clock, ShieldCheck, MessageCircle, Mail, Bell, ArrowRight, CheckCircle2, Calendar } from "lucide-react"
import Link from "next/link"

interface PendingApprovalViewProps {
  planName: string
  requestedAt: string
}

export function PendingApprovalView({ planName, requestedAt }: PendingApprovalViewProps) {
  const requestDate = new Date(requestedAt)

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 py-8">
      <Card className="w-full max-w-xl bg-background/50 border border-amber-500/30 backdrop-blur-xl shadow-2xl relative overflow-hidden rounded-2xl">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

        <CardContent className="flex flex-col items-center p-8 md:p-10 text-center relative z-10">
          {/* Icône */}
          <div className="relative mb-6">
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-400 rounded-full blur opacity-40 animate-pulse" />
            <div className="relative flex items-center justify-center w-20 h-20 bg-card rounded-full border border-amber-500/30">
              <ShieldCheck className="w-9 h-9 text-amber-500" />
            </div>
          </div>

          {/* Titre */}
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-2">
            Tout est en ordre, votre demande est bien prise en charge
          </h2>

          {/* Message rassurant principal */}
          <p className="text-foreground/80 max-w-md mb-4 text-sm md:text-base leading-relaxed">
            Un administrateur est en train de vérifier votre dossier.
            C&apos;est la dernière étape avant l&apos;activation de votre accès —
            vous y êtes presque.
          </p>

          {/* Statut actuel */}
          <div className="flex items-center gap-3 mb-6 px-4 py-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
            <Badge variant="outline" className="text-amber-600 border-amber-500/30 bg-amber-500/10 shrink-0">
              En attente
            </Badge>
            <div className="text-left min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{planName}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="size-3" />
                Demandé le {requestDate.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
          </div>

          {/* Étapes : ce qui va se passer */}
          <div className="w-full max-w-sm mb-4 space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">Ce qui va se passer</p>
            <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
              <div className="flex items-center justify-center size-7 shrink-0 rounded-full bg-emerald-500/10">
                <CheckCircle2 className="size-3.5 text-emerald-500" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-foreground">Validation de votre dossier</p>
                <p className="text-xs text-muted-foreground">Un admin examine votre demande actuellement</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
              <div className="flex items-center justify-center size-7 shrink-0 rounded-full bg-primary/10">
                <MessageCircle className="size-3.5 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-foreground">Message privé dans votre messagerie</p>
                <p className="text-xs text-muted-foreground">Une confirmation vous sera envoyée par message</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-xl bg-sky-500/5 border border-sky-500/10">
              <div className="flex items-center justify-center size-7 shrink-0 rounded-full bg-sky-500/10">
                <Mail className="size-3.5 text-sky-500" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-foreground">Email de confirmation</p>
                <p className="text-xs text-muted-foreground">Un email vous sera envoyé dans la foulée</p>
              </div>
            </div>
          </div>

          {/* Promesse de délai */}
          <div className="flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-amber-500/5 border border-amber-500/10">
            <Clock className="size-4 text-amber-500 shrink-0" />
            <p className="text-sm text-amber-600 font-medium">
              Vous serez notifié par message et par email dans l&apos;heure suivant la validation
            </p>
          </div>

          {/* Boutons */}
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Link href="/dashboard/messages" className="w-full sm:w-auto">
              <Button variant="default" size="lg" className="w-full gap-2">
                <Bell className="w-4 h-4" />
                Voir mes messages
              </Button>
            </Link>
            <Link href="/dashboard/subscription" className="w-full sm:w-auto">
              <Button variant="ghost" size="lg" className="w-full gap-2 text-muted-foreground">
                Voir le détail de ma demande
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
