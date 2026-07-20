"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, Button, Input, Badge, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@nba/design-system"
import {
  User, Mail, Phone, Globe, Loader2, Check, AlertCircle,
  Lock, Trash2, Eye, EyeOff, Shield, MapPin, Languages, Camera
} from "lucide-react"
import countries from "@nba/lib/countries.json"
import { toast } from "sonner"
import { Avatar, AvatarImage, AvatarFallback } from "@nba/design-system"

interface UserProfile {
  id: string
  name: string
  email: string
  emailVerified: boolean
  phone: string | null
  whatsapp: string | null
  image: string | null
  country: string | null
  language: string
  onboardingStatus: string
  role: { name: string }
}

const COUNTRIES = countries.map((c) => c.name)

const LANGUAGES = [
  { value: "fr", label: "Français" },
  { value: "en", label: "English" },
  { value: "ar", label: "العربية" },
]

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Avatar
  const [avatarUploading, setAvatarUploading] = useState(false)

  // Profile form
  const [form, setForm] = useState({
    name: "", phone: "", whatsapp: "", country: "", language: "fr"
  })

  // Password form
  const [showPasswordSection, setShowPasswordSection] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ current: "", new: "", confirm: "" })
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false })
  const [changingPassword, setChangingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSaved, setPasswordSaved] = useState(false)

  // Email form
  const [showEmailSection, setShowEmailSection] = useState(false)
  const [emailForm, setEmailForm] = useState({ newEmail: "" })
  const [changingEmail, setChangingEmail] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [emailSaved, setEmailSaved] = useState(false)

  // Delete account
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletePassword, setDeletePassword] = useState("")
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/dashboard/profile")
      .then((r) => { if (!r.ok) throw new Error("Erreur de chargement"); return r.json() })
      .then((data) => {
        if (!data.user) return
        setProfile(data.user)
        setForm({
          name: data.user.name ?? "",
          phone: data.user.phone || "",
          whatsapp: data.user.whatsapp || "",
          country: data.user.country || "",
          language: data.user.language || "fr",
        })
      })
      .catch(() => setError("Erreur de chargement"))
      .finally(() => setLoading(false))
  }, [])

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setAvatarUploading(true)
    try {
      const formData = new FormData()
      formData.append("avatar", file)
      const res = await fetch("/api/dashboard/avatar", {
        method: "POST",
        body: formData,
      })
      if (!res.ok) throw new Error("Erreur")
      const data = await res.json()
      setProfile((p) => p ? { ...p, image: data.path } : null)
    } catch {
      setError("Erreur lors du téléchargement")
    } finally {
      setAvatarUploading(false)
    }
  }

  async function handleAvatarDelete() {
    try {
      const res = await fetch("/api/dashboard/avatar", { method: "DELETE" })
      if (!res.ok) throw new Error("Erreur")
      setProfile((p) => p ? { ...p, image: null } : null)
    } catch {
      setError("Erreur lors de la suppression")
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
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

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setPasswordError(null)

    if (passwordForm.new !== passwordForm.confirm) {
      setPasswordError("Les mots de passe ne correspondent pas")
      return
    }
    if (passwordForm.new.length < 8) {
      setPasswordError("Le mot de passe doit contenir au moins 8 caractères")
      return
    }

    setChangingPassword(true)
    try {
      const res = await fetch("/api/dashboard/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: passwordForm.current, newPassword: passwordForm.new }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erreur")
      setPasswordForm({ current: "", new: "", confirm: "" })
      setPasswordSaved(true)
      setTimeout(() => setPasswordSaved(false), 2000)
    } catch (err: any) {
      setPasswordError(err.message)
    } finally {
      setChangingPassword(false)
    }
  }

  async function handleChangeEmail(e: React.FormEvent) {
    e.preventDefault()
    setEmailError(null)

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(emailForm.newEmail)) {
      setEmailError("Format d'email invalide")
      return
    }

    setChangingEmail(true)
    try {
      const res = await fetch("/api/dashboard/change-email", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newEmail: emailForm.newEmail }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erreur")
      setEmailForm({ newEmail: "" })
      setEmailSaved(true)
      if (data.user) setProfile((p) => p ? { ...p, email: data.user.email } : null)
      setTimeout(() => setEmailSaved(false), 2000)
    } catch (err: any) {
      setEmailError(err.message)
    } finally {
      setChangingEmail(false)
    }
  }

  async function handleDeleteAccount() {
    setDeleteError(null)
    setDeleting(true)
    try {
      const res = await fetch("/api/dashboard/delete-account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePassword }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erreur")
      toast.success("Votre compte a bien été supprimé.")
      // Redirection vers une page explicative plutôt qu'un /login brut.
      window.location.href = "/blocked?status=deleted"
    } catch (err: any) {
      setDeleteError(err.message)
    } finally {
      setDeleting(false)
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
            <p role="alert" className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>Réessayer</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profil</h1>
        <p className="text-sm text-muted-foreground">Gérez vos informations personnelles et la sécurité de votre compte</p>
      </div>

      {/* Profile Info Card */}
      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center gap-4 pb-4 border-b border-border/40">
            <div className="relative group">
              <Avatar size="lg">
                {profile?.image ? (
                  <AvatarImage src={`/api/files/${profile.image}`} alt={profile.name} />
                ) : null}
                <AvatarFallback>
                  {profile?.name?.charAt(0).toUpperCase() || <User className="size-5" />}
                </AvatarFallback>
              </Avatar>
              <label
                htmlFor="avatar-upload"
                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
              >
                {avatarUploading ? (
                  <Loader2 className="size-4 animate-spin text-white" />
                ) : (
                  <Camera className="size-4 text-white" />
                )}
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
                disabled={avatarUploading}
              />
              {profile?.image && (
                <button
                  type="button"
                  onClick={handleAvatarDelete}
                  className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs hover:bg-destructive/90 transition-colors"
                  title="Supprimer l'avatar"
                >
                  ×
                </button>
              )}
            </div>
            <div className="space-y-0.5">
              <p className="font-semibold text-lg">{profile?.name}</p>
              <p className="text-sm text-muted-foreground">{profile?.email}</p>
              <Badge variant="outline" className="text-[10px] mt-1">
                {profile?.role?.name}
              </Badge>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">Nom complet</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="name"
                  className="pl-9"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="email-display" className="text-sm font-medium">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input id="email-display" className="pl-9" value={profile?.email || ""} disabled />
              </div>
              <p className="text-xs text-muted-foreground">
                {profile?.emailVerified ? "Email vérifié" : "Email non vérifié"}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium">Téléphone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    className="pl-9"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+33 6 12 34 56 78"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="whatsapp" className="text-sm font-medium">WhatsApp</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="whatsapp"
                    className="pl-9"
                    value={form.whatsapp}
                    onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                    placeholder="+33 6 12 34 56 78"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="country" className="text-sm font-medium flex items-center gap-1.5">
                  <MapPin className="size-3.5" /> Pays
                </label>
                <select
                  id="country"
                  className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                >
                  <option value="">Sélectionner...</option>
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="language" className="text-sm font-medium flex items-center gap-1.5">
                  <Languages className="size-3.5" /> Langue
                </label>
                <select
                  id="language"
                  className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={form.language}
                  onChange={(e) => setForm({ ...form, language: e.target.value })}
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end pt-2">
              <div className="flex items-center gap-3">
                {saved && (
                  <span className="flex items-center gap-1 text-xs text-success">
                    <Check className="size-3.5" />
                    Enregistré
                  </span>
                )}
                <Button type="submit" disabled={saving} size="sm">
                  {saving ? <><Loader2 className="size-4 mr-2 animate-spin" /> Sauvegarde...</> : "Enregistrer"}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Change Password Card */}
      <Card>
        <CardContent className="p-6">
          <button
            type="button"
            onClick={() => setShowPasswordSection(!showPasswordSection)}
            className="w-full flex items-center justify-between text-left"
            aria-expanded={showPasswordSection}
          >
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-warning/10">
                <Lock className="size-5 text-warning" />
              </div>
              <div>
                <p className="font-semibold text-sm">Changer de mot de passe</p>
                <p className="text-xs text-muted-foreground">Modifiez votre mot de passe de connexion</p>
              </div>
            </div>
            <span className="text-muted-foreground text-xs">{showPasswordSection ? "▲" : "▼"}</span>
          </button>

          {showPasswordSection && (
            <form onSubmit={handleChangePassword} className="mt-6 space-y-4 border-t border-border/40 pt-4">
              <div className="space-y-2">
                <label htmlFor="current-password" className="text-sm font-medium">Mot de passe actuel</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="current-password"
                    type={showPasswords.current ? "text" : "password"}
                    className="pl-9 pr-10"
                    value={passwordForm.current}
                    onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPasswords.current ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  >
                    {showPasswords.current ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="new-password" className="text-sm font-medium">Nouveau mot de passe</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="new-password"
                    type={showPasswords.new ? "text" : "password"}
                    className="pl-9 pr-10"
                    value={passwordForm.new}
                    onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                    required
                    minLength={10}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPasswords.new ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  >
                    {showPasswords.new ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-muted-foreground">Minimum 8 caractères</p>
              </div>

              <div className="space-y-2">
                <label htmlFor="confirm-password" className="text-sm font-medium">Confirmer le mot de passe</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="confirm-password"
                    type={showPasswords.confirm ? "text" : "password"}
                    className="pl-9 pr-10"
                    value={passwordForm.confirm}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPasswords.confirm ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  >
                    {showPasswords.confirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {passwordError && (
                <p role="alert" className="text-xs text-destructive font-medium">{passwordError}</p>
              )}
              {passwordSaved && (
                <p className="text-xs text-success font-medium flex items-center gap-1">
                  <Check className="size-3.5" /> Mot de passe modifié avec succès
                </p>
              )}

              <Button type="submit" disabled={changingPassword} size="sm">
                {changingPassword ? <><Loader2 className="size-4 mr-2 animate-spin" /> Modification...</> : "Modifier le mot de passe"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Change Email Card */}
      <Card>
        <CardContent className="p-6">
          <button
            type="button"
            onClick={() => setShowEmailSection(!showEmailSection)}
            className="w-full flex items-center justify-between text-left"
            aria-expanded={showEmailSection}
          >
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                <Mail className="size-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">Changer d'email</p>
                <p className="text-xs text-muted-foreground">Modifiez votre adresse email de connexion</p>
              </div>
            </div>
            <span className="text-muted-foreground text-xs">{showEmailSection ? "▲" : "▼"}</span>
          </button>

          {showEmailSection && (
            <form onSubmit={handleChangeEmail} className="mt-6 space-y-4 border-t border-border/40 pt-4">
              <div className="space-y-2">
                <label htmlFor="new-email" className="text-sm font-medium">Nouvel email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="new-email"
                    type="email"
                    className="pl-9"
                    value={emailForm.newEmail}
                    onChange={(e) => setEmailForm({ newEmail: e.target.value })}
                    required
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">Un email de vérification sera envoyé à la nouvelle adresse</p>
              </div>

              {emailError && (
                <p role="alert" className="text-xs text-destructive font-medium">{emailError}</p>
              )}
              {emailSaved && (
                <p className="text-xs text-success font-medium flex items-center gap-1">
                  <Check className="size-3.5" /> Email modifié avec succès
                </p>
              )}

              <Button type="submit" disabled={changingEmail} size="sm">
                {changingEmail ? <><Loader2 className="size-4 mr-2 animate-spin" /> Modification...</> : "Modifier l'email"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Danger Zone Card */}
      <Card className="border-destructive/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-destructive/10">
                <Trash2 className="size-5 text-destructive" />
              </div>
              <div>
                <p className="font-semibold text-sm text-destructive">Zone dangereuse</p>
                <p className="text-xs text-muted-foreground">Supprimer définitivement votre compte</p>
              </div>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
            >
              Supprimer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Account Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="size-5" />
              Supprimer mon compte
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Cette action est <strong>irréversible</strong>. Toutes vos données seront supprimées définitivement.
            </p>

            <div className="space-y-2">
              <label htmlFor="delete-password" className="text-sm font-medium">Entrez votre mot de passe pour confirmer</label>
              <Input
                id="delete-password"
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Mot de passe"
              />
            </div>

            {deleteError && (
              <p role="alert" className="text-xs text-destructive font-medium">{deleteError}</p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDeleteDialog(false); setDeletePassword(""); setDeleteError(null) }}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={!deletePassword || deleting}
            >
              {deleting ? <><Loader2 className="size-4 mr-2 animate-spin" /> Suppression...</> : "Supprimer définitivement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
