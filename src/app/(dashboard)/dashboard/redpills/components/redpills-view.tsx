"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Card, CardContent, Badge, Button, EmptyState } from "@nba/design-system"
import { Flame, Loader2, Clock, RefreshCw, Volume2 } from "lucide-react"

interface RedpillData {
  id: string
  title: string
  content: string | null
  audioUrl: string | null
  imageUrl: string | null
  videoUrl: string | null
  format: string | null
  series: string | null
  episode: number | null
  publishedAt: string
  read: boolean
}

const FORMAT_LABEL: Record<string, string> = {
  TEXT: "📝 Texte",
  IMAGE: "🖼️ Image",
  AUDIO: "🎙️ Audio",
  VIDEO: "🎬 Vidéo",
}

function fileSrc(url: string): string {
  return url.startsWith("http") || url.startsWith("/api/files/") ? url : `/api/files/${url}`
}

function RedpillCard({ pill, onRead }: { pill: RedpillData; onRead: (id: string) => void }) {
  const markedRef = useRef(false)
  const handlePlay = useCallback(() => {
    if (pill.read || markedRef.current) return
    markedRef.current = true
    onRead(pill.id)
  }, [pill.read, pill.id, onRead])

  return (
    <Card className="relative overflow-hidden border-border/50">
      {!pill.read && (
        <div className="absolute right-3 top-3 z-10">
          <Badge className="bg-primary text-primary-foreground text-[10px] tracking-wider font-bold uppercase px-2 py-0.5">
            Nouveau
          </Badge>
        </div>
      )}
      <CardContent className="p-4 sm:p-5 space-y-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
          <Flame className="size-3.5 text-orange-500 shrink-0" />
          <span className="font-semibold text-foreground">{pill.title}</span>
          {pill.format && FORMAT_LABEL[pill.format] && (
            <Badge variant="outline" className="text-[10px]">{FORMAT_LABEL[pill.format]}</Badge>
          )}
          {pill.series && (
            <span className="text-[10px] font-semibold text-violet-600 dark:text-violet-400">
              📚 {pill.series}{pill.episode != null ? ` · ép. ${pill.episode}` : ""}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="size-3.5 shrink-0" />
          <span>
            {new Date(pill.publishedAt).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>

        {pill.content && (
          <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed break-words">
            {pill.content}
          </p>
        )}

        {pill.imageUrl && (
          <div className="relative overflow-hidden rounded-lg border border-border/60 bg-background/50 aspect-video max-w-md w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={fileSrc(pill.imageUrl)}
              alt={pill.title}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
        )}

        {pill.audioUrl && (
          <div className="rounded-lg border border-border/60 bg-muted/30 p-3 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Volume2 className="size-3.5" />
              Note vocale d&apos;Emerson
            </div>
            <audio
              controls
              preload="metadata"
              playsInline
              className="w-full h-10"
              src={fileSrc(pill.audioUrl)}
              onEnded={handlePlay}
            >
              Votre navigateur ne supporte pas l&apos;audio.
            </audio>
          </div>
        )}

        {pill.videoUrl && (
          <video controls playsInline preload="metadata" className="w-full max-w-md rounded-lg border border-border/60" src={fileSrc(pill.videoUrl)} />
        )}

        {!pill.read && (
          <Button variant="ghost" size="sm" onClick={() => onRead(pill.id)}>
            Marquer comme lu
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

export function RedpillsView() {
  const [pills, setPills] = useState<RedpillData[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPills = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch("/api/dashboard/redpills")
      if (!res.ok) throw new Error("Erreur lors du chargement des pilules")
      const data = await res.json()
      setPills(Array.isArray(data.redpills) ? data.redpills : [])
      setUnreadCount(data.unreadCount ?? 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPills()
  }, [fetchPills])

  const markRead = useCallback(async (id: string) => {
    setPills((prev) => prev.map((p) => (p.id === id ? { ...p, read: true } : p)))
    setUnreadCount((c) => Math.max(0, c - 1))
    try {
      await fetch(`/api/dashboard/redpills/${id}/read`, { method: "POST" })
    } catch {
      // silencieux : le flag local suffit
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive/30">
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <p role="alert" className="font-semibold text-destructive">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchPills}>Réessayer</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Flame className="size-6 text-orange-500" />
            Redpills d'Emerson
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {unreadCount > 0
              ? `${unreadCount} pilule${unreadCount > 1 ? "s" : ""} non lue${unreadCount > 1 ? "s" : ""} — la motivation d'Emerson`
              : "Tu es à jour. Reviens demain pour la prochaine pilule."}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchPills}>
          <RefreshCw className="size-4 mr-1.5" />
          Actualiser
        </Button>
      </div>

      {pills.length === 0 ? (
        <EmptyState
          icon={Flame}
          title="Aucune pilule pour le moment"
          description="Emerson n'a pas encore publié de pilule. Reviens bientôt."
        />
      ) : (
        <div className="grid gap-4">
          {pills.map((pill) => (
            <RedpillCard key={pill.id} pill={pill} onRead={markRead} />
          ))}
        </div>
      )}
    </div>
  )
}
