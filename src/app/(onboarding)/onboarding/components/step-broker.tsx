"use client"

import { useState } from "react"
import { Button, Card, CardContent, Input } from "@nba/design-system"
import { Video, Upload, ArrowRight } from "lucide-react"

interface StepBrokerProps {
  onNext: () => void
}

export function StepBroker({ onNext }: StepBrokerProps) {
  const [brokerName, setBrokerName] = useState("")
  const [accountId, setAccountId] = useState("")
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

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
              <Input
                placeholder="Ex: Deriv, Forex.com..."
                value={brokerName}
                onChange={(e) => setBrokerName(e.target.value)}
                required
              />
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

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Vidéo de vérification</label>
              <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border p-6 text-sm text-muted-foreground hover:border-primary/50 transition-colors">
                <Upload className="size-6" />
                {videoFile ? videoFile.name : "Enregistrez ou téléchargez une courte vidéo"}
                <input
                  type="file"
                  accept="video/mp4,video/webm"
                  onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
                  className="hidden"
                  required
                />
              </label>
            </div>

            {error && (
              <p className="text-sm text-destructive flex items-center gap-1.5 bg-destructive/10 rounded-lg px-3 py-2">
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
