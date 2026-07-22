"use client"

import { useState, useEffect } from "react"
import { Button, Card, CardContent, Input } from "@nba/design-system"
import { Video, Upload, ArrowRight } from "lucide-react"
import { useOnboardingPersistence } from "../hooks/use-onboarding-persistence"

const VIDEO_GUIDELINES = [
  "Montrez votre visage clairement face caméra",
  "Énoncez distinctement votre nom et le numéro de compte broker",
  "Durée recommandée : entre 5 et 15 secondes",
  "Vidéo de bonne qualité, nette et bien éclairée",
]

interface StepBrokerProps {
  onNext: () => void
}

export function StepBroker({ onNext }: StepBrokerProps) {
  const { save, restore, clear } = useOnboardingPersistence()
  const [brokerName, setBrokerName] = useState("")
  const [accountId, setAccountId] = useState("")
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const saved = restore<{ brokerName: string; accountId: string }>("broker")
    if (saved) {
      setBrokerName(saved.brokerName ?? "")
      setAccountId(saved.accountId ?? "")
    }
  }, [])

  useEffect(() => {
    save("broker", { brokerName, accountId })
  }, [brokerName, accountId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!videoFile) {
      setError("Veuillez sélectionner une vidéo")
      return
    }

    setLoading(true)
    setError("")

    const form = new FormData()
    form.append("brokerName", brokerName)
    form.append("accountId", accountId)
    form.append("video", videoFile)

    const res = await fetch("/api/onboarding/broker", { method: "POST", body: form })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? "Erreur lors de l'envoi")
      setLoading(false)
      return
    }

    clear()
    onNext()
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
          <Video className="size-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Vérification Broker</h2>
          <p className="text-sm text-muted-foreground">
            Fournissez les informations de votre compte de trading
          </p>
        </div>
      </div>

      <Card size="sm" className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Nom du broker</label>
              <select
                value={brokerName}
                onChange={(e) => setBrokerName(e.target.value)}
                required
                className="h-9 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 text-foreground transition-all duration-200"
              >
                <option value="" disabled className="text-muted-foreground">Sélectionnez votre broker</option>
                <option value="Deriv">Deriv (Indices)</option>
                <option value="Exness">Exness</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Numéro de compte</label>
              <Input
                placeholder="Votre identifiant de compte"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                required
              />
            </div>

            {/* Consignes qualité vidéo */}
            <div className="rounded-lg bg-muted/30 p-3 space-y-1.5 border border-border/50">
              <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <Video className="size-3 text-primary" />
                Consignes pour une vidéo valide
              </p>
              <ul className="space-y-1">
                {VIDEO_GUIDELINES.map((g) => (
                  <li key={g} className="text-xs text-muted-foreground flex items-start gap-1.5">
                    <span className="text-primary/60 mt-0.5">•</span>
                    {g}
                  </li>
                ))}
              </ul>
              <p className="text-[10px] text-muted-foreground/70 mt-1">
                Formats autorisés : MP4, WebM | Taille max : 50 Mo
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Vidéo de vérification</label>
              <label
                className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border p-6 text-sm text-muted-foreground hover:border-primary/50 transition-colors"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.currentTarget.querySelector("input")?.click(); } }}
              >
                <Upload className="size-6" />
                {videoFile ? videoFile.name : "Enregistrez ou téléchargez une courte vidéo"}
                <input
                  type="file"
                  accept="video/mp4,video/webm"
                  onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
                  className="hidden"
                />
              </label>
            </div>

            {error && (
              <p role="alert" className="text-sm text-destructive flex items-center gap-1.5 bg-destructive/10 rounded-lg px-3 py-2">
                <span className="size-1.5 rounded-full bg-destructive shrink-0" />
                {error}
              </p>
            )}

            <Button type="submit" className="w-full h-9" disabled={loading}>
              {loading ? "Envoi en cours…" : "Envoyer"}
              <ArrowRight className="size-4" />
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  )
}
