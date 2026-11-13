"use client"

import { useCallback, useEffect, useState } from "react"
import { Button, Card, CardContent } from "@nba/design-system"
import {
  Bell, BellOff, Smartphone, CheckCircle2, AlertTriangle, Loader2, Send, RefreshCw,
} from "lucide-react"
import { usePushSubscription } from "@nba/lib/hooks/use-push-subscription"
import { phoneGuide } from "@nba/lib/push-phone-guide"

interface PushAlertsCardProps {
  variant?: "banner" | "compact" | "full"
}

export function PushAlertsCard({ variant = "full" }: PushAlertsCardProps) {
  const { state, enable, repair, disable, sendTest, recheck } = usePushSubscription()
  const [testResult, setTestResult] = useState<string | null>(null)
  const [testing, setTesting] = useState(false)
  const [showHelp, setShowHelp] = useState(false)

  useEffect(() => {
    if (state === "needs-repair") void repair()
  }, [state, repair])

  const handleEnable = useCallback(async () => {
    await enable()
  }, [enable])

  const handleTest = useCallback(async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await sendTest()
      if (!res) { setTestResult("Erreur réseau."); return }
      if (res.sent > 0) setTestResult("Reçue ✅")
      else setTestResult(res.reason ? `Rien reçu (${res.reason})` : "Rien reçu")
    } finally {
      setTesting(false)
    }
  }, [sendTest])

  const compact = variant === "compact"
  const guide = typeof navigator === "undefined" ? null : phoneGuide(navigator.userAgent)
  const guideBlock = guide && (
    <div className="space-y-1.5">
      <Button size="sm" variant="ghost" className="px-0 h-auto text-xs underline underline-offset-2" onClick={() => setShowHelp((v) => !v)} aria-expanded={showHelp}>
        {showHelp ? "Masquer les réglages du téléphone" : "Ne manquez aucun signal : réglages du téléphone"}
      </Button>
      {showHelp && (
        <div className="text-xs text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">{guide.title}</p>
          <ol className="list-decimal pl-5 space-y-0.5">
            {guide.steps.map((step) => <li key={step}>{step}</li>)}
          </ol>
          <p>Les intitulés exacts varient selon la marque et la version du système.</p>
        </div>
      )}
    </div>
  )

  if (state === "unsupported") {
    return (
      <Card className="border-border/50">
        <CardContent className="p-3 text-xs text-muted-foreground">
          Alertes push non supportées par ce navigateur — repli sur les e-mails.
        </CardContent>
      </Card>
    )
  }

  if (state === "ios-install") {
    return (
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="p-4 space-y-2">
          <p className="text-sm font-semibold flex items-center gap-2">
            <Smartphone className="size-4 text-amber-500" /> Étape 1/2 — Installez l'application
          </p>
          <p className="text-xs text-muted-foreground">
            Touchez <strong>Partager</strong>, puis <strong>Sur l'écran d'accueil</strong>, puis ouvrez NBA depuis son icône. L'étape 2 s'enchaînera seule.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (state === "denied") {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="p-4 space-y-3">
          <p className="text-sm font-semibold flex items-center gap-2 text-destructive">
            <BellOff className="size-4" /> Alertes bloquées
          </p>
          <p className="text-xs text-muted-foreground">
            Autorisez les notifications dans les réglages de votre navigateur/OS, puis revenez ici.
          </p>
          <Button size="sm" variant="outline" onClick={() => void recheck()}>
            <RefreshCw className="size-3.5 mr-1.5" /> J'ai changé le réglage
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (state === "needs-permission") {
    return (
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className={compact ? "p-3" : "p-4 space-y-3"}>
          <p className={compact ? "text-xs font-medium" : "text-sm font-semibold flex items-center gap-2"}>
            <Bell className="size-4 text-primary" /> Recevez chaque signal en direct
          </p>
          {!compact && (
            <p className="text-xs text-muted-foreground">
              Avec la sonnerie de votre téléphone, même écran verrouillé.
            </p>
          )}
          <Button size="sm" onClick={() => void handleEnable()}>
            Activer les alertes
          </Button>
        </CardContent>
      </Card>
    )
  }

  // active
  return (
    <Card className="border-emerald-500/30 bg-emerald-500/5">
      <CardContent className={compact ? "p-3 space-y-2" : "p-4 space-y-3"}>
        <p className="text-sm font-semibold flex items-center gap-2 text-emerald-600">
          <CheckCircle2 className="size-4" /> Alertes actives sur cet appareil
        </p>
        {variant === "full" && (
          <>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => void handleTest()} disabled={testing}>
                {testing ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : <Send className="size-3.5 mr-1.5" />}
                Envoyer une alerte de test
              </Button>
              {testResult && <span className="text-xs text-muted-foreground">{testResult}</span>}
            </div>
            {testResult === "Rien reçu" || testResult?.startsWith("Rien reçu") ? (
              <div className="space-y-1 text-xs text-muted-foreground">
                <p className="font-medium flex items-center gap-1.5"><AlertTriangle className="size-3.5 text-amber-500" /> Vérifications :</p>
                <ul className="list-disc pl-5 space-y-0.5">
                  <li>Permission de notification accordée</li>
                  <li>Abonnement serveur présent (statut)</li>
                  <li>Sonnerie / Ne pas déranger / Concentration</li>
                  <li>Android : batterie « Sans restriction », son du canal</li>
                  <li>iPhone : app ouverte depuis l'icône</li>
                </ul>
              </div>
            ) : null}
            {guideBlock}
            <Button size="sm" variant="ghost" onClick={() => void disable()}>
              Désactiver
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
