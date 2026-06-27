"use client"

import { useEffect, useState } from "react"
import { Check, X, Clock, ExternalLink } from "lucide-react"
import { Button, Card, CardContent, Badge } from "@nba/design-system"

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

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-warning/10 text-warning border-warning/20",
  APPROVED: "bg-success/10 text-success border-success/20",
  REJECTED: "bg-destructive/10 text-destructive border-destructive/20",
}

export default function AdminPage() {
  const [requests, setRequests] = useState<AccessRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string | null>(null)
  const [reviewNotes, setReviewNotes] = useState("")

  useEffect(() => {
    fetch("/api/admin/access-requests")
      .then((r) => r.json())
      .then(setRequests)
      .finally(() => setLoading(false))
  }, [])

  async function handleReview(id: string, status: string) {
    await fetch(`/api/admin/access-requests/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, reviewerId: "admin", notes: reviewNotes }),
    })
    setRequests((prev) => prev.filter((r) => r.id !== id))
    setSelected(null)
    setReviewNotes("")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Demandes d&rsquo;accès</h1>
        <p className="text-sm text-muted-foreground">{requests.length} demande(s) en attente</p>
      </div>

      {requests.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <Check className="size-8 text-success" />
            <p className="text-sm text-muted-foreground">Aucune demande en attente</p>
          </CardContent>
        </Card>
      )}

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
                    onClick={() => setSelected(selected === req.id ? null : req.id)}
                  >
                    <ExternalLink className="size-3.5" />
                    Détails
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleReview(req.id, "APPROVED")}
                  >
                    <Check className="size-3.5" />
                    Approuver
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleReview(req.id, "REJECTED")}
                  >
                    <X className="size-3.5" />
                    Refuser
                  </Button>
                </div>
              </div>

              {selected === req.id && (
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
                    <p className="text-sm font-medium">Checklist d&rsquo;onboarding</p>
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
    </div>
  )
}
