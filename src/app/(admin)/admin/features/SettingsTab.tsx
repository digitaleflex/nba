"use client"

import { useEffect, useState, useCallback } from "react"
import { Loader2, Plus, Trash2, GripVertical, Package } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, Input, Button, cn, EmptyState } from "@nba/design-system"
import { CachedGet } from "./types"

interface Plan {
  id: string
  name: string
  description: string | null
  price: number
  currency: string
  durationDays: number
  features: string[]
  sortOrder: number
  isActive: boolean
}

interface SettingsTabProps {
  cachedGet: CachedGet
}

export function SettingsTab({ cachedGet }: SettingsTabProps) {
  const [settings, setSettings] = useState({
    smtpHost: "", smtpPort: "", smtpTls: "", smtpUser: "", smtpPass: "", smtpFrom: "",
  })
  const [loadingSettings, setLoadingSettings] = useState(false)
  const [savingSettings, setSavingSettings] = useState(false)

  const [plans, setPlans] = useState<Plan[]>([])
  const [loadingPlans, setLoadingPlans] = useState(false)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [savingPlan, setSavingPlan] = useState(false)

  const fetchSettings = useCallback(async () => {
    setLoadingSettings(true)
    try {
      const { ok, data } = await cachedGet("/api/admin/settings")
      if (ok && data) {
        setSettings({
          smtpHost: data.smtp_host ?? "", smtpPort: data.smtp_port ?? "",
          smtpTls: data.smtp_tls ?? "", smtpUser: data.smtp_user ?? "",
          smtpPass: "", smtpFrom: data.smtp_from ?? "",
        })
      }
    } catch (err) { console.error(err) } finally { setLoadingSettings(false) }
  }, [cachedGet])

  const fetchPlans = useCallback(async () => {
    setLoadingPlans(true)
    try {
      const { ok, data } = await cachedGet("/api/admin/plans", 10000)
      if (ok) setPlans(data.plans ?? [])
    } catch (err) { console.error(err) } finally { setLoadingPlans(false) }
  }, [cachedGet])

  useEffect(() => { fetchSettings(); fetchPlans() }, [fetchSettings, fetchPlans])

  const handleSavePlan = async () => {
    if (!editingPlan) return
    setSavingPlan(true)
    try {
      const method = editingPlan.id.startsWith("new-") ? "POST" : "PUT"
      const url = method === "POST"
        ? "/api/admin/plans"
        : `/api/admin/plans/${editingPlan.id}`
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editingPlan.name,
          description: editingPlan.description,
          price: Number(editingPlan.price),
          currency: editingPlan.currency,
          durationDays: Number(editingPlan.durationDays),
          features: editingPlan.features.filter(f => f.trim()),
          sortOrder: Number(editingPlan.sortOrder),
          isActive: editingPlan.isActive,
        }),
      })
      if (res.ok) {
        toast.success("Plan enregistré")
        setEditingPlan(null)
        fetchPlans()
      } else {
        const err = await res.json()
        toast.error(err.error ?? "Erreur")
      }
    } catch { toast.error("Erreur réseau") } finally { setSavingPlan(false) }
  }

  const handleDeletePlan = async (id: string) => {
    if (!confirm("Supprimer ce plan ?")) return
    try {
      const res = await fetch(`/api/admin/plans/${id}`, { method: "DELETE" })
      if (res.ok) { toast.success("Plan supprimé"); fetchPlans() }
      else toast.error("Erreur")
    } catch { toast.error("Erreur réseau") }
  }

  const newPlan = (): Plan => ({
    id: `new-${Date.now()}`,
    name: "", description: null, price: 0, currency: "XOF",
    durationDays: 30, features: [], sortOrder: 0, isActive: true,
  })

  return (
    <div className="space-y-10 max-w-3xl">
      {/* ── SMTP ── */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-border/40 pb-5">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Paramètres système</h1>
            <p className="text-xs text-muted-foreground mt-1">Configuration SMTP et gestion des abonnements.</p>
          </div>
        </div>

        <Card className="border-border/60 bg-card shadow-sm">
          <CardContent className="p-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Configuration SMTP</h3>
            {loadingSettings ? (
              <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
            ) : (
              <>
                <div className="space-y-1.5"><label className="text-[10px] text-muted-foreground uppercase font-bold">Hôte SMTP</label><Input placeholder="smtp.exemple.com" className="bg-background border-border text-xs text-foreground" value={settings.smtpHost} onChange={(e) => setSettings((s) => ({ ...s, smtpHost: e.target.value }))} /></div>
                <div className="space-y-1.5"><label className="text-[10px] text-muted-foreground uppercase font-bold">Port</label><Input placeholder="587" className="bg-background border-border text-xs text-foreground" value={settings.smtpPort} onChange={(e) => setSettings((s) => ({ ...s, smtpPort: e.target.value }))} /></div>
                <div className="space-y-1.5"><label className="text-[10px] text-muted-foreground uppercase font-bold">Chiffrement</label><Input placeholder="tls / ssl / none" className="bg-background border-border text-xs text-foreground" value={settings.smtpTls} onChange={(e) => setSettings((s) => ({ ...s, smtpTls: e.target.value }))} /></div>
                <div className="space-y-1.5"><label className="text-[10px] text-muted-foreground uppercase font-bold">Utilisateur</label><Input placeholder="user@exemple.com" className="bg-background border-border text-xs text-foreground" value={settings.smtpUser} onChange={(e) => setSettings((s) => ({ ...s, smtpUser: e.target.value }))} /></div>
                <div className="space-y-1.5"><label className="text-[10px] text-muted-foreground uppercase font-bold">Mot de passe</label><Input type="password" placeholder="Laissé vide = inchangé" className="bg-background border-border text-xs text-foreground" value={settings.smtpPass} onChange={(e) => setSettings((s) => ({ ...s, smtpPass: e.target.value }))} /></div>
                <div className="space-y-1.5"><label className="text-[10px] text-muted-foreground uppercase font-bold">E-mail expéditeur</label><Input placeholder="noreply@exemple.com" className="bg-background border-border text-xs text-foreground" value={settings.smtpFrom} onChange={(e) => setSettings((s) => ({ ...s, smtpFrom: e.target.value }))} /></div>
                <Button variant="default" size="sm" className="cursor-pointer" disabled={savingSettings} onClick={async () => { setSavingSettings(true); try { const payload: Record<string, string> = { ...settings }; if (!payload.smtpPass) delete payload.smtpPass; const res = await fetch("/api/admin/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); if (res.ok) toast.success("Paramètres SMTP enregistrés."); else toast.error("Erreur.") } catch { toast.error("Erreur réseau") } finally { setSavingSettings(false) } }}>
                  {savingSettings ? <><Loader2 className="size-4 mr-2 animate-spin" />Enregistrement...</> : "Enregistrer"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Plans d'abonnement ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-foreground">Plans d&apos;abonnement</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Gérez les offres visibles par les membres.</p>
          </div>
          <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => setEditingPlan(newPlan())}>
            <Plus className="size-3.5 mr-1" />Ajouter
          </Button>
        </div>

        {loadingPlans ? (
          <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
        ) : plans.length === 0 ? (
          <EmptyState icon={Package} title="Aucun plan d'abonnement" description="Créez votre premier plan pour proposer des abonnements." action={{ label: "Ajouter un plan", onClick: () => setEditingPlan(newPlan()) }} />
        {loadingPlans ? (
          <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
        ) : plans.length === 0 ? (
          <EmptyState icon={Package} title="Aucun plan d'abonnement" description="Créez votre premier plan pour proposer des abonnements." action={{ label: "Ajouter un plan", onClick: () => setEditingPlan(newPlan()) }} />
        ) : (
          <div className="space-y-2">
            {plans.map((plan) => (
              <Card key={plan.id} className={cn("border-border/60 bg-card shadow-sm", !plan.isActive && "opacity-50")}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="min-w-0 flex-1 cursor-pointer" onClick={() => setEditingPlan({ ...plan })}>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm text-foreground">{plan.name}</p>
                      {!plan.isActive && <span className="text-[10px] text-muted-foreground">(inactif)</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {plan.price} {plan.currency} · {plan.durationDays} jours · ordre {plan.sortOrder}
                    </p>
                  </div>
                  <button onClick={() => handleDeletePlan(plan.id)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="size-4" />
                  </button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* ── Formulaire édition plan ── */}
      {editingPlan && (
        <Card className="border-primary/30 bg-card shadow-sm">
          <CardContent className="p-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {editingPlan.id.startsWith("new-") ? "Nouveau plan" : "Modifier le plan"}
            </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><label className="text-[10px] text-muted-foreground uppercase font-bold">Nom</label><Input className="bg-background border-border/60 text-xs" value={editingPlan.name} onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })} placeholder="Signals X Forex" /></div>
                  <div className="space-y-1"><label className="text-[10px] text-muted-foreground uppercase font-bold">Devise</label><Input className="bg-background border-border/60 text-xs" value={editingPlan.currency} onChange={(e) => setEditingPlan({ ...editingPlan, currency: e.target.value })} placeholder="XOF" /></div>
                  <div className="space-y-1"><label className="text-[10px] text-muted-foreground uppercase font-bold">Prix</label><Input className="bg-background border-border/60 text-xs" type="number" value={editingPlan.price} onChange={(e) => setEditingPlan({ ...editingPlan, price: Number(e.target.value) })} /></div>
                  <div className="space-y-1"><label className="text-[10px] text-muted-foreground uppercase font-bold">Durée (jours)</label><Input className="bg-background border-border/60 text-xs" type="number" value={editingPlan.durationDays} onChange={(e) => setEditingPlan({ ...editingPlan, durationDays: Number(e.target.value) })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><label className="text-[10px] text-muted-foreground uppercase font-bold">Ordre</label><Input className="bg-background border-border/60 text-xs" type="number" value={editingPlan.sortOrder} onChange={(e) => setEditingPlan({ ...editingPlan, sortOrder: Number(e.target.value) })} /></div>
                  <div className="space-y-1 flex items-end"><label className="flex items-center gap-2 text-xs cursor-pointer"><input type="checkbox" checked={editingPlan.isActive} onChange={(e) => setEditingPlan({ ...editingPlan, isActive: e.target.checked })} className="cursor-pointer" />Actif</label></div>
                </div>
                <div className="space-y-1"><label className="text-[10px] text-muted-foreground uppercase font-bold">Description</label><Input className="bg-background border-border/60 text-xs" value={editingPlan.description ?? ""} onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value || null })} placeholder="Optionnel" /></div>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground uppercase font-bold">Features + URL checkout (une par ligne, l'URL en dernier)</label>
                  <textarea
                    className="w-full rounded-lg border border-border/60 bg-background p-3 text-xs text-foreground min-h-24 resize-y focus:outline-none focus:border-primary/50"
                value={editingPlan.features.join("\n")}
                onChange={(e) => setEditingPlan({ ...editingPlan, features: e.target.value.split("\n") })}
                placeholder={`Essentiel\nForex\nSignaux trading forex premium\nhttps://signaux.mymaketou.shop/products/signaux-x/checkout`}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="default" size="sm" className="cursor-pointer" disabled={savingPlan || !editingPlan.name} onClick={handleSavePlan}>
                {savingPlan ? <Loader2 className="size-4 animate-spin" /> : "Sauvegarder"}
              </Button>
              <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => setEditingPlan(null)}>Annuler</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
