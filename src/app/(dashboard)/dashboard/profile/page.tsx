"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, Button, Input, Badge } from "@nba/design-system"
import { User, Mail, Phone, Globe, Clock, Loader2, Check, AlertCircle } from "lucide-react"

interface UserProfile {
  id: string
  name: string
  email: string
  emailVerified: boolean
  phone: string | null
  whatsapp: string | null
  country: string | null
  language: string
  timezone: string
  onboardingStatus: string
  role: { name: string }
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ name: "", phone: "", whatsapp: "" })

  useEffect(() => {
    fetch("/api/dashboard/profile")
      .then((r) => r.json())
      .then((data) => {
        setProfile(data.user)
        setForm({
          name: data.user.name,
          phone: data.user.phone || "",
          whatsapp: data.user.whatsapp || "",
        })
      })
      .catch(() => setError("Erreur de chargement"))
      .finally(() => setLoading(false))
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch("/api/dashboard/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error("Erreur")
      const data = await res.json()
      setProfile((p) => p ? { ...p, ...data.user } : null)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      setError("Erreur lors de la sauvegarde")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error && !profile) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Profil</h1>
        <Card className="border-destructive/30">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <AlertCircle className="size-10 text-destructive" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>Réessayer</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profil</h1>
        <p className="text-sm text-muted-foreground">Gérez vos informations personnelles</p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center gap-4 pb-4 border-b border-border/40">
            <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User className="size-7" />
            </div>
            <div className="space-y-0.5">
              <p className="font-semibold text-lg">{profile?.name}</p>
              <p className="text-sm text-muted-foreground">{profile?.email}</p>
              <Badge variant="outline" className="text-[10px] mt-1">
                {profile?.role.name}
              </Badge>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nom complet</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input className="pl-9" value={profile?.email || ""} disabled />
              </div>
              <p className="text-xs text-muted-foreground">
                {profile?.emailVerified ? "Email vérifié" : "Email non vérifié"}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Téléphone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+33 6 12 34 56 78"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">WhatsApp</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  value={form.whatsapp}
                  onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                  placeholder="+33 6 12 34 56 78"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Globe className="size-3.5" />
                  {profile?.country || "Pays non défini"}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="size-3.5" />
                  {profile?.timezone}
                </span>
              </div>
              <div className="flex items-center gap-3">
                {saved && (
                  <span className="flex items-center gap-1 text-xs text-success">
                    <Check className="size-3.5" />
                    Enregistré
                  </span>
                )}
                <Button type="submit" disabled={saving} size="sm">
                  {saving ? "Sauvegarde…" : "Enregistrer"}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
