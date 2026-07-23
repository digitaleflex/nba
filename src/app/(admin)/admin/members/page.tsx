"use client"

import { useEffect, useState, useCallback } from "react"
import { Search, Loader2, ChevronLeft, ChevronRight, UserCheck, UserX, Mail, Phone, Globe, Eraser, AlertTriangle } from "lucide-react"
import { Button, Input, Badge, Card, CardContent, cn } from "@nba/design-system"
import { toast } from "sonner"

interface Member {
  id: string
  name: string
  email: string
  phone: string | null
  country: string | null
  onboardingStatus: string
  isActive: boolean
  createdAt: string
  role: { name: string }
  _count: {
    accessRequests: number
    kycDocuments: number
    notifications: number
  }
}

const ONBOARDING_LABELS: Record<string, string> = {
  PENDING_EMAIL: "Email",
  PROFILE_INCOMPLETE: "Profil",
  KYC_PENDING: "KYC",
  BROKER_PENDING: "Broker",
  REVIEW_PENDING: "Revue",
  ACTIVE: "Actif",
}

const ONBOARDING_COLORS: Record<string, string> = {
  PENDING_EMAIL: "bg-muted text-muted-foreground",
  PROFILE_INCOMPLETE: "bg-amber-500/10 text-amber-500",
  KYC_PENDING: "bg-blue-500/10 text-blue-500",
  BROKER_PENDING: "bg-blue-500/10 text-blue-500",
  REVIEW_PENDING: "bg-warning/10 text-warning",
  ACTIVE: "bg-success/10 text-success",
}

export default function AdminMembersPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [onboardingFilter, setOnboardingFilter] = useState("")
  const [page, setPage] = useState(1)
  const limit = 20

  const fetchMembers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (query) params.set("q", query)
      if (statusFilter) params.set("status", statusFilter)
      if (onboardingFilter) params.set("onboarding", onboardingFilter)
      params.set("page", String(page))
      params.set("limit", String(limit))

      const res = await fetch(`/api/admin/members?${params}`)
      if (res.ok) {
        const data = await res.json()
        setMembers(Array.isArray(data.members) ? data.members : [])
        setTotal(data.total || 0)
      } else {
        setMembers([])
      }
    } finally {
      setLoading(false)
    }
  }, [query, statusFilter, onboardingFilter, page])

  useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  const totalPages = Math.ceil(total / limit)

  // Cleanup des acces fantomes (inactifs/supprimes avec access APPROVED)
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
    } catch (err: any) {
      toast.error(`Erreur: ${err.message}`)
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
        `${data.accessRequestsRevoked} acces revoques sur ${data.usersAffected} membre(s) fantome(s)`,
        { duration: 6000 },
      )
      setCleanupPreview(null)
      fetchMembers()
    } catch (err: any) {
      toast.error(`Erreur: ${err.message}`)
    } finally {
      setCleanupLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestion des membres</h1>
          <p className="text-sm text-muted-foreground">
            {total} membre{total !== 1 ? "s" : ""} inscrit{total !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={previewCleanup}
          disabled={cleanupLoading}
        >
          {cleanupLoading ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Eraser className="size-3.5" />
          )}
          Nettoyer les acces fantomes
        </Button>
      </div>

      {/* Modale de confirmation du cleanup */}
      {cleanupPreview && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="size-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold">
                  {cleanupPreview.usersAffected === 0
                    ? "Aucun acces fantome detecte"
                    : `${cleanupPreview.accessRequestsRevoked} acces a revoquer sur ${cleanupPreview.usersAffected} membre(s) fantome(s)`}
                </p>
                {cleanupPreview.usersAffected > 0 && (
                  <div className="mt-2 max-h-40 overflow-y-auto rounded-md border bg-background/50 text-xs">
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
                <p className="text-[10px] text-muted-foreground mt-2">
                  Les acces APPROVED seront passes en REVOKED. Les autres donnees (KYC, profil,
                  notifications) sont conservees. Action journalisee.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCleanupPreview(null)}
                disabled={cleanupLoading}
              >
                Annuler
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={runCleanup}
                disabled={cleanupLoading || cleanupPreview.usersAffected === 0}
                className="gap-1.5"
              >
                {cleanupLoading ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Eraser className="size-3.5" />
                )}
                Revoquer {cleanupPreview.accessRequestsRevoked} acces
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, email ou téléphone..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1) }}
            className="pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 text-muted-foreground focus:text-foreground"
        >
          <option value="">Tous les statuts</option>
          <option value="active">Actif</option>
          <option value="inactive">Inactif</option>
        </select>
        <select
          value={onboardingFilter}
          onChange={(e) => { setOnboardingFilter(e.target.value); setPage(1) }}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 text-muted-foreground focus:text-foreground"
        >
          <option value="">Tous les onboarding</option>
          <option value="PENDING_EMAIL">Email en attente</option>
          <option value="PROFILE_INCOMPLETE">Profil incomplet</option>
          <option value="KYC_PENDING">KYC en attente</option>
          <option value="BROKER_PENDING">Broker en attente</option>
          <option value="REVIEW_PENDING">Revue en attente</option>
          <option value="ACTIVE">Actif</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      ) : members.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
            <UserX className="size-8" />
            <p className="text-sm">Aucun membre trouvé.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 font-medium">Membre</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">Contact</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Onboarding</th>
                <th className="px-4 py-3 font-medium hidden lg:table-cell">Inscrit le</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {members.map((member) => (
                <tr key={member.id} className="transition-colors hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {(member.name || member.email || "?").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{member.name || "—"}</p>
                        <p className="text-xs text-muted-foreground">{member.role?.name ?? "—"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Mail className="size-3" />
                        {member.email}
                      </div>
                      {member.phone && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Phone className="size-3" />
                          {member.phone}
                        </div>
                      )}
                      {member.country && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Globe className="size-3" />
                          {member.country}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {member.isActive ? (
                      <Badge variant="default" className="gap-1">
                        <UserCheck className="size-3" />
                        Actif
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="gap-1">
                        <UserX className="size-3" />
                        Inactif
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                        ONBOARDING_COLORS[member.onboardingStatus]
                      )}
                    >
                      {ONBOARDING_LABELS[member.onboardingStatus] ?? member.onboardingStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell">
                    {new Date(member.createdAt).toLocaleDateString("fr-FR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Page {page} sur {totalPages} ({total} résultat{total !== 1 ? "s" : ""})
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
