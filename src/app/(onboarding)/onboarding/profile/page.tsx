"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button, Card, CardContent } from "@nba/design-system"
import { User, ArrowRight } from "lucide-react"

const COUNTRIES = [
  "France", "Belgique", "Suisse", "Canada", "Luxembourg",
  "Maroc", "Algérie", "Tunisie", "Sénégal", "Côte d'Ivoire",
]

const LANGUAGES = [
  { value: "fr", label: "Français" },
  { value: "en", label: "English" },
]

const TIMEZONES = [
  "Europe/Paris",
  "Europe/Brussels",
  "Europe/Zurich",
  "America/Montreal",
  "Africa/Casablanca",
  "Africa/Abidjan",
]

export default function ProfilePage() {
  const router = useRouter()
  const [country, setCountry] = useState("")
  const [language, setLanguage] = useState("fr")
  const [timezone, setTimezone] = useState("Europe/Paris")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    await fetch("/api/onboarding/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ country, language, timezone }),
    })

    router.push("/onboarding/kyc")
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
          <User className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-semibold">Compléter votre profil</h1>
          <p className="text-sm text-muted-foreground">Quelques informations pour personnaliser votre expérience</p>
        </div>
      </div>

      <Card size="sm" className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Pays</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                required
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
              >
                <option value="">Sélectionnez votre pays</option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Langue</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Fuseau horaire</label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>

            <Button type="submit" className="w-full h-9" disabled={loading}>
              {loading ? "Enregistrement…" : "Continuer"}
              <ArrowRight className="size-4" />
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  )
}
