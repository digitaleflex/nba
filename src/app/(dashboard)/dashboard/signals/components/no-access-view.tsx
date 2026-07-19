"use client"

import { Card, CardContent, Button } from "@nba/design-system"
import { Lock, Radio, ArrowRight } from "lucide-react"
import Link from "next/link"

export function NoAccessView() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 py-8">
      <Card className="w-full max-w-lg bg-background/50 border border-border/80 backdrop-blur-xl shadow-2xl relative overflow-hidden rounded-2xl">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

        <CardContent className="flex flex-col items-center p-8 md:p-12 text-center relative z-10">
          <div className="relative mb-6">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-primary/50 rounded-full blur opacity-40" />
            <div className="relative flex items-center justify-center w-20 h-20 bg-card rounded-full border border-border">
              <Radio className="w-9 h-9 text-primary" />
            </div>
          </div>

          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-3">
            Accès aux Signaux
          </h2>
          <p className="text-muted-foreground max-w-md mb-8 text-sm md:text-base">
            Vous n'avez pas encore accès aux signaux de trading. Faites une demande d'accès pour commencer à recevoir les signaux en temps réel.
          </p>

          <Link href="/dashboard/subscription">
            <Button size="lg" className="w-full sm:w-auto text-base gap-2">
              Faire votre demande d'accès
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>

          <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4 text-xs text-muted-foreground mt-6">
            <span>Besoin d'aide ?</span>
            <a href="https://t.me/nba_support" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">
              Contacter le support sur Telegram
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
