"use client"

import { useEffect, useState } from "react"
import { Loader2, Star, PenLine } from "lucide-react"
import { Button, cn, EmptyState } from "@nba/design-system"
import { toast } from "sonner"

const MOODS = [
  { value: "CONFIDENT", emoji: "😊", label: "Confiant" },
  { value: "NEUTRAL", emoji: "😐", label: "Neutre" },
  { value: "ANXIOUS", emoji: "😰", label: "Anxieux" },
  { value: "FEARFUL", emoji: "😨", label: "Peur" },
  { value: "GREEDY", emoji: "🤑", label: "Gourmand" },
  { value: "REVENGE", emoji: "😡", label: "Revenge" },
]

interface Reflection {
  id: string
  date: string
  rating: number
  mood: string | null
  tradeCount: number
  wins: number
  losses: number
  totalPnl: string | null
  note: string | null
}

export function ReflectionsTab() {
  const [reflections, setReflections] = useState<Reflection[]>([])
  const [loading, setLoading] = useState(true)

  // Formulaire aujourd'hui
  const [rating, setRating] = useState(0)
  const [mood, setMood] = useState<string | null>(null)
  const [note, setNote] = useState("")
  const [saving, setSaving] = useState(false)

  const today = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    fetch("/api/dashboard/journal/reflections")
      .then(r => r.json())
      .then(d => {
        setReflections(d.reflections ?? [])
        const t = (d.reflections ?? []).find((r: Reflection) => r.date.slice(0, 10) === today)
        if (t) { setRating(t.rating); setMood(t.mood); setNote(t.note ?? "") }
      })
      .finally(() => setLoading(false))
  }, [today])

  async function saveReflection() {
    if (rating === 0) return toast.error("Donne une note à ta journée")
    setSaving(true)
    try {
      const res = await fetch("/api/dashboard/journal/reflections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: today, rating, mood: mood || undefined, note: note || undefined }),
      })
      if (!res.ok) throw new Error("Erreur")
      toast.success("Réflexion enregistrée")
      const data = await res.json()
      setReflections(prev => {
        const idx = prev.findIndex(r => r.date.slice(0, 10) === today)
        if (idx >= 0) { const updated = [...prev]; updated[idx] = data.reflection; return updated }
        return [data.reflection, ...prev]
      })
    } catch {
      toast.error("Erreur")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="size-6 animate-spin text-primary" /></div>

  return (
    <div className="space-y-6">
      {/* Formulaire aujourd'hui */}
      <div id="reflection-form" className="rounded-lg border bg-card p-6">
        <h2 className="font-semibold mb-4">📅 Aujourd'hui — {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</h2>

        {/* Note 1-10 */}
        <div className="mb-4">
          <p className="text-sm text-muted-foreground mb-2">Note de la journée</p>
          <div className="flex gap-1">
            {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
              <button
                key={n}
                onClick={() => setRating(n)}
                className={cn(
                  "size-9 rounded-lg text-sm font-medium transition-colors",
                  n <= rating ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted",
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Mood */}
        <div className="mb-4">
          <p className="text-sm text-muted-foreground mb-2">Émotion dominante</p>
          <div className="flex gap-2">
            {MOODS.map(m => (
              <button
                key={m.value}
                onClick={() => setMood(mood === m.value ? null : m.value)}
                className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-lg transition-all text-xs",
                  mood === m.value ? "bg-primary/10 ring-1 ring-primary/30 scale-105" : "bg-muted/30 hover:bg-muted/50 text-muted-foreground",
                )}
              >
                <span className="text-xl">{m.emoji}</span>
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Note */}
        <div className="mb-4">
          <p className="text-sm text-muted-foreground mb-2">Note libre</p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Qu'as-tu appris aujourd'hui ? Qu'est-ce qui s'est bien/mal passé ?"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground resize-none h-20"
            maxLength={1000}
          />
        </div>

        <Button onClick={saveReflection} disabled={saving} className="w-full">
          {saving ? "Enregistrement..." : "Enregistrer ma réflexion"}
        </Button>
      </div>

      {/* Historique */}
      {reflections.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Réflexions passées</h3>
          {reflections.map(r => (
            <div key={r.id} className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs text-muted-foreground">{new Date(r.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}</span>
                <div className="flex gap-0.5">
                  {Array.from({ length: 10 }, (_, i) => (
                    <Star key={i} className={cn("size-3", i < r.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20")} />
                  ))}
                </div>
                {r.mood && <span className="text-lg">{MOODS.find(m => m.value === r.mood)?.emoji}</span>}
                <span className="text-xs text-muted-foreground ml-auto">{r.tradeCount} trades</span>
              </div>
              {r.note && <p className="text-xs text-muted-foreground line-clamp-3">{r.note}</p>}
              <div className="flex gap-3 text-xs text-muted-foreground/60 mt-1">
                <span>{r.wins}W {r.losses}L</span>
                {r.totalPnl && <span className={Number(r.totalPnl) >= 0 ? "text-emerald-400" : "text-rose-400"}>{Number(r.totalPnl) >= 0 ? "+" : ""}{Number(r.totalPnl).toFixed(0)}€</span>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        !loading && (
          <EmptyState
            icon={PenLine}
            title="Aucune réflexion passée"
            description="Prends 2 minutes chaque jour pour noter ton état d'esprit. Les traders qui tiennent un journal progressent plus vite."
          />
        )
      )}
    </div>
  )
}
