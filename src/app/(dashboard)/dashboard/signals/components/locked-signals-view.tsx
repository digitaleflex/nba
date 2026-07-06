"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, Button } from "@nba/design-system"
import { Lock, CheckCircle2, XCircle, Clock, AlertTriangle, ArrowRight, User, FileText, Landmark } from "lucide-react"
import Link from "next/link"

interface Step {
  id: string
  label: string
  status: string
}

interface LockedSignalsViewProps {
  statusData: {
    profileCompletion: number
    isProfileComplete: boolean
    kycStatus: string | null
    isKycSubmitted: boolean
    isKycApproved: boolean
    brokerStatus: string | null
    isBrokerSubmitted: boolean
    isBrokerApproved: boolean
    steps: Step[]
    isOnlyValidationPending: boolean
    targetActivationTime: number | null
  }
}

export function LockedSignalsView({ statusData }: LockedSignalsViewProps) {
  const [timeLeft, setTimeLeft] = useState<string>("")
  const [isExpired, setIsExpired] = useState(false)

  // Calcul du compte à rebours 24h
  useEffect(() => {
    if (!statusData.targetActivationTime) return

    const interval = setInterval(() => {
      const now = Date.now()
      const difference = statusData.targetActivationTime! - now

      if (difference <= 0) {
        clearInterval(interval)
        setIsExpired(true)
        setTimeLeft("00h 00m 00s")
      } else {
        const hours = Math.floor(difference / (1000 * 60 * 60))
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((difference % (1000 * 60)) / 1000)

        const formattedHours = String(hours).padStart(2, "0")
        const formattedMinutes = String(minutes).padStart(2, "0")
        const formattedSeconds = String(seconds).padStart(2, "0")

        setTimeLeft(`${formattedHours}h ${formattedMinutes}m ${formattedSeconds}s`)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [statusData.targetActivationTime])

  // Nombre d'étapes restantes à accomplir (soumissions nécessaires)
  const remainingStepsToSubmit = [
    statusData.isProfileComplete,
    statusData.isKycSubmitted,
    statusData.isBrokerSubmitted,
  ].filter((submitted) => !submitted).length

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 py-8">
      <Card className="w-full max-w-2xl bg-background/50 border border-border/80 backdrop-blur-xl shadow-2xl relative overflow-hidden rounded-2xl">
        {/* Effets de dégradés et lumières en arrière-plan */}
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

        <CardContent className="flex flex-col items-center p-8 md:p-12 text-center relative z-10">
          {/* Cadenas premium animé */}
          <div className="relative mb-6 group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-primary/50 rounded-full blur opacity-40 group-hover:opacity-70 transition duration-1000 group-hover:duration-200 animate-pulse" />
            <div className="relative flex items-center justify-center w-20 h-20 bg-card rounded-full border border-border">
              <Lock className="w-9 h-9 text-primary animate-bounce-subtle" />
            </div>
          </div>

          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-3">
            Accès aux Signaux Verrouillé
          </h2>
          <p className="text-muted-foreground max-w-md mb-8 text-sm md:text-base">
            Pour accéder aux signaux en temps réel, vous devez d'abord compléter votre onboarding et faire valider vos informations.
          </p>

          {/* Si toutes les étapes sont soumises mais en attente d'approbation */}
          {statusData.isOnlyValidationPending ? (
            <div className="w-full bg-primary/5 border border-primary/20 rounded-xl p-6 mb-8 text-center backdrop-blur-md">
              <Clock className="w-8 h-8 text-primary mx-auto mb-3 animate-spin-slow" />
              <h3 className="font-semibold text-lg text-primary mb-1">
                Activation en cours
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
                Nos administrateurs vérifient actuellement vos pièces d'identité et votre broker. Votre compte sera activé sous 24h.
              </p>
              
              <div className="inline-block px-4 py-2 bg-background border border-border/80 rounded-lg">
                <span className="text-xs text-muted-foreground block uppercase font-bold tracking-wider">
                  Temps d'attente estimé
                </span>
                <span className="text-2xl font-mono font-bold text-foreground">
                  {timeLeft || "24h 00m 00s"}
                </span>
              </div>
            </div>
          ) : (
            /* Liste des étapes restantes à compléter */
            <div className="w-full space-y-4 mb-8 text-left">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Votre progression ({3 - remainingStepsToSubmit}/3 étapes validées ou soumises)
              </h3>

              {/* ÉTAPE 1: Profil 100% */}
              <div className="flex items-center justify-between p-4 bg-card/40 border border-border/60 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground text-sm md:text-base">Profil utilisateur à 100%</h4>
                    <p className="text-xs text-muted-foreground">
                      {statusData.isProfileComplete ? "Profil complet" : `Complété à ${statusData.profileCompletion}%`}
                    </p>
                  </div>
                </div>
                {statusData.isProfileComplete ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                ) : (
                  <Link href="/onboarding/profile">
                    <Button size="sm" variant="outline" className="text-xs flex items-center space-x-1">
                      <span>Compléter</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                )}
              </div>

              {/* ÉTAPE 2: KYC */}
              <div className="flex items-center justify-between p-4 bg-card/40 border border-border/60 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground text-sm md:text-base font-sans">Vérification KYC</h4>
                    <p className="text-xs text-muted-foreground">
                      {statusData.kycStatus === "APPROVED" && "Validé par l'équipe"}
                      {statusData.kycStatus === "PENDING" && "En attente de validation"}
                      {statusData.kycStatus === "REJECTED" && "Document refusé (Veuillez resoumettre)"}
                      {!statusData.isKycSubmitted && "Non soumis"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {statusData.kycStatus === "APPROVED" && (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  )}
                  {statusData.kycStatus === "PENDING" && (
                    <Clock className="w-5 h-5 text-amber-500" />
                  )}
                  {statusData.kycStatus === "REJECTED" && (
                    <div className="flex items-center space-x-2">
                      <XCircle className="w-5 h-5 text-red-500" />
                      <Link href="/onboarding/kyc">
                        <Button size="sm" variant="destructive" className="text-xs">
                          Recommencer
                        </Button>
                      </Link>
                    </div>
                  )}
                  {!statusData.isKycSubmitted && (
                    <Link href="/onboarding/kyc">
                      <Button size="sm" variant="outline" className="text-xs flex items-center space-x-1">
                        <span>Soumettre</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  )}
                </div>
              </div>

              {/* ÉTAPE 3: Broker */}
              <div className="flex items-center justify-between p-4 bg-card/40 border border-border/60 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Landmark className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground text-sm md:text-base">Compte Broker</h4>
                    <p className="text-xs text-muted-foreground">
                      {statusData.brokerStatus === "APPROVED" && "Validé par l'équipe"}
                      {statusData.brokerStatus === "PENDING" && "En attente de validation"}
                      {statusData.brokerStatus === "REJECTED" && "Vérification refusée (Veuillez resoumettre)"}
                      {!statusData.isBrokerSubmitted && "Non soumis"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {statusData.brokerStatus === "APPROVED" && (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  )}
                  {statusData.brokerStatus === "PENDING" && (
                    <Clock className="w-5 h-5 text-amber-500" />
                  )}
                  {statusData.brokerStatus === "REJECTED" && (
                    <div className="flex items-center space-x-2">
                      <XCircle className="w-5 h-5 text-red-500" />
                      <Link href="/onboarding/broker">
                        <Button size="sm" variant="destructive" className="text-xs">
                          Recommencer
                        </Button>
                      </Link>
                    </div>
                  )}
                  {!statusData.isBrokerSubmitted && (
                    <Link href="/onboarding/broker">
                      <Button size="sm" variant="outline" className="text-xs flex items-center space-x-1">
                        <span>Soumettre</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Bouton de support ou aide */}
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4 text-xs text-muted-foreground">
            <span>Besoin d'aide ?</span>
            <a href="https://t.me/nba_support" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold flex items-center space-x-1">
              <span>Contacter le support sur Telegram</span>
            </a>
          </div>
        </CardContent>
      </Card>
      
      {/* Styles personnalisés pour micro-animations si besoin */}
      <style jsx global>{`
        @keyframes bounceSubtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .animate-bounce-subtle {
          animation: bounceSubtle 2s infinite ease-in-out;
        }
        @keyframes spinSlow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spinSlow 8s infinite linear;
        }
      `}</style>
    </div>
  )
}
