"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, Button, Input } from "@nba/design-system"
import { Database, Download, Trash2, ShieldAlert, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

interface UserData {
  id: string
  name: string
  email: string
  emailVerified: boolean
  phone: string | null
  whatsapp: string | null
  country: string | null
  language: string | null
  role: { name: string } | null
}

export default function DataPage() {
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)

  const [showDelete, setShowDelete] = useState(false)
  const [deletePassword, setDeletePassword] = useState("")
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/dashboard/profile")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setUser(d.user))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleExport() {
    try {
      const res = await fetch("/api/dashboard/profile")
      if (!res.ok) throw new Error()
      const data = await res.json()
      const blob = new Blob([JSON.stringify(data.user, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "mes-donnees-nba.json"
      a.click()
      URL.revokeObjectURL(url)
      toast.success("Export de vos données généré.")
    } catch {
      toast.error("Impossible de générer l'export.")
    }
  }

  async function handleDelete() {
    setDeleteError(null)
    if (!deletePassword) {
      setDeleteError("Mot de passe requis pour supprimer le compte.")
      return
    }
    setDeleting(true)
    try {
      const res = await fetch("/api/dashboard/delete-account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePassword }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setDeleteError(data.error ?? "Échec de la suppression.")
        setDeleting(false)
        return
      }
      toast.success("Compte supprimé. Redirection…")
      window.location.href = "/blocked?status=deleted"
    } catch {
      setDeleteError("Erreur lors de la suppression.")
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto py-8">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/profile" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="size-5" />
        </Link>
        <div className="flex items-center gap-2">
          <Database className="size-5 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Mes données</h1>
        </div>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-6 space-y-5 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold mb-2">Vos droits (RGPD)</h2>
            <p className="text-muted-foreground">
              Conformément au RGPD, vous pouvez à tout moment accéder à vos données, les exporter
              et demander leur suppression définitive. La suppression est irréversible et
              anonymise votre compte.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">Données vous concernant</h2>
            {loading ? (
              <p className="text-muted-foreground">Chargement…</p>
            ) : user ? (
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li><strong className="text-foreground">Identité :</strong> {user.name}</li>
                <li><strong className="text-foreground">Email :</strong> {user.email} {user.emailVerified ? "(vérifié)" : "(non vérifié)"}</li>
                <li><strong className="text-foreground">WhatsApp :</strong> {user.whatsapp ?? "—"}</li>
                <li><strong className="text-foreground">Téléphone :</strong> {user.phone ?? "—"}</li>
                <li><strong className="text-foreground">Pays :</strong> {user.country ?? "—"}</li>
                <li><strong className="text-foreground">Rôle :</strong> {user.role?.name ?? "membre"}</li>
              </ul>
            ) : (
              <p className="text-muted-foreground">Impossible de charger vos données.</p>
            )}
          </section>

          <section className="flex flex-col gap-3 sm:flex-row">
            <Button variant="outline" onClick={handleExport} disabled={loading}>
              <Download className="size-4" /> Exporter mes données (JSON)
            </Button>
          </section>
        </CardContent>
      </Card>

      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="p-6 space-y-4 text-sm leading-relaxed">
          <div className="flex items-center gap-2">
            <ShieldAlert className="size-5 text-destructive" />
            <h2 className="text-lg font-semibold text-destructive">Supprimer mon compte</h2>
          </div>
          <p className="text-muted-foreground">
            La suppression est définitive et anonymise vos données personnelles. Vous serez
            déconnecté immédiatement. Cette action nécessite votre mot de passe.
          </p>

          {!showDelete ? (
            <Button variant="destructive" onClick={() => setShowDelete(true)}>
              <Trash2 className="size-4" /> Supprimer mon compte
            </Button>
          ) : (
            <div className="space-y-3">
              <Input
                type="password"
                placeholder="Votre mot de passe"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
              />
              {deleteError && <p className="text-destructive text-xs">{deleteError}</p>}
              <div className="flex gap-3">
                <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                  {deleting ? "Suppression…" : "Confirmer la suppression"}
                </Button>
                <Button variant="outline" onClick={() => { setShowDelete(false); setDeletePassword(""); setDeleteError(null) }}>
                  Annuler
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
