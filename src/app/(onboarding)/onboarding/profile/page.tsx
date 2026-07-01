"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button, Card, CardContent, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@nba/design-system"
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
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger className="w-full h-8">
                  <SelectValue placeholder="Sélectionnez votre pays" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Langue</label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-full h-8">
                  <SelectValue placeholder="Sélectionnez votre langue" />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((l) => (
                    <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Fuseau horaire</label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger className="w-full h-8">
                  <SelectValue placeholder="Sélectionnez votre fuseau horaire" />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
