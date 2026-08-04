"use client"

import { useEffect, useState, useCallback } from "react"
import { Search, X, ToggleLeft, ToggleRight, Trash2, Ban, Mail, MoreHorizontal, Eye, Shield, RotateCw, Radio, ChevronLeft, ChevronRight, Inbox, Download, Bell, BellOff, Loader2, User, Phone, Calendar, Layers, CheckCircle2, XCircle, AlertTriangle } from "lucide-react"
import { Card, Badge, Button, cn, EmptyState, DualRender, FilterSheet } from "@nba/design-system"
import { BatchActionsBar } from "../components/batch-actions-bar"
import { toast } from "sonner"
import { CachedGet } from "./types"

interface MembresTabProps {
  cachedGet: CachedGet
  invalidate: () => void
}

export function MembresTab({ cachedGet, invalidate }: MembresTabProps) {
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
    const confirmed = confirm(
      `Supprimer définitivement ce membre ?\n\n` +
      `L'utilisateur perdra définitivement toutes ses données, accès aux signaux et à son compte. ` +
      `Cette action ne peut être annulée.`
    )
    if (!confirmed) return

    setUpdating(userId)
    try {
      const res = await fetch(`/api/admin/members?userId=${userId}`, { method: "DELETE" })
      if (res.ok) {
        invalidate()
        fetchMembres()
        toast.success("Membre supprimé")
      } else {
        toast.error("Erreur lors de la suppression")
      }
    } catch {
      toast.error("Impossible de contacter le serveur. Vérifiez votre connexion.")
    } finally {
      setUpdating(null)
    }
  }

  async function banMember(email: string) {
    const confirmed = confirm(
      `Bannir ${email} ?\n\n` +
      `Ce compte sera définitivement supprimé et l'email blacklisté.\n` +
      `L'utilisateur ne pourra plus se connecter sous aucun nom.\n\n` +
      `Cette action est permanente et irréversible.`
    )
    if (!confirmed) return

    setUpdating(email)
    try {
      const res = await fetch("/api/admin/moderation/bans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, reason: "Banni depuis MembresTab" }),
      })
      if (res.ok) {
        invalidate()
        fetchMembres()
        toast.success(`${email} banni et blacklisté`)
      } else {
        toast.error("Erreur lors du bannissement")
      }
    } catch {
      toast.error("Impossible de contacter le serveur. Vérifiez votre connexion.")
    } finally {
      setUpdating(null)
    }
  }

  async function revokeSessions(userId: string) {
    const confirmed = confirm(
      `Révoquer toutes les sessions de ce membre ?\n\n` +
      `L'utilisateur sera déconnecté de toutes les sessions actives. ` +
      `Il devra se reconnecter pour utiliser le compte.\n\n` +
      `Session active : ${new Date().toLocaleString("fr-FR")}`
    )
    if (!confirmed) return

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
  }

  function resetFilters() {
    setSearchQuery("")
    setStatusFilter("")
    setPlanFilter("")
    setOnboardingFilter("")
    setPage(1)
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
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/40 bg-card/30 text-muted-foreground font-bold uppercase tracking-wider text-[10px]">
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
                    <tr><td colSpan={10} className="py-12 text-center"><Loader2 className="animate-spin text-primary inline" /></td></tr>
                  ) : membres.length === 0 && loadError ? (
                    <tr><td colSpan={10} className="py-12 text-center"><div className="flex items-center justify-center gap-3 rounded-xl border border-rose-500/30 bg-rose-500/5 px-4 py-3 text-xs text-rose-700"><span>Impossible de charger les membres.</span><Button size="sm" variant="outline" onClick={() => fetchMembres()}>Réessayer</Button></div></td></tr>
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
                          <div className="text-[10px] text-muted-foreground md:hidden">{m.email}{m.phone ? ` · ${m.phone}` : ""}</div>
                          <div className="text-[10px] text-muted-foreground">{new Date(m.createdAt).toLocaleDateString("fr-FR")}</div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                          <div>{m.email}</div>
                          {m.phone && <div className="text-[10px]">{m.phone}</div>}
                          {m.country && <div className="text-[10px]">{m.country}</div>}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <EmailStatusBadge status={m.emailStatus} />
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          {(m._count?.pushSubscriptions ?? 0) > 0 ? (
                            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium bg-emerald-500/10 text-emerald-600" title={`${m._count.pushSubscriptions} appareil(s)`}>
                              <Bell className="size-2.5" /> ON
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium bg-muted/50 text-muted-foreground">
                              <BellOff className="size-2.5" /> OFF
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {m.accessRequests?.map((ar: any) => (
                              <Badge key={ar.plan.id} variant="secondary" className="text-[10px] px-2 py-0.5 font-medium">{ar.plan.name}</Badge>
                            ))}
                            {(!m.accessRequests || m.accessRequests.length === 0) && <span className="text-muted-foreground">—</span>}
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
                              <span className="inline-flex items-center gap-1 text-emerald-600 text-[10px] font-medium bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                <ToggleRight className="size-3" /> Actif
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-muted-foreground text-[10px] font-medium bg-muted/50 px-2 py-0.5 rounded-full">
                                <ToggleLeft className="size-3" /> Inactif
                              </span>
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
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium cursor-pointer transition-colors bg-rose-500/10 text-rose-600"
                                    title="Incohérent : ce membre a déjà un abonnement, l'override est inutile. Cliquez pour remettre à l'état normal."
                                  >
                                    <Radio className="size-3" />
                                    Incohérent
                                  </button>
                                )
                              }
                              return (
                                <span
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted/50 text-muted-foreground cursor-not-allowed"
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
                                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium cursor-pointer transition-colors",
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
                                className="p-1.5 rounded-lg text-amber-500 hover:text-amber-600 hover:bg-amber-500/10 transition-all cursor-pointer"
                                title="Réinitialiser le statut d'email du membre (peux être nécessaire après le rebond de l'email)"
                                aria-label="Réinitialiser le statut d'email pour réparation"
                              >
                                <Mail className="size-3.5" />
                              </button>
                            ) : null}

                            <button
                              onClick={() => {
                                if (confirm(`Bannir ${m.email} ?\nCe compte sera définitivement supprimé et l'email blacklisté.\n\nL'utilisateur ne pourra plus se connecter sous aucun nom.`)) {
                                  banMember(m.email)
                                }
                              }}
                              disabled={updating === m.email}
                              className="p-1.5 rounded-lg text-rose-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer disabled:opacity-50"
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
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all cursor-pointer"
                                title="Plus d'actions disponibles sur ce membre"
                                aria-label="Plus d'actions pour le membre"
                              >
                                <MoreHorizontal className="size-3.5" />
                              </button>
                              <div className="hidden absolute right-0 top-9 z-30 w-48 bg-card border border-border rounded-lg shadow-lg py-1">
                                <button
                                  onClick={() => updateMember(m.id, { onboardingStatus: "ACTIVE" })}
                                  className="flex items-center gap-2 w-full px-3 py-2 text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted/50 text-left cursor-pointer"
                                  title="Force l'utilisateur à terminer immédiatement l'onboarding et à accéder à tous les services"
                                >
                                  <RotateCw className="size-3" /> Forcer onboarding
                                </button>
                                <button
                                  onClick={() => revokeSessions(m.id)}
                                  className="flex items-center gap-2 w-full px-3 py-2 text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted/50 text-left cursor-pointer"
                                  title="Déconnecte toutes les sessions actives de l'utilisateur et force un nouveau login"
                                >
                                  <Shield className="size-3" /> Révoquer sessions
                                </button>
                                {!m.isActive && (
                                  <button
                                    onClick={() => deleteMember(m.id)}
                                    className="flex items-center gap-2 w-full px-3 py-2 text-[11px] text-rose-500 hover:bg-rose-500/10 text-left cursor-pointer"
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
              <div className="py-12 text-center"><Loader2 className="animate-spin text-primary inline" /></div>
            ) : membres.length === 0 && loadError ? (
              <div className="flex items-center justify-center gap-3 rounded-xl border border-rose-500/30 bg-rose-500/5 px-4 py-3 text-xs text-rose-700"><span>Impossible de charger les membres.</span><Button size="sm" variant="outline" onClick={() => fetchMembres()}>Réessayer</Button></div>
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
              className="p-1.5 rounded-lg border border-border disabled:opacity-30 hover:bg-muted/50 transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="text-xs text-muted-foreground px-2">{page} / {totalPages}</span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-border disabled:opacity-30 hover:bg-muted/50 transition-colors cursor-pointer disabled:cursor-not-allowed"
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
  const [menuOpen, setMenuOpen] = useState(false)
  const pushCount = m._count?.pushSubscriptions ?? 0
  const hasPlans = m.accessRequests?.length > 0

  return (
    <div className="rounded-xl border border-border/60 bg-card shadow-sm p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-10 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
            {m.name?.slice(0, 1).toUpperCase() || "?"}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{m.name}</p>
            <p className="text-[11px] text-muted-foreground truncate">{m.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {m.isActive ? (
            <span className="inline-flex items-center gap-1 text-emerald-600 text-[10px] font-medium bg-emerald-500/10 px-2 py-0.5 rounded-full">
              <CheckCircle2 className="size-3" /> Actif
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-muted-foreground text-[10px] font-medium bg-muted/50 px-2 py-0.5 rounded-full">
              <XCircle className="size-3" /> Inactif
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {hasPlans ? m.accessRequests.map((ar: any) => (
          <Badge key={ar.plan.id} variant="secondary" className="text-[10px] px-2 py-0.5 font-medium">{ar.plan.name}</Badge>
        )) : (
          <span className="text-[10px] text-muted-foreground">Aucun abonnement</span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
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
              className="p-2 rounded-lg text-amber-500 hover:text-amber-600 hover:bg-amber-500/10 transition-all cursor-pointer"
              aria-label="Réinitialiser le statut d'email"
            >
              <Mail className="size-3.5" />
            </button>
          ) : null}
          <button
            onClick={() => onUpdate(m.id, { isActive: !m.isActive })}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all cursor-pointer"
            aria-label={m.isActive ? "Désactiver" : "Activer"}
          >
            {m.isActive ? <ToggleRight className="size-3.5" /> : <ToggleLeft className="size-3.5" />}
          </button>
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all cursor-pointer"
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
                    className="flex items-center gap-2 w-full px-3 py-2.5 text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted/50 text-left cursor-pointer"
                  >
                    <RotateCw className="size-3" /> Forcer onboarding
                  </button>
                  <button
                    onClick={() => { onRevokeSessions(m.id); setMenuOpen(false) }}
                    className="flex items-center gap-2 w-full px-3 py-2.5 text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted/50 text-left cursor-pointer"
                  >
                    <Shield className="size-3" /> Révoquer sessions
                  </button>
                  {!m.isActive && (
                    <button
                      onClick={() => { onDelete(m.id); setMenuOpen(false) }}
                      className="flex items-center gap-2 w-full px-3 py-2.5 text-[11px] text-rose-500 hover:bg-rose-500/10 text-left cursor-pointer"
                    >
                      <Trash2 className="size-3" /> Supprimer
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (confirm(`Bannir ${m.email} ?`)) { onBan(m.email); setMenuOpen(false) }
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2.5 text-[11px] text-rose-500 hover:bg-rose-500/10 text-left cursor-pointer"
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

function EmailStatusBadge({ status }: { status: string | null | undefined }) {
  if (!status || status === "OK") {
    return <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-emerald-500/10 text-emerald-600">OK</span>
  }
  const config: Record<string, { label: string; class: string }> = {
    BOUNCED: { label: "BOUNCED", class: "bg-amber-500/10 text-amber-600" },
    INVALID: { label: "INVALID", class: "bg-rose-500/10 text-rose-600" },
  }
  const c = config[status] || { label: status, class: "bg-muted text-muted-foreground" }
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${c.class}`}>{c.label}</span>
}

function OnboardingBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-muted-foreground">—</span>
  const config: Record<string, { label: string; class: string }> = {
    COMPLETED: { label: "Terminé", class: "bg-success/10 text-success" },
    IN_PROGRESS: { label: "En cours", class: "bg-info/10 text-info" },
    PENDING: { label: "En attente", class: "bg-amber-500/10 text-amber-600" },
  }
  const c = config[status] || { label: status, class: "bg-muted text-muted-foreground" }
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${c.class}`}>{c.label}</span>
}