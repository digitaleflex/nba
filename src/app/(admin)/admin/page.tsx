"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { 
  Check, X, Clock, ExternalLink, ListTodo, Radio, History, Trash2, Calendar, 
  Search, Eye, Layers, Copy, Play, Loader2, Laptop, Phone 
} from "lucide-react"
import { Button, Card, CardContent, Badge, Tabs, TabsList, TabsTrigger, TabsContent, Input, cn } from "@nba/design-system"
import { SignalEditor } from "./components/signal-editor"
import { parseSimpleMarkdown } from "@nba/lib/utils"

interface AccessRequest {
  id: string
  status: string
  createdAt: string
  user: {
    id: string
    name: string
    email: string
    phone: string | null
    country: string | null
    onboardingStatus: string
    createdAt: string
  }
  plan: {
    name: string
  }
  onboarding: {
    status: string
    progress: number
    checklist: Record<string, boolean>
    nextStep: string | null
  }
}

interface Signal {
  id: string
  content: string
  imageUrl: string | null
  imageUrls: any // json array
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED"
  publishedAt: string | null
  scheduledAt: string | null
  createdAt: string
  creator: { name: string }
  audience: { plan: { name: string } }[]
  currentVersion: number
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-warning/10 text-warning border-warning/20",
  APPROVED: "bg-success/10 text-success border-success/20",
  REJECTED: "bg-destructive/10 text-destructive border-destructive/20",
}

export default function AdminPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    }>
      <AdminConsoleContent />
    </Suspense>
  )
}

function AdminConsoleContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeTab = searchParams.get("tab") || "requests"

  const [requests, setRequests] = useState<AccessRequest[]>([])
  const [signals, setSignals] = useState<Signal[]>([])
  const [loadingRequests, setLoadingRequests] = useState(true)
  const [loadingSignals, setLoadingSignals] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null)
  const [reviewNotes, setReviewNotes] = useState("")

  // Search & Filters state
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [groupFilter, setGroupFilter] = useState("ALL")

  // Modals state
  const [selectedStatsSignal, setSelectedStatsSignal] = useState<Signal | null>(null)
  const [stats, setStats] = useState<any>(null)
  const [loadingStats, setLoadingStats] = useState(false)

  const [selectedVersionsSignal, setSelectedVersionsSignal] = useState<Signal | null>(null)
  const [versions, setVersions] = useState<any[]>([])
  const [loadingVersions, setLoadingVersions] = useState(false)
  const [compareVersionIndex, setCompareVersionIndex] = useState<number | null>(null)

  // Fetch access requests
  function fetchRequests() {
    setLoadingRequests(true)
    fetch("/api/admin/access-requests")
      .then((r) => r.json())
      .then(setRequests)
      .finally(() => setLoadingRequests(false))
  }

  // Fetch signals history
  function fetchSignals() {
    setLoadingSignals(true)
    fetch("/api/admin/signals")
      .then((r) => r.json())
      .then(setSignals)
      .finally(() => setLoadingSignals(false))
  }

  useEffect(() => {
    fetchRequests()
    fetchSignals()
  }, [])

  async function handleReview(id: string, status: string) {
    await fetch(`/api/admin/access-requests/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, reviewerId: "admin", notes: reviewNotes }),
    })
    setRequests((prev) => prev.filter((r) => r.id !== id))
    setSelectedRequest(null)
    setReviewNotes("")
  }

  async function handleDeleteSignal(id: string) {
    if (!confirm("Voulez-vous vraiment supprimer ce signal ?")) return
    await fetch(`/api/admin/signals/${id}`, {
      method: "DELETE",
    })
    setSignals((prev) => prev.filter((s) => s.id !== id))
  }

  async function handleDuplicate(id: string) {
    try {
      const res = await fetch(`/api/admin/signals/${id}/duplicate`, {
        method: "POST"
      })
      if (res.ok) {
        fetchSignals()
        alert("Signal dupliqué avec succès en tant que brouillon.")
      } else {
        alert("Échec de la duplication.")
      }
    } catch (err) {
      console.error(err)
      alert("Erreur de duplication.")
    }
  }

  async function handlePublishImmediately(id: string) {
    try {
      const res = await fetch(`/api/admin/signals/${id}/publish`, {
        method: "POST"
      })
      if (res.ok) {
        fetchSignals()
        alert("Signal publié immédiatement.")
      } else {
        alert("Échec de la publication.")
      }
    } catch (err) {
      console.error(err)
      alert("Erreur de publication.")
    }
  }

  async function openStats(sig: Signal) {
    setSelectedStatsSignal(sig)
    setLoadingStats(true)
    setStats(null)
    try {
      const res = await fetch(`/api/admin/signals/${sig.id}/stats`)
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingStats(false)
    }
  }

  async function openVersions(sig: Signal) {
    setSelectedVersionsSignal(sig)
    setLoadingVersions(true)
    setVersions([])
    setCompareVersionIndex(null)
    try {
      const res = await fetch(`/api/admin/signals/${sig.id}/versions`)
      if (res.ok) {
        const data = await res.json()
        setVersions(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingVersions(false)
    }
  }

  // Filter signals in memory
  const filteredSignals = signals.filter((sig) => {
    // 1. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchesContent = sig.content.toLowerCase().includes(q)
      const matchesAuthor = sig.creator.name.toLowerCase().includes(q)
      const matchesGroup = sig.audience.some(a => a.plan.name.toLowerCase().includes(q))
      if (!matchesContent && !matchesAuthor && !matchesGroup) {
        return false
      }
    }

    // 2. Status Filter
    if (statusFilter !== "ALL") {
      if (statusFilter === "PUBLISHED" && sig.status !== "PUBLISHED") return false
      if (statusFilter === "DRAFT" && (sig.status !== "DRAFT" || sig.scheduledAt)) return false
      if (statusFilter === "SCHEDULED" && !(sig.status === "DRAFT" && sig.scheduledAt)) return false
    }

    // 3. Group Filter
    if (groupFilter !== "ALL" && !sig.audience.some(a => a.plan.name === groupFilter)) {
      return false
    }

    return true
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Console d'Administration</h1>
        <p className="text-sm text-muted-foreground">Gérez les demandes d'accès et publiez des signaux de trading.</p>
      </div>

      <Tabs value={activeTab} onValueChange={(val) => router.push(`/admin?tab=${val}`)} className="space-y-6">
        <TabsList className="hidden">
          <TabsTrigger value="requests" className="gap-2 px-4 py-2">
            <ListTodo className="size-4" />
            Demandes d'accès
            {requests.length > 0 && (
              <Badge variant="destructive" className="ml-1 px-1.5 py-0 text-[10px]">
                {requests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="send" className="gap-2 px-4 py-2">
            <Radio className="size-4" />
            Publier un Signal
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2 px-4 py-2">
            <History className="size-4" />
            Historique des signaux
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Access Requests */}
        <TabsContent value="requests" className="space-y-4 outline-none">
          {loadingRequests ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="size-6 animate-spin text-primary" />
            </div>
          ) : requests.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
                <Check className="size-8 text-success" />
                <p className="text-sm text-muted-foreground">Aucune demande en attente</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {requests.map((req) => (
                <Card key={req.id} className="relative overflow-hidden">
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{req.user.name}</h3>
                          <span
                            className={`rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[req.onboarding.status] ?? ""}`}
                          >
                            {req.onboarding.progress}%
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{req.user.email}</p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline">{req.plan.name}</Badge>
                          {req.user.country && <Badge variant="outline">{req.user.country}</Badge>}
                          <Badge variant="outline" className="gap-1">
                            <Clock className="size-3" />
                            {new Date(req.createdAt).toLocaleDateString()}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex shrink-0 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedRequest(selectedRequest === req.id ? null : req.id)}
                        >
                          <ExternalLink className="size-3.5 mr-1" />
                          Détails
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleReview(req.id, "APPROVED")}
                        >
                          <Check className="size-3.5 mr-1" />
                          Approuver
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleReview(req.id, "REJECTED")}
                        >
                          <X className="size-3.5 mr-1" />
                          Refuser
                        </Button>
                      </div>
                    </div>

                    {selectedRequest === req.id && (
                      <div className="mt-4 space-y-4 border-t pt-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Email</p>
                            <p className="font-medium">{req.user.email}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Téléphone</p>
                            <p className="font-medium">{req.user.phone ?? "—"}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Pays</p>
                            <p className="font-medium">{req.user.country ?? "—"}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Service demandé</p>
                            <p className="font-medium">{req.plan.name}</p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <p className="text-sm font-medium">Checklist d'onboarding</p>
                          <div className="flex gap-1">
                            {Object.entries(req.onboarding.checklist).map(([key, done]) => (
                              <div
                                key={key}
                                className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs ${
                                  done
                                    ? "bg-success/10 text-success"
                                    : "bg-muted text-muted-foreground"
                                }`}
                              >
                                {done ? <Check className="size-3" /> : <Clock className="size-3" />}
                                {key.replace(/([A-Z])/g, " $1").trim()}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">Notes de validation</label>
                          <textarea
                            className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
                            rows={2}
                            value={reviewNotes}
                            onChange={(e) => setReviewNotes(e.target.value)}
                            placeholder="Ajouter une note…"
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab 2: Send Signal */}
        <TabsContent value="send" className="outline-none">
          <SignalEditor onSignalCreated={fetchSignals} />
        </TabsContent>

        {/* Tab 3: Signals History */}
        <TabsContent value="history" className="outline-none space-y-6">
          {/* Search & Filter Bar */}
          <div className="flex flex-col md:flex-row gap-3 bg-card border p-4 rounded-2xl shadow-xs">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par contenu, auteur, canal..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none text-muted-foreground focus:text-foreground"
              >
                <option value="ALL">Tous les statuts</option>
                <option value="PUBLISHED">Publiés</option>
                <option value="DRAFT">Brouillons</option>
                <option value="SCHEDULED">Programmés</option>
              </select>

              <select
                value={groupFilter}
                onChange={(e) => setGroupFilter(e.target.value)}
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none text-muted-foreground focus:text-foreground"
              >
                <option value="ALL">Tous les canaux</option>
                {Array.from(new Set(signals.flatMap(s => s.audience.map(a => a.plan.name)))).map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
          </div>

          {loadingSignals ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="size-6 animate-spin text-primary" />
            </div>
          ) : filteredSignals.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
                <Radio className="size-8 animate-pulse text-muted-foreground" />
                <p className="text-sm">Aucun signal ne correspond aux filtres.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredSignals.map((sig) => {
                const isScheduled = sig.status === "DRAFT" && sig.scheduledAt
                return (
                  <Card key={sig.id} className="relative overflow-hidden">
                    <CardContent className="pt-5 space-y-4">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={sig.status === "PUBLISHED" ? "default" : "secondary"}
                              className={cn(
                                isScheduled && "bg-amber-500/10 text-amber-500 border-amber-500/20"
                              )}
                            >
                              {sig.status === "PUBLISHED" 
                                ? "Publié" 
                                : isScheduled 
                                  ? "Programmé" 
                                  : "Brouillon"}
                            </Badge>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="size-3" />
                              {new Date(sig.publishedAt || sig.createdAt).toLocaleString("fr-FR")}
                            </span>
                          </div>
                          
                          <div className="text-xs text-muted-foreground flex flex-wrap gap-x-4">
                            <span>Auteur : <strong>{sig.creator.name}</strong></span>
                            <span>Version : <strong>v{sig.currentVersion}</strong></span>
                            {isScheduled && sig.scheduledAt && (
                              <span className="text-amber-500 font-medium">
                                Planifié pour le {new Date(sig.scheduledAt).toLocaleString("fr-FR")}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-wrap items-center gap-1.5 ml-auto">
                          {/* Publish Immediately if Draft/Scheduled */}
                          {sig.status === "DRAFT" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 gap-1 text-xs"
                              onClick={() => handlePublishImmediately(sig.id)}
                            >
                              <Play className="size-3.5 text-emerald-500" />
                              Publier
                            </Button>
                          )}

                          {/* Stats Button */}
                          {sig.status === "PUBLISHED" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 gap-1 text-xs"
                              onClick={() => openStats(sig)}
                            >
                              <Eye className="size-3.5 text-blue-500" />
                              Vues
                            </Button>
                          )}

                          {/* Version History Button */}
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1 text-xs"
                            onClick={() => openVersions(sig)}
                          >
                            <Layers className="size-3.5" />
                            Versions
                          </Button>

                          {/* Duplicate Button */}
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1 text-xs"
                            onClick={() => handleDuplicate(sig.id)}
                          >
                            <Copy className="size-3.5" />
                            Dupliquer
                          </Button>

                          {/* Delete Button */}
                          <Button
                            variant="destructive"
                            size="sm"
                            className="h-8 gap-1 text-xs"
                            onClick={() => handleDeleteSignal(sig.id)}
                          >
                            <Trash2 className="size-3.5" />
                            Supprimer
                          </Button>
                        </div>
                      </div>

                      <div 
                        className="text-sm border-l-2 border-primary/20 pl-3 whitespace-pre-wrap leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: parseSimpleMarkdown(sig.content) }}
                      />

                      {/* Display attached images */}
                      {Array.isArray(sig.imageUrls) && sig.imageUrls.length > 0 ? (
                        <div className="grid grid-cols-5 gap-2 max-w-xl">
                          {sig.imageUrls.map((url: string, idx: number) => (
                            <div key={idx} className="relative aspect-square overflow-hidden rounded-lg border bg-muted">
                              <img
                                src={`/api/files/${url}`}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      ) : sig.imageUrl ? (
                        <div className="relative max-w-xs rounded-lg overflow-hidden border">
                          <img
                            src={`/api/files/${sig.imageUrl}`}
                            alt="Graphique"
                            className="max-h-[120px] w-full object-cover"
                          />
                        </div>
                      ) : null}

                      <div className="flex flex-wrap gap-1">
                        {sig.audience.map((a) => (
                          <Badge key={a.plan.name} variant="outline" className="text-[10px]">
                            {a.plan.name}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Seen Stats Overlay Modal */}
      {selectedStatsSignal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-background border rounded-2xl max-w-lg w-full shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <h3 className="font-semibold text-lg">Statistiques de lecture</h3>
                <p className="text-xs text-muted-foreground">Signal ID: {selectedStatsSignal.id.substring(0, 8)}...</p>
              </div>
              <button 
                onClick={() => setSelectedStatsSignal(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            {loadingStats ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <Loader2 className="size-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Récupération des statistiques...</p>
              </div>
            ) : stats ? (
              <div className="space-y-4">
                {/* Highlights */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="border rounded-xl p-3 bg-muted/20">
                    <p className="text-2xl font-bold text-primary">{stats.uniqueMembers}</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-semibold">Lecteurs uniques</p>
                  </div>
                  <div className="border rounded-xl p-3 bg-muted/20">
                    <p className="text-2xl font-bold text-emerald-500">{stats.totalViews}</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-semibold">Vues totales</p>
                  </div>
                  <div className="border rounded-xl p-3 bg-muted/20">
                    <p className="text-xs font-semibold text-foreground truncate">
                      {stats.firstRead ? new Date(stats.firstRead).toLocaleDateString() : "—"}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase font-semibold mt-2.5">Première lecture</p>
                  </div>
                </div>

                {/* Details List */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Historique détaillé des lectures</h4>
                  {stats.reads.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic py-4 text-center">Aucun membre n'a encore vu ce signal.</p>
                  ) : (
                    <div className="border rounded-xl max-h-[220px] overflow-y-auto divide-y">
                      {stats.reads.map((r: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center p-3 text-xs">
                          <div>
                            <p className="font-semibold">{r.userName}</p>
                            <p className="text-[10px] text-muted-foreground">{r.userEmail}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{new Date(r.readAt).toLocaleString("fr-FR")}</p>
                            <p className="text-[10px] text-muted-foreground">{r.views} vue(s)</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">Une erreur s'est produite.</p>
            )}

            <div className="flex justify-end pt-2">
              <Button onClick={() => setSelectedStatsSignal(null)}>Fermer</Button>
            </div>
          </div>
        </div>
      )}

      {/* Version History Overlay Modal */}
      {selectedVersionsSignal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-background border rounded-2xl max-w-3xl w-full shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <h3 className="font-semibold text-lg">Historique des modifications</h3>
                <p className="text-xs text-muted-foreground">Visualisez les versions successives et comparez les textes.</p>
              </div>
              <button 
                onClick={() => setSelectedVersionsSignal(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            {loadingVersions ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <Loader2 className="size-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Chargement de l'historique...</p>
              </div>
            ) : versions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Aucun historique disponible.</p>
            ) : (
              <div className="grid md:grid-cols-5 gap-4">
                {/* Left navigation list */}
                <div className="md:col-span-2 border rounded-xl divide-y overflow-y-auto max-h-[380px]">
                  {versions.map((v, idx) => (
                    <button
                      key={v.id}
                      onClick={() => setCompareVersionIndex(idx)}
                      className={cn(
                        "w-full text-left p-3 text-xs transition-colors hover:bg-muted/40",
                        compareVersionIndex === idx ? "bg-primary/5 text-primary" : ""
                      )}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold">Version v{v.version}</span>
                        <span className="text-[10px] text-muted-foreground">{new Date(v.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-muted-foreground text-[10px] truncate">Éditeur: {v.updater.name}</p>
                    </button>
                  ))}
                </div>

                {/* Right detailed display */}
                <div className="md:col-span-3 border rounded-xl p-4 bg-muted/10 space-y-4 overflow-y-auto max-h-[380px]">
                  {compareVersionIndex !== null ? (
                    <>
                      <div className="flex items-center justify-between border-b pb-2 text-xs">
                        <span className="font-bold">Détails de la Version v{versions[compareVersionIndex].version}</span>
                        <span className="text-muted-foreground">{new Date(versions[compareVersionIndex].createdAt).toLocaleString("fr-FR")}</span>
                      </div>

                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>Auteur de la modification : <strong>{versions[compareVersionIndex].updater.name}</strong></p>
                        <p>Email : <strong>{versions[compareVersionIndex].updater.email}</strong></p>
                      </div>

                      <div className="space-y-1.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Contenu</p>
                        <div 
                          className="text-xs p-3 rounded-lg border bg-background whitespace-pre-wrap leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: parseSimpleMarkdown(versions[compareVersionIndex].content) }}
                        />
                      </div>

                      {Array.isArray(versions[compareVersionIndex].imageUrls) && versions[compareVersionIndex].imageUrls.length > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Images jointes ({versions[compareVersionIndex].imageUrls.length})</p>
                          <div className="grid grid-cols-4 gap-1.5">
                            {versions[compareVersionIndex].imageUrls.map((url: string, idx: number) => (
                              <div key={idx} className="aspect-square border rounded-lg overflow-hidden bg-background">
                                <img src={`/api/files/${url}`} alt="" className="h-full w-full object-cover" />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-6">
                      <Layers className="size-8 mb-2 animate-pulse text-muted-foreground" />
                      <p className="text-xs">Sélectionnez une version dans la liste de gauche pour en afficher les détails.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t">
              <Button onClick={() => setSelectedVersionsSignal(null)}>Fermer</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
