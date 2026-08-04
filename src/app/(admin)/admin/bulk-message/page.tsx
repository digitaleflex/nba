"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, Button, Badge, Checkbox, Dialog, DialogContent, DialogHeader, DialogTitle } from "@nba/design-system"
import { readBatchStream } from "@nba/lib/batch-stream"
import { Send, Loader2, Users, ChevronDown, Eye, AlertTriangle, CheckCircle2, Mail, XCircle } from "lucide-react"

const PLACEHOLDER_MESSAGE = `Bonjour {prenom}, 👋

J'ai une très bonne nouvelle pour vous.

À partir d'aujourd'hui, vous avez un canal de communication direct avec l'équipe d'administration, directement dans votre espace membre.

Ce que ça change :

🚀 Plus besoin de tickets.
Plus de formulaires, plus d'attente. Vous écrivez, on répond.

⚡ Des réponses plus rapides.
Une question sur un signal ? Un souci technique ? Un conseil ? Écrivez-nous.

🔒 100% privé.
Vos échanges sont strictement confidentiels. Seul vous et l'admin les voyez.

Comment ça marche ?
Cliquez sur 📩 Messages dans votre menu. La conversation est déjà ouverte. Vous n'avez qu'à écrire.

Ce canal est réservé aux membres de nos groupes — vous faites partie de la famille NBA, et on tient à chaque membre.

À très vite,

L'équipe NBA 🏀`

interface PlanStats {
  id: string
  name: string
  count: number
}

const EXAMPLE_NAMES = ["Jean", "Marie", "Pierre", "Sophie", "Thomas", "Camille", "Lucas", "Emma"]

export default function BulkMessagePage() {
  const [plans, setPlans] = useState<PlanStats[]>([])
  const [selectedPlanIds, setSelectedPlanIds] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(true)
  const [content, setContent] = useState(PLACEHOLDER_MESSAGE)
  const [showPreview, setShowPreview] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ succeeded: number; failed: number; total: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [progressOpen, setProgressOpen] = useState(false)
  const [progressStep, setProgressStep] = useState(0)
  const [progressText, setProgressText] = useState("")

  useEffect(() => {
    fetch("/api/admin/bulk-message")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.plans)) {
          setPlans(data.plans)
          setSelectedPlanIds(data.plans.map((p: PlanStats) => p.id))
        }
      })
      .catch(() => {})
  }, [])

  const effectivePlanIds = selectAll ? [] : selectedPlanIds
  const totalAudience = selectAll
    ? plans.reduce((sum, p) => sum + p.count, 0)
    : plans.filter((p) => selectedPlanIds.includes(p.id)).reduce((sum, p) => sum + p.count, 0)

  function togglePlan(planId: string) {
    setSelectedPlanIds((prev) =>
      prev.includes(planId) ? prev.filter((id) => id !== planId) : [...prev, planId]
    )
  }

  function previewText(name: string) {
    return content.replace(/\{prenom\}/g, name)
  }

  async function handleSend() {
    if (!content.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)
    setProgressStep(0)
    setProgressText("Envoi de la requête...")
    setProgressOpen(true)

    try {
      const res = await fetch("/api/admin/bulk-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planIds: effectivePlanIds.length > 0 ? effectivePlanIds : undefined, content }),
      })

      await readBatchStream(res, {
        onProgress: (data) => {
          setProgressStep(Math.min(4, Math.round((data.succeeded + data.failed) / data.total * 4)))
          setProgressText(data.step)
        },
        onDone: (result) => {
          setProgressStep(5)
          setProgressText("Terminé")
          setResult(result)
        },
        onError: (msg) => {
          setError(msg)
          setProgressOpen(false)
        },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue")
      setProgressOpen(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-6 px-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Mail className="size-6 text-primary" />
          Messagerie groupée
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Envoyez un message privé individuel à tous les membres approuvés de vos groupes.
        </p>
      </div>

      {/* Result screen */}
      {result && (
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
            <CheckCircle2 className="size-10 text-emerald-500" />
            <p className="font-semibold text-lg">Envoi terminé</p>
            <p className="text-sm text-muted-foreground">
              {result.succeeded} message{result.succeeded > 1 ? "s" : ""} envoyé{result.succeeded > 1 ? "s" : ""}
              {result.failed > 0 && `, ${result.failed} échec${result.failed > 1 ? "s" : ""}`}
            </p>
            <Button variant="outline" size="sm" onClick={() => setResult(null)}>
              Envoyer un autre message
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 1: Audience */}
      {!result && (
        <>
          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Users className="size-5 text-primary" />
                <h2 className="font-semibold">Étape 1 — Audience</h2>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={selectAll} onCheckedChange={() => setSelectAll(!selectAll)} />
                <span className="text-sm font-medium">Tous les groupes</span>
                <Badge variant="outline" className="ml-auto text-xs">
                  {plans.reduce((s, p) => s + p.count, 0)} membres
                </Badge>
              </label>

              {!selectAll && (
                <div className="space-y-2 pl-1 border-l-2 border-primary/30 ml-2">
                  {plans.map((plan) => (
                    <label key={plan.id} className="flex items-center gap-2 cursor-pointer py-0.5">
                      <Checkbox
                        checked={selectedPlanIds.includes(plan.id)}
                        onCheckedChange={() => togglePlan(plan.id)}
                      />
                      <span className="text-sm">{plan.name}</span>
                      <Badge variant="secondary" className="ml-auto text-[10px]">
                        {plan.count} membres
                      </Badge>
                    </label>
                  ))}
                </div>
              )}

              {totalAudience > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/10 text-sm">
                  <Users className="size-4 text-primary shrink-0" />
                  <span className="text-primary font-medium">{totalAudience} membres seront contactés</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 2: Message */}
          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Mail className="size-5 text-primary" />
                <h2 className="font-semibold">Étape 2 — Message</h2>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setContent(content + " {prenom}")}
                  className="text-xs"
                >
                  + Insérer {"{prenom}"}
                </Button>
              </div>

              <textarea
                value={content}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
                rows={14}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50 resize-y font-mono"
                placeholder="Votre message..."
              />

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setShowPreview(!showPreview)}>
                  <Eye className="size-4 mr-1" />
                  {showPreview ? "Masquer l'aperçu" : "Voir l'aperçu"}
                  <ChevronDown className={`size-4 ml-1 transition-transform ${showPreview ? "rotate-180" : ""}`} />
                </Button>
                <span className="text-xs text-muted-foreground">
                  {content.length}/4000
                </span>
              </div>

              {showPreview && (
                <div className="space-y-3 pt-2 border-t border-border/50">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Aperçus</p>
                  {EXAMPLE_NAMES.map((name) => (
                    <div key={name} className="rounded-xl bg-muted/40 border border-border/60 p-4 text-sm whitespace-pre-line">
                      {previewText(name)}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Error */}
          {error && (
            <Card className="border-destructive/30 bg-destructive/5">
              <CardContent className="flex items-center gap-3 py-4">
                <AlertTriangle className="size-5 text-destructive shrink-0" />
                <p className="text-sm text-destructive">{error}</p>
              </CardContent>
            </Card>
          )}

          {/* Send button */}
          <div className="flex items-center gap-3">
            <Button
              size="lg"
              onClick={handleSend}
              disabled={loading || !content.trim() || totalAudience === 0}
              className="gap-2"
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              {loading
                ? `Envoi en cours...`
                : `⚠ Envoyer à ${totalAudience} membre${totalAudience > 1 ? "s" : ""}`}
            </Button>
          </div>
        </>
      )}

      <Dialog open={progressOpen} onOpenChange={(o) => { if (!o) { setProgressOpen(false); setResult(null) } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {result ? "Résultat de l'envoi" : "Envoi en cours"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!result ? (
              <div className="flex flex-col items-center gap-3 py-4">
                <Loader2 className="size-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground text-center">
                  Envoi à {totalAudience} membre{totalAudience > 1 ? "s" : ""}...
                </p>
                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-500 rounded-full"
                    style={{ width: `${Math.min(100, (progressStep / 5) * 100)}%` }}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {progressText || "Traitement en cours..."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="size-4 text-emerald-500" />
                  <span>{result.succeeded} message{result.succeeded > 1 ? "s" : ""} envoyé{result.succeeded > 1 ? "s" : ""}</span>
                </div>
                {result.failed > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <XCircle className="size-4 text-rose-500" />
                    <span>{result.failed} échec{result.failed > 1 ? "s" : ""}</span>
                  </div>
                )}
                <p className="text-[10px] text-muted-foreground pt-1 border-t border-border">
                  Les messages sont disponibles dans la messagerie privée de chaque membre.
                </p>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => { setProgressOpen(false); setResult(null) }}>
                    Fermer
                  </Button>
                  <Button size="sm" onClick={() => { setProgressOpen(false); setResult(null) }}>
                    Envoyer un autre message
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
