"use client"

import { useEffect, useState, useCallback } from "react"
import { Search, X, ToggleLeft, ToggleRight, Trash2, Ban, Mail, MoreHorizontal, Eye, Shield, RotateCw, Radio, ChevronLeft, ChevronRight, Inbox, Download, Bell, BellOff, Loader2, User, Phone, Calendar, Layers, CheckCircle2, XCircle, AlertTriangle, RefreshCw, Eraser } from "lucide-react"
import { Card, CardContent, Badge, Button, cn, EmptyState, DualRender, FilterSheet } from "@nba/design-system"
import { useConfirm } from "@nba/components/confirm-dialog"
import { BatchActionsBar } from "../components/batch-actions-bar"
import { toast } from "sonner"
import { CachedGet } from "./types"
import { ONBOARDING_STATUS_LABELS, EMAIL_STATUS_LABELS } from "@nba/lib/labels"
import { StatusBadge, type Tone } from "./ui"

interface MembresTabProps {
  cachedGet: CachedGet
  invalidate: () => void
}

export function MembresTab({ cachedGet, invalidate }: MembresTabProps) {
  const { confirm, node: confirmNode } = useConfirm()

  const [membres, setMembres] = useState<any[]>([])
  const [plans, setPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState(false)

  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [planFilter, setPlanFilter] = useState("")
  const [onboardingFilter, setOnboardingFilter] = useState("")

  // Pagination
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 20

  // Batch selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      const allSelected = membres.every((m: any) => prev.has(m.id))
      if (allSelected) {
        return new Set(Array.from(prev).filter((id) => !membres.some((m: any) => m.id === id)))
      }
      const next = new Set(prev)
      membres.forEach((m: any) => next.add(m.id))
      return next
    })
  }, [membres])

  const clearSelection = useCallback(() => setSelectedIds(new Set()), [])

  const fetchPlans = useCallback(async () => {
    const { ok, data } = await cachedGet("/api/public/plans")
    if (ok) setPlans(Array.isArray(data) ? data : [])
  }, [cachedGet])

  const fetchMembres = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.set("q", searchQuery)
      if (statusFilter) params.set("status", statusFilter)
      if (planFilter) params.set("planId", planFilter)
      if (onboardingFilter) params.set("onboarding", onboardingFilter)
      params.set("page", String(page))
      params.set("limit", String(limit))
      const { ok, data } = await cachedGet(`/api/admin/members?${params}`)
      if (ok) {
        setMembres(data.members || [])
        setTotal(data.total || 0)
        setLoadError(false)
      } else {
        setLoadError(true)
      }
    } catch (err) {
      console.error(err)
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }, [cachedGet, searchQuery, statusFilter, planFilter, onboardingFilter, page])

  useEffect(() => { fetchPlans() }, [fetchPlans])
  useEffect(() => { fetchMembres() }, [fetchMembres])

  const [updating, setUpdating] = useState<string | null>(null)

  // Cleanup des accès fantômes (inactifs/supprimés avec access APPROVED)
  const [cleanupLoading, setCleanupLoading] = useState(false)
  const [cleanupPreview, setCleanupPreview] = useState<{
    usersAffected: number
    accessRequestsRevoked: number
    ghostUsers: { email: string; name: string; reason: string }[]
  } | null>(null)

  async function previewCleanup() {
    setCleanupLoading(true)
    try {
      const res = await fetch("/api/admin/access/cleanup?dryRun=1", { method: "POST" })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Erreur")
      const data = await res.json()
      setCleanupPreview({
        usersAffected: data.usersAffected,
        accessRequestsRevoked: data.accessRequestsRevoked,
        ghostUsers: data.ghostUsers,
      })
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur lors du nettoyage.")
    } finally {
      setCleanupLoading(false)
    }
  }

  async function runCleanup() {
    setCleanupLoading(true)
    try {
      const res = await fetch("/api/admin/access/cleanup", { method: "POST" })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Erreur")
      const data = await res.json()
      toast.success(
        `${data.accessRequestsRevoked} accès révoqués sur ${data.usersAffected} membre(s) fantôme(s)`,
        { duration: 6000 },
      )
      setCleanupPreview(null)
      invalidate()
      fetchMembres()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur lors du nettoyage.")
    } finally {
      setCleanupLoading(false)
    }
  }

  async function updateMember(userId: string, data: Record<string, unknown>) {
    setUpdating(userId)
    try {
      const res = await fetch("/api/admin/members", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ...data }),
      })
      if (res.ok) {
        invalidate()
        fetchMembres()
        const label = "isActive" in data ? (data.isActive ? "réactivé" : "suspendu") : "mis à jour"
        toast.success(`Membre ${label}`)
      } else {
        toast.error("Erreur lors de la mise à jour")
      }
    } catch {
      toast.error("Impossible de contacter le serveur. Vérifiez votre connexion.")
    } finally {
      setUpdating(null)
    }
  }

  async function deleteMember(userId: string) {
    confirm({
      title: "Supprimer définitivement ce membre ?",
      description: "Il perdra toutes ses données, accès aux signaux et à son compte. Action irréversible.",
      confirmLabel: "Supprimer",
      onConfirm: async () => {
        setUpdating(userId)
        try {
          const res = await fetch(`/api/admin/members?userId=${userId}`, { method: "DELETE" })
          if (res.ok) { invalidate(); fetchMembres(); toast.success("Membre supprimé") }
          else toast.error("Erreur lors de la suppression")
        } catch {
          toast.error("Impossible de contacter le serveur. Vérifiez votre connexion.")
        } finally {
          setUpdating(null)
        }
      },
    })
  }

  async function banMember(email: string) {
    confirm({
      title: `Bannir ${email} ?`,
      description: "Le compte sera supprimé et l'email blacklisté — il ne pourra plus se reconnecter sous aucun nom. Action permanente et irréversible.",
      confirmLabel: "Bannir",
      onConfirm: async () => {
        setUpdating(email)
        try {
          const res = await fetch("/api/admin/moderation/bans", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, reason: "Banni depuis MembresTab" }),
          })
          if (res.ok) { invalidate(); fetchMembres(); toast.success(`${email} banni et blacklisté`) }
          else toast.error("Erreur lors du bannissement")
        } catch {
          toast.error("Impossible de contacter le serveur. Vérifiez votre connexion.")
        } finally {
          setUpdating(null)
        }
      },
    })
  }

  async function revokeSessions(userId: string) {
    confirm({
      title: "Révoquer toutes les sessions ?",
      description: "Le membre sera déconnecté partout et devra se reconnecter.",
      confirmLabel: "Révoquer",
      onConfirm: async () => {
        setUpdating(userId)
        try {
          const res = await fetch("/api/admin/members/revoke-sessions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId }),
          })
          if (res.ok) {
            toast.success("Sessions révoquées")
          } else {
            toast.error("Échec de l'action. Réessayez.")
          }
        } catch {
          toast.error("Impossible de contacter le serveur. Vérifiez votre connexion.")
        } finally {
          setUpdating(null)
        }
      },
    })
  }

  function resetFilters() {
    setSearchQuery("")
    setStatusFilter("")
    setPlanFilter("")
    setOnboardingFilter("")
    setPage(1)
  }

  const [purgingCache, setPurgingCache] = useState(false)

  async function purgeCacheAndReload() {
    setPurgingCache(true)
    try {
      const res = await fetch("/api/admin/cache/purge", { method: "POST" })
      if (!res.ok) throw new Error()
      const d = await res.json()
      invalidate()
      await fetchMembres()
      toast.success(`Cache purgé (${d.purged} préfixes)`)
    } catch {
      toast.error("Erreur lors de la purge du cache")
    } finally {
      setPurgingCache(false)
    }
  }

  const totalPages = Math.ceil(total / limit)
  const hasFilters = searchQuery || statusFilter || planFilter || onboardingFilter

  function exportExcel() {
    const rows = membres.map((m: any) => [
      m.name || "",
      m.email || "",
      m.phone || "",
      m.country || "",
      m.emailStatus || "OK",
      m.plan?.name || "",
      m.onboardingStatus || "",
      m.isActive ? "Oui" : "Non",
      new Date(m.createdAt).toLocaleDateString("fr-FR"),
    ])
    const headers = ["Nom", "Email", "Téléphone", "Pays", "Statut email", "Plan", "Onboarding", "Actif", "Créé le"]

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="header">
   <Font ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#1E3A5F" ss:Pattern="Solid"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Membres">
  <Table>`
    xml += `\n   <Row>`
    headers.forEach((h) => { xml += `<Cell ss:StyleID="header"><Data ss:Type="String">${h.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</Data></Cell>` })
    xml += `</Row>`
    rows.forEach((r) => {
      xml += `\n   <Row>`
      r.forEach((c: string) => { xml += `<Cell><Data ss:Type="String">${String(c).replace(/&/g, "&amp;").replace(/</g, "&lt;")}</Data></Cell>` })
      xml += `</Row>`
    })
    xml += `
  </Table>
 </Worksheet>
</Workbook>`

    const blob = new Blob([xml], { type: "application/vnd.ms-excel" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `membres-${new Date().toISOString().slice(0, 10)}.xls`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {confirmNode}
      <div className="flex items-center justify-between border-b border-border/40 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Membres</h1>
          <p className="text-xs text-muted-foreground mt-1">Gestion des membres et de leurs abonnements</p>
        </div>
        {membres.length > 0 && (
          <button
            onClick={exportExcel}
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Exporter en Excel"
          >
            <Download className="size-3.5" />
            <span className="hidden sm:inline">Exporter</span>
          </button>
        )}
      </div>

      {/* Modale de confirmation du cleanup fantômes */}
      {cleanupPreview && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="size-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold">
                  {cleanupPreview.usersAffected === 0
                    ? "Aucun accès fantôme détecté"
                    : `${cleanupPreview.accessRequestsRevoked} accès à révoquer sur ${cleanupPreview.usersAffected} membre(s) fantôme(s)`}
                </p>
                {cleanupPreview.usersAffected > 0 && (
                  <div className="mt-2 max-h-40 overflow-y-auto rounded-md border bg-background/50 text-xs" role="region" aria-label="Contenu défilant">
                    <table className="w-full">
                      <thead className="bg-muted/40 text-muted-foreground">
                        <tr>
                          <th className="text-left px-2 py-1 font-medium">Email</th>
                          <th className="text-left px-2 py-1 font-medium">Nom</th>
                          <th className="text-left px-2 py-1 font-medium">Raison</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cleanupPreview.ghostUsers.map((u) => (
                          <tr key={u.email} className="border-t">
                            <td className="px-2 py-1 font-mono">{u.email}</td>
                            <td className="px-2 py-1">{u.name}</td>
                            <td className="px-2 py-1 text-amber-700">{u.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  Les accès APPROVED seront passés en REVOKED. Les autres données (KYC, profil,
                  notifications) sont conservées. Action journalisée.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-3">
              <Button variant="ghost" size="sm" onClick={() => setCleanupPreview(null)} disabled={cleanupLoading}>
                Annuler
              </Button>
              <Button
                size="sm"
                disabled={cleanupLoading || cleanupPreview.usersAffected === 0}
                onClick={runCleanup}
              >
                {cleanupLoading ? <Loader2 className="size-3.5 animate-spin" /> : "Révoquer les accès"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search + Filters row */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1) }}
            placeholder="Nom, email ou téléphone..."
            className="h-9 w-full rounded-lg border border-border/60 bg-background pl-8 pr-3 text-xs outline-none focus:border-primary/50"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer">
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <button
          onClick={purgeCacheAndReload}
          disabled={purgingCache}
          title="Vider le cache et recharger immédiatement"
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border/60 bg-background text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors cursor-pointer disabled:opacity-50"
        >
          {purgingCache ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
          Vider le cache
        </button>
        <button
          onClick={previewCleanup}
          disabled={cleanupLoading}
          title="Révoquer les accès des membres inactifs ou supprimés"
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border/60 bg-background text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors cursor-pointer disabled:opacity-50"
        >
          {cleanupLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Eraser className="size-3.5" />}
          Nettoyer accès fantômes
        </button>
        <Button
          onClick={() => fetchMembres()}
          title="Actualiser la liste"
          className="h-9 px-3"
        >
          Actualiser
        </Button>

        <FilterSheet
          groups={[
            {
              id: "status",
              label: "Statut",
              options: [
                { value: "active", label: "Actif" },
                { value: "inactive", label: "Inactif" },
              ],
              value: statusFilter,
              onChange: (v) => { setStatusFilter(v); setPage(1) },
            },
            {
              id: "onboarding",
              label: "Onboarding",
              options: [
                { value: "PENDING", label: "En attente" },
                { value: "IN_PROGRESS", label: "En cours" },
                { value: "COMPLETED", label: "Terminé" },
              ],
              value: onboardingFilter,
              onChange: (v) => { setOnboardingFilter(v); setPage(1) },
            },
            {
              id: "plan",
              label: "Abonnement",
              options: plans.map((p: any) => ({ value: p.id, label: p.name })),
              value: planFilter,
              onChange: (v) => { setPlanFilter(v); setPage(1) },
            },
          ]}
          activeCount={[statusFilter, onboardingFilter, planFilter].filter(Boolean).length}
          onReset={resetFilters}
        />
      </div>

      {/* Batch actions bar */}
      <BatchActionsBar selectedIds={selectedIds} onClear={clearSelection} onSuccess={() => fetchMembres()} plans={plans} />

      {/* Table (desktop) / Cards (mobile) */}
      <DualRender
        desktop={
          <Card className="border-border/60 bg-card shadow-sm">
            <div className="overflow-x-auto md:overflow-x-visible" role="region" aria-label="Contenu défilant">
              <table className="admin-table w-full min-w-[780px] text-xs text-left">
                <thead className="sticky top-0 z-10 bg-card shadow-[0_1px_0_0_hsl(var(--border))]">
                  <tr className="border-b border-border/40 text-muted-foreground font-bold uppercase tracking-wider text-xs">
                    <th className="px-2 py-3 w-8">
                      <input
                        type="checkbox"
                        checked={membres.length > 0 && membres.every((m: any) => selectedIds.has(m.id))}
                        onChange={toggleSelectAll}
                        className="size-3.5 rounded border-border accent-primary cursor-pointer"
                        aria-label="Sélectionner tous les membres"
                      />
                    </th>
                    <th className="px-4 py-3">Membre</th>
                    <th className="px-4 py-3 hidden md:table-cell">Contact</th>
                    <th className="px-4 py-3 hidden md:table-cell">Email</th>
                    <th className="px-4 py-3 hidden lg:table-cell">Push</th>
                    <th className="px-4 py-3">Abonnement(s)</th>
                    <th className="px-4 py-3 hidden md:table-cell">Onboarding</th>
                    <th className="px-4 py-3">Statut</th>
                    <th className="px-4 py-3 hidden lg:table-cell">Override</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-2 py-3"><div className="size-3.5 rounded bg-muted/50" /></td>
                        <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="size-7 rounded-full bg-muted/50" /><div className="space-y-1"><div className="h-3 w-24 bg-muted/50 rounded" /><div className="h-2.5 w-16 bg-muted/30 rounded" /></div></div></td>
                        <td className="px-4 py-3 hidden md:table-cell"><div className="h-3 w-20 bg-muted/50 rounded" /></td>
                        <td className="px-4 py-3 hidden md:table-cell"><div className="h-3 w-32 bg-muted/50 rounded" /></td>
                        <td className="px-4 py-3 hidden lg:table-cell"><div className="h-3 w-12 bg-muted/50 rounded" /></td>
                        <td className="px-4 py-3"><div className="h-5 w-16 bg-muted/50 rounded-full" /></td>
                        <td className="px-4 py-3 hidden md:table-cell"><div className="h-3 w-14 bg-muted/50 rounded" /></td>
                        <td className="px-4 py-3"><div className="h-5 w-12 bg-muted/50 rounded-full" /></td>
                        <td className="px-4 py-3"><div className="h-6 w-6 bg-muted/50 rounded" /></td>
                      </tr>
                    ))
                  ) : membres.length === 0 && loadError ? (
                    <tr><td colSpan={10} className="py-12 text-center"><div className="flex items-center justify-center gap-3 rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-xs text-destructive"><span>Impossible de charger les membres.</span><Button size="sm" variant="outline" onClick={() => fetchMembres()}>Réessayer</Button></div></td></tr>
                  ) : membres.length === 0 ? (
                    <tr><td colSpan={10} className="py-12 text-center"><EmptyState icon={Inbox} title="Aucun membre trouvé" description="Essayez de modifier vos filtres de recherche. Appuyez sur M pour réinitialiser." shortcut="M" action={{ label: hasFilters ? "Réinitialiser les filtres" : "Actualiser", onClick: resetFilters }} /></td></tr>
                  ) : (
                    membres.map((m: any) => (
                      <tr key={m.id} className="hover:bg-card/30 transition-colors">
                        <td className="px-2 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(m.id)}
                            onChange={() => toggleSelect(m.id)}
                            className="size-3.5 rounded border-border accent-primary cursor-pointer"
                            aria-label={`Sélectionner ${m.name || m.email}`}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-foreground text-sm">{m.name}</div>
                          <div className="text-xs text-muted-foreground md:hidden">{m.email}{m.phone ? ` · ${m.phone}` : ""}</div>
                          <div className="text-xs text-muted-foreground">{new Date(m.createdAt).toLocaleDateString("fr-FR")}</div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                          <div>{m.email}</div>
                          {m.phone && <div className="text-xs">{m.phone}</div>}
                          {m.country && <div className="text-xs">{m.country}</div>}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <EmailStatusBadge status={m.emailStatus} />
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          {(m._count?.pushSubscriptions ?? 0) > 0 ? (
                            <StatusBadge tone="success" title={`${m._count.pushSubscriptions} appareil(s)`}>
                              <Bell className="size-2.5" /> ON
                            </StatusBadge>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-muted/50 text-muted-foreground">
                              <BellOff className="size-2.5" /> OFF
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            {(m.subscriptions?.length ?? 0) > 0 ? (
                              m.subscriptions.map((sub: any) => (
                                <div key={sub.plan.id} className="flex flex-col">
                                  <Badge variant="secondary" className="text-xs px-2 py-0.5 font-medium w-fit">{sub.plan.name}</Badge>
                                  <ExpiryBadge expiresAt={sub.expiresAt} remainingDays={sub.remainingDays} />
                                </div>
                              ))
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <OnboardingBadge status={m.onboardingStatus} />
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => updateMember(m.id, { isActive: !m.isActive })}
                            className="cursor-pointer"
                            title={m.isActive ? "Désactiver" : "Activer"}
                          >
                            {m.isActive ? (
                              <StatusBadge tone="success">
                                <ToggleRight className="size-3" /> Actif
                              </StatusBadge>
                            ) : (
                              <StatusBadge tone="neutral">
                                <ToggleLeft className="size-3" /> Inactif
                              </StatusBadge>
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          {(() => {
                            const hasSubscription = (m.accessRequests?.length ?? 0) > 0
                            const overrideActive = m.signalsAccessOverride
                            if (hasSubscription) {
                              if (overrideActive) {
                                return (
                                  <button
                                    onClick={() => updateMember(m.id, { signalsAccessOverride: false })}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-colors bg-rose-500/10 text-rose-600"
                                    title="Incohérent : ce membre a déjà un abonnement, l'override est inutile. Cliquez pour remettre à l'état normal."
                                  >
                                    <Radio className="size-3" />
                                    Incohérent
                                  </button>
                                )
                              }
                              return (
                                <span
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-muted/50 text-muted-foreground cursor-not-allowed"
                                  title="Ce membre a déjà un abonnement actif : l'override est inutile."
                                >
                                  <Radio className="size-3" />
                                  Normal
                                </span>
                              )
                            }
                            return (
                              <button
                                onClick={() => updateMember(m.id, { signalsAccessOverride: !m.signalsAccessOverride })}
                                className={cn(
                                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-colors",
                                  m.signalsAccessOverride
                                    ? "bg-amber-500/10 text-amber-600"
                                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                                )}
                                title="Override : reçoit tous les signaux même sans abonnement"
                              >
                                <Radio className="size-3" />
                                {m.signalsAccessOverride ? "Tous signaux" : "Normal"}
                              </button>
                            )
                          })()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1 flex-wrap">
                            {m.emailStatus === "BOUNCED" || m.emailStatus === "INVALID" ? (
                              <button
                                onClick={() => updateMember(m.id, { emailStatus: "OK" })}
                                className="p-1.5 min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-lg text-amber-500 hover:text-amber-600 hover:bg-amber-500/10 transition-all cursor-pointer"
                                title="Réinitialiser le statut d'email du membre (peux être nécessaire après le rebond de l'email)"
                                aria-label="Réinitialiser le statut d'email pour réparation"
                              >
                                <Mail className="size-3.5" />
                              </button>
                            ) : null}

                            <button
                              onClick={() => {
                                confirm({
                                  title: `Bannir ${m.email} ?`,
                                  description: "Le compte sera supprimé et l'email blacklisté — il ne pourra plus se reconnecter sous aucun nom.",
                                  confirmLabel: "Bannir",
                                  onConfirm: () => banMember(m.email),
                                })
                              }}
                              disabled={updating === m.email}
                              className="p-1.5 min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-lg text-rose-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer disabled:opacity-50"
                              title="Bannir et blacklisted L'utilisateur. Supprime également le compte de manière permanente"
                              aria-label={`Bannir ${m.email} et blacklisted`}
                            >
                              {updating === m.email ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <Ban className="size-3.5" />
                              )}
                            </button>

                            <div className="relative inline-flex">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  const menu = e.currentTarget.nextElementSibling as HTMLElement
                                  if (menu) menu.classList.toggle("hidden")
                                }}
                                className="p-1.5 min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all cursor-pointer"
                                title="Plus d'actions disponibles sur ce membre"
                                aria-label="Plus d'actions pour le membre"
                              >
                                <MoreHorizontal className="size-3.5" />
                              </button>
                              <div className="hidden absolute right-0 top-9 z-30 w-48 bg-card border border-border rounded-lg shadow-lg py-1">
                                <button
                                  onClick={() => updateMember(m.id, { onboardingStatus: "ACTIVE" })}
                                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 text-left cursor-pointer"
                                  title="Force l'utilisateur à terminer immédiatement l'onboarding et à accéder à tous les services"
                                >
                                  <RotateCw className="size-3" /> Forcer onboarding
                                </button>
                                <button
                                  onClick={() => revokeSessions(m.id)}
                                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 text-left cursor-pointer"
                                  title="Déconnecte toutes les sessions actives de l'utilisateur et force un nouveau login"
                                >
                                  <Shield className="size-3" /> Révoquer sessions
                                </button>
                                {!m.isActive && (
                                  <button
                                    onClick={() => deleteMember(m.id)}
                                    className="flex items-center gap-2 w-full px-3 py-2 text-xs text-rose-500 hover:bg-rose-500/10 text-left cursor-pointer"
                                    title="Supprime le compte définitivement et désactive immédiatement toute l'activité"
                                  >
                                    <Trash2 className="size-3" /> Supprimer
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        }
        mobile={
          <div className="space-y-3 md:hidden">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-lg border border-border/50 bg-card p-4 animate-pulse space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-full bg-muted/50" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-3 w-28 bg-muted/50 rounded" />
                      <div className="h-2.5 w-20 bg-muted/30 rounded" />
                    </div>
                    <div className="h-5 w-12 bg-muted/50 rounded-full" />
                  </div>
                  <div className="flex gap-2">
                    <div className="h-6 w-6 bg-muted/50 rounded" />
                    <div className="h-6 w-6 bg-muted/50 rounded" />
                    <div className="h-6 w-6 bg-muted/50 rounded" />
                  </div>
                </div>
              ))
            ) : membres.length === 0 && loadError ? (
              <div className="flex items-center justify-center gap-3 rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-xs text-destructive"><span>Impossible de charger les membres.</span><Button size="sm" variant="outline" onClick={() => fetchMembres()}>Réessayer</Button></div>
            ) : membres.length === 0 ? (
              <EmptyState icon={Inbox} title="Aucun membre trouvé" description="Essayez de modifier vos filtres de recherche." action={{ label: hasFilters ? "Réinitialiser les filtres" : "Actualiser", onClick: resetFilters }} />
            ) : (
              membres.map((m: any) => (
                <MemberCard
                  key={m.id}
                  member={m}
                  plans={plans}
                  updating={updating}
                  onUpdate={updateMember}
                  onBan={banMember}
                  onRevokeSessions={revokeSessions}
                  onDelete={deleteMember}
                />
              ))
            )}
          </div>
        }
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{total} membre{total > 1 ? "s" : ""}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="p-1.5 min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-lg border border-border disabled:opacity-30 hover:bg-muted/50 transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="text-xs text-muted-foreground px-2">{page} / {totalPages}</span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="p-1.5 min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-lg border border-border disabled:opacity-30 hover:bg-muted/50 transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function MemberCard({
  member: m,
  plans,
  updating,
  onUpdate,
  onBan,
  onRevokeSessions,
  onDelete,
}: {
  member: any
  plans: any[]
  updating: string | null
  onUpdate: (userId: string, data: Record<string, unknown>) => void
  onBan: (email: string) => void
  onRevokeSessions: (userId: string) => void
  onDelete: (userId: string) => void
}) {
  const { confirm, node: confirmNode } = useConfirm()

  const [menuOpen, setMenuOpen] = useState(false)
  const pushCount = m._count?.pushSubscriptions ?? 0

  return (
    <div className="rounded-xl border border-border/60 bg-card shadow-sm p-4 space-y-3">
      {confirmNode}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-10 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
            {m.name?.slice(0, 1).toUpperCase() || "?"}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{m.name}</p>
            <p className="text-xs text-muted-foreground truncate">{m.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {m.isActive ? (
            <StatusBadge tone="success">
              <CheckCircle2 className="size-3" /> Actif
            </StatusBadge>
          ) : (
            <StatusBadge tone="neutral">
              <XCircle className="size-3" /> Inactif
            </StatusBadge>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {(m.subscriptions?.length ?? 0) > 0 ? m.subscriptions.map((sub: any) => (
          <div key={sub.plan.id} className="flex flex-col gap-0.5">
            <Badge variant="secondary" className="text-xs px-2 py-0.5 font-medium w-fit">{sub.plan.name}</Badge>
            <ExpiryBadge expiresAt={sub.expiresAt} remainingDays={sub.remainingDays} />
          </div>
        )) : (
          <span className="text-xs text-muted-foreground">Aucun abonnement</span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        {m.phone && <span className="flex items-center gap-1"><Phone className="size-3" />{m.phone}</span>}
        {m.country && <span className="flex items-center gap-1"><User className="size-3" />{m.country}</span>}
        <span className="flex items-center gap-1"><Calendar className="size-3" />{new Date(m.createdAt).toLocaleDateString("fr-FR")}</span>
        {pushCount > 0 ? (
          <span className="flex items-center gap-1 text-emerald-600"><Bell className="size-3" />Push</span>
        ) : (
          <span className="flex items-center gap-1"><BellOff className="size-3" />Push off</span>
        )}
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-border/40">
        <OnboardingBadge status={m.onboardingStatus} />
        <div className="flex items-center gap-1">
          {m.emailStatus === "BOUNCED" || m.emailStatus === "INVALID" ? (
            <button
              onClick={() => onUpdate(m.id, { emailStatus: "OK" })}
              className="p-2 min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-lg text-amber-500 hover:text-amber-600 hover:bg-amber-500/10 transition-all cursor-pointer"
              aria-label="Réinitialiser le statut d'email"
            >
              <Mail className="size-3.5" />
            </button>
          ) : null}
          <button
            onClick={() => onUpdate(m.id, { isActive: !m.isActive })}
            className="p-2 min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all cursor-pointer"
            aria-label={m.isActive ? "Désactiver" : "Activer"}
          >
            {m.isActive ? <ToggleRight className="size-3.5" /> : <ToggleLeft className="size-3.5" />}
          </button>
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all cursor-pointer"
              aria-label="Plus d'actions"
            >
              <MoreHorizontal className="size-3.5" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 bottom-10 z-20 w-48 bg-card border border-border rounded-lg shadow-lg py-1">
                  <button
                    onClick={() => { onUpdate(m.id, { onboardingStatus: "ACTIVE" }); setMenuOpen(false) }}
                    className="flex items-center gap-2 w-full px-3 py-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 text-left cursor-pointer"
                  >
                    <RotateCw className="size-3" /> Forcer onboarding
                  </button>
                  <button
                    onClick={() => { onRevokeSessions(m.id); setMenuOpen(false) }}
                    className="flex items-center gap-2 w-full px-3 py-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 text-left cursor-pointer"
                  >
                    <Shield className="size-3" /> Révoquer sessions
                  </button>
                  {!m.isActive && (
                    <button
                      onClick={() => { onDelete(m.id); setMenuOpen(false) }}
                      className="flex items-center gap-2 w-full px-3 py-2.5 text-xs text-rose-500 hover:bg-rose-500/10 text-left cursor-pointer"
                    >
                      <Trash2 className="size-3" /> Supprimer
                    </button>
                  )}
                  <button
                    onClick={() => {
                      confirm({
                                  title: `Bannir ${m.email} ?`,
                                  description: "Le compte sera supprimé et l'email blacklisté.",
                                  confirmLabel: "Bannir",
                                  onConfirm: () => { onBan(m.email); setMenuOpen(false) },
                                })
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2.5 text-xs text-rose-500 hover:bg-rose-500/10 text-left cursor-pointer"
                  >
                    <Ban className="size-3" /> Bannir
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const EMAIL_TONES: Record<string, Tone> = { OK: "success", BOUNCED: "warning", INVALID: "destructive" }

function EmailStatusBadge({ status }: { status: string | null | undefined }) {
  if (!status) return null
  return <StatusBadge tone={EMAIL_TONES[status] ?? "neutral"}>{EMAIL_STATUS_LABELS[status] ?? status}</StatusBadge>
}

function OnboardingBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-muted-foreground">—</span>
  const config: Record<string, { label: string; class: string }> = {
    COMPLETED: { label: "Terminé", class: "bg-success/10 text-success" },
    IN_PROGRESS: { label: "En cours", class: "bg-info/10 text-info" },
    PENDING: { label: "En attente", class: "bg-amber-500/10 text-amber-600" },
  }
  const c = config[status] || { label: ONBOARDING_STATUS_LABELS[status ?? ""] ?? status ?? "—", class: "bg-muted text-muted-foreground" }
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${c.class}`}>{c.label}</span>
}

function ExpiryBadge({ expiresAt, remainingDays }: { expiresAt: string; remainingDays: number }) {
  const date = new Date(expiresAt)
  const label = date.toLocaleDateString("fr-FR")
  if (remainingDays <= 0) {
    return (
      <span className="w-fit inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-rose-500/10 text-rose-600" title="Abonnement expiré">
        Échu le {label}
      </span>
    )
  }
  if (remainingDays <= 7) {
    return (
      <span className="w-fit inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-amber-500/10 text-amber-600" title="Abonnement expire bientôt">
        ⏳ fin {label} ({remainingDays}j)
      </span>
    )
  }
  return (
    <span className="w-fit inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-muted/50 text-muted-foreground" title="Abonnement actif">
      fin {label} ({remainingDays}j)
    </span>
  )
}