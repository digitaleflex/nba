"use client"

import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, Input, Button, Badge } from "@nba/design-system"
import { Loader2, Plus, Pencil, Trash2, Flame, Upload, Mic, Video } from "lucide-react"
import { VoiceRecorder } from "./components/voice-recorder"
import { VideoRecorder } from "./components/video-recorder"

type RedpillFormat = "TEXT" | "IMAGE" | "AUDIO" | "VIDEO" | "MIXED"

interface RedpillAdmin {
  id: string
  title: string
  content: string | null
  audioUrl: string | null
  imageUrl: string | null
  videoUrl: string | null
  format: RedpillFormat | null
  series: string | null
  episode: number | null
  isPublished: boolean
  publishedAt: string
  creator?: { name: string | null; email: string }
  _count?: { reads: number }
}

const FORMATS: { key: RedpillFormat; label: string; emoji: string; desc: string }[] = [
  { key: "TEXT", label: "Texte", emoji: "📝", desc: "Message écrit" },
  { key: "IMAGE", label: "Image", emoji: "🖼️", desc: "Visuel + légende" },
  { key: "AUDIO", label: "Audio", emoji: "🎙️", desc: "Note vocale" },
  { key: "VIDEO", label: "Vidéo", emoji: "🎬", desc: "Face caméra" },
]

const emptyForm = { title: "", content: "", audioUrl: "", imageUrl: "", videoUrl: "", format: "TEXT" as RedpillFormat, series: "", episode: "", isPublished: true }

export default function AdminRedpillsPage() {
  const [pills, setPills] = useState<RedpillAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState<"audio" | "image" | "video" | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showRecorder, setShowRecorder] = useState(false)
  const [showVideoRecorder, setShowVideoRecorder] = useState(false)
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null)
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null)
  const [audioTab, setAudioTab] = useState<"record" | "upload">("record")
  const [videoTab, setVideoTab] = useState<"record" | "upload">("record")
  const [form, setForm] = useState(emptyForm)
  const existingSeries = Array.from(new Set(pills.map((p) => p.series).filter(Boolean) as string[]))

  const fetchPills = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/admin/redpills")
      if (!res.ok) throw new Error("Chargement impossible")
      const data = await res.json()
      setPills(Array.isArray(data.redpills) ? data.redpills : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPills()
  }, [fetchPills])

  function startEdit(p: RedpillAdmin) {
    setEditingId(p.id)
    setForm({
      title: p.title,
      content: p.content ?? "",
      audioUrl: p.audioUrl ?? "",
      imageUrl: p.imageUrl ?? "",
      videoUrl: p.videoUrl ?? "",
      format: (p.format ?? "MIXED") as RedpillFormat,
      series: p.series ?? "",
      episode: p.episode != null ? String(p.episode) : "",
      isPublished: p.isPublished,
    })
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(emptyForm)
    setShowRecorder(false)
    setShowVideoRecorder(false)
    setRecordedUrl(null)
    setRecordedVideoUrl(null)
  }

  async function handleUpload(file: File, kind: "audio" | "image" | "video") {
    setUploading(kind === "video" ? "video" : kind)
    try {
      const normalizedType = file.type?.split(";")[0]?.trim().toLowerCase()
      const uploadFile =
        normalizedType && normalizedType !== file.type
          ? new File([file], file.name, { type: normalizedType })
          : file
      const fd = new FormData()
      fd.append("file", uploadFile)
      const res = await fetch("/api/admin/redpills/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Upload échoué")
      setForm((f) => (kind === "audio" ? { ...f, audioUrl: data.path } : kind === "image" ? { ...f, imageUrl: data.path } : { ...f, videoUrl: data.path }))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload échoué")
    } finally {
      setUploading(null)
    }
  }

  async function handleRecordedVideo(blob: Blob) {
    setShowVideoRecorder(false)
    const mime = (blob.type?.split(";")[0]?.trim().toLowerCase() || "video/webm")
    const ext = mime.includes("mp4") ? "mp4" : "webm"
    const url = URL.createObjectURL(blob)
    setRecordedVideoUrl(url)
    setUploading("video")
    try {
      const fd = new FormData()
      fd.append("file", new File([blob], `video.${ext}`, { type: mime }))
      const res = await fetch("/api/admin/redpills/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Upload échoué")
      setForm((f) => ({ ...f, videoUrl: data.path }))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload échoué")
    } finally {
      setUploading(null)
    }
  }

  async function handleRecorded(blob: Blob) {
    setShowRecorder(false)
    const mime = (blob.type?.split(";")[0]?.trim().toLowerCase() || "audio/webm")
    const ext = mime.includes("mp4") ? "m4a" : mime.includes("ogg") ? "ogg" : "webm"
    const url = URL.createObjectURL(blob)
    setRecordedUrl(url)
    setUploading("audio")
    try {
      const fd = new FormData()
      fd.append("file", new File([blob], `note-vocale.${ext}`, { type: mime }))
      const res = await fetch("/api/admin/redpills/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Upload échoué")
      setForm((f) => ({ ...f, audioUrl: data.path }))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload échoué")
    } finally {
      setUploading(null)
    }
  }
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) {
      setError("Le titre est requis")
      return
    }
    setSaving(true)
    setError(null)
    try {
      const ep = parseInt(form.episode, 10)
      const payload = {
        title: form.title.trim(),
        content: form.content.trim() || null,
        audioUrl: form.audioUrl.trim() || null,
        imageUrl: form.imageUrl.trim() || null,
        videoUrl: form.videoUrl.trim() || null,
        format: form.format,
        series: form.series.trim() || null,
        episode: Number.isInteger(ep) && ep > 0 ? ep : null,
        isPublished: form.isPublished,
      }
      const res = await fetch(
        editingId ? `/api/admin/redpills/${editingId}` : "/api/admin/redpills",
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      )
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Sauvegarde impossible")
      }
      cancelEdit()
      await fetchPills()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette pilule ?")) return
    try {
      const res = await fetch(`/api/admin/redpills/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Suppression impossible")
      await fetchPills()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue")
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <Flame className="size-5 text-orange-500" />
          Redpills d&apos;Emerson
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Publie : texte motivation + note vocale (audio) + image. Vidéo : champ prévu, bientôt.
        </p>
      </div>

      {error && (
        <p role="alert" className="text-xs text-rose-600 border border-rose-500/30 bg-rose-500/5 rounded-lg px-4 py-3">
          {error}
        </p>
      )}

      <Card>
        <CardContent className="p-5 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {editingId ? "Modifier la pilule" : "Nouvelle pilule"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Titre de la pilule *"
              className="h-10 text-sm"
            />
            {/* ── Choix du format ── */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Format de la pilule</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {FORMATS.map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, format: f.key }))}
                    className={`rounded-xl border p-2.5 text-left transition-all ${
                      form.format === f.key
                        ? "border-primary bg-primary/10 ring-1 ring-primary/40"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <div className="text-lg">{f.emoji}</div>
                    <div className="text-xs font-bold">{f.label}</div>
                    <div className="text-[10px] text-muted-foreground">{f.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* ── Titre + texte (toujours utiles : titre + légende/texte) ── */}
            {(form.format === "TEXT" || form.format === "IMAGE") && (
              <textarea
                value={form.content}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                placeholder={form.format === "IMAGE" ? "Légende de l'image (optionnel)…" : "Texte motivation…"}
                rows={4}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            )}

            {/* ── Image ── */}
            {form.format === "IMAGE" && (
              <div className="space-y-1.5 rounded-lg border border-dashed border-border p-3">
                <Input
                  value={form.imageUrl}
                  onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                  placeholder="URL image ou chemin uploadé"
                  className="h-9 text-xs"
                />
                <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                  <Upload className="size-3.5" />
                  {uploading === "image" ? "Envoi…" : "Uploader une image"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploading !== null}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleUpload(file, "image")
                      e.target.value = ""
                    }}
                  />
                </label>
                {form.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.imageUrl.startsWith("http") || form.imageUrl.startsWith("/api/files/") ? form.imageUrl : `/api/files/${form.imageUrl}`} alt="Aperçu" className="rounded-lg max-h-40 object-cover" />
                )}
              </div>
            )}

            {/* ── Audio : enregistrer OU uploader ── */}
            {form.format === "AUDIO" && (
              <div className="space-y-2 rounded-lg border border-dashed border-border p-3">
                <div className="flex gap-1 rounded-lg bg-muted/50 p-1 w-fit">
                  {(["record", "upload"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setAudioTab(t)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${audioTab === t ? "bg-background shadow-xs text-foreground" : "text-muted-foreground"}`}
                    >
                      {t === "record" ? "🎙️ Enregistrer" : "📁 Uploader"}
                    </button>
                  ))}
                </div>
                {audioTab === "record" ? (
                  !showRecorder ? (
                    <div className="space-y-2">
                      <Button type="button" size="sm" variant="outline" onClick={() => setShowRecorder(true)} disabled={uploading !== null}>
                        <Mic className="size-3.5 mr-1.5" />
                        Démarrer l'enregistrement
                      </Button>
                      {recordedUrl && <audio controls src={recordedUrl} className="w-full h-8" preload="metadata" />}
                      {form.audioUrl && <p className="text-[11px] text-emerald-600">✓ Note vocale prête : {form.audioUrl}</p>}
                    </div>
                  ) : (
                    <VoiceRecorder onDone={handleRecorded} onCancel={() => setShowRecorder(false)} />
                  )
                ) : (
                  <div className="space-y-1.5">
                    <Input
                      value={form.audioUrl}
                      onChange={(e) => setForm((f) => ({ ...f, audioUrl: e.target.value }))}
                      placeholder="URL audio ou chemin uploadé"
                      className="h-9 text-xs"
                    />
                    <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                      <Upload className="size-3.5" />
                      {uploading === "audio" ? "Envoi…" : "Uploader un fichier audio"}
                      <input
                        type="file"
                        accept="audio/*"
                        className="hidden"
                        disabled={uploading !== null}
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleUpload(file, "audio")
                          e.target.value = ""
                        }}
                      />
                    </label>
                  </div>
                )}
                <textarea
                  value={form.content}
                  onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                  placeholder="Transcription / texte d'accompagnement (optionnel)…"
                  rows={2}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            )}

            {/* ── Vidéo : enregistrer OU uploader ── */}
            {form.format === "VIDEO" && (
              <div className="space-y-2 rounded-lg border border-dashed border-border p-3">
                <div className="flex gap-1 rounded-lg bg-muted/50 p-1 w-fit">
                  {(["record", "upload"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setVideoTab(t)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${videoTab === t ? "bg-background shadow-xs text-foreground" : "text-muted-foreground"}`}
                    >
                      {t === "record" ? "🎬 Filmer" : "📁 Uploader"}
                    </button>
                  ))}
                </div>
                {videoTab === "record" ? (
                  !showVideoRecorder ? (
                    <div className="space-y-2">
                      <Button type="button" size="sm" variant="outline" onClick={() => setShowVideoRecorder(true)} disabled={uploading !== null}>
                        <Video className="size-3.5 mr-1.5" />
                        Démarrer la caméra
                      </Button>
                      {recordedVideoUrl && <video controls src={recordedVideoUrl} className="w-full max-h-48 rounded-lg" preload="metadata" />}
                      {form.videoUrl && <p className="text-[11px] text-emerald-600">✓ Vidéo prête : {form.videoUrl}</p>}
                    </div>
                  ) : (
                    <VideoRecorder onDone={handleRecordedVideo} onCancel={() => setShowVideoRecorder(false)} />
                  )
                ) : (
                  <Input
                    value={form.videoUrl}
                    onChange={(e) => setForm((f) => ({ ...f, videoUrl: e.target.value }))}
                    placeholder="URL vidéo ou chemin uploadé"
                    className="h-9 text-xs"
                  />
                )}
                {videoTab === "upload" && (
                  <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                    <Upload className="size-3.5" />
                    {uploading === "video" ? "Envoi…" : "Uploader un fichier vidéo"}
                    <input
                      type="file"
                      accept="video/*"
                      className="hidden"
                      disabled={uploading !== null}
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleUpload(file, "video")
                        e.target.value = ""
                      }}
                    />
                  </label>
                )}
                <textarea
                  value={form.content}
                  onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                  placeholder="Description (optionnel)…"
                  rows={2}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            )}

            {/* ── Série (optionnel) ── */}
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Input
                  value={form.series}
                  onChange={(e) => setForm((f) => ({ ...f, series: e.target.value }))}
                  placeholder="Série (ex : Discipline 7 jours)"
                  className="h-9 text-xs"
                  list="redpill-series"
                />
                <datalist id="redpill-series">
                  {existingSeries.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </div>
              <div>
                <Input
                  value={form.episode}
                  onChange={(e) => setForm((f) => ({ ...f, episode: e.target.value.replace(/\D/g, "") }))}
                  placeholder="Épisode n° (optionnel)"
                  className="h-9 text-xs"
                  inputMode="numeric"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))}
              />
              Publié immédiatement (décoché = brouillon)
            </label>
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={saving}>
                {saving ? <Loader2 className="size-4 animate-spin mr-1.5" /> : <Plus className="size-4 mr-1.5" />}
                {editingId ? "Mettre à jour" : "Publier"}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" size="sm" onClick={cancelEdit}>
                  Annuler
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {loading ? (
        <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
      ) : pills.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Aucune pilule publiée pour le moment.</p>
      ) : (
        <div className="grid gap-3">
          {pills.map((p) => (
            <Card key={p.id}>
              <CardContent className="p-4 flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{p.title}</span>
                    <Badge variant={p.isPublished ? "default" : "secondary"} className="text-[10px]">
                      {p.isPublished ? "Publié" : "Brouillon"}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {p.format === "TEXT" ? "📝 Texte" : p.format === "IMAGE" ? "🖼️ Image" : p.format === "AUDIO" ? "🎙️ Audio" : p.format === "VIDEO" ? "🎬 Vidéo" : "📦 Mixte"}
                    </Badge>
                    {p.series && (
                      <span className="text-[10px] font-semibold text-violet-600 dark:text-violet-400">
                        📚 {p.series}{p.episode != null ? ` · ép. ${p.episode}` : ""}
                      </span>
                    )}
                    {!!p._count && (
                      <span className="text-[11px] text-muted-foreground">{p._count.reads} lecture(s)</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(p.publishedAt).toLocaleDateString("fr-FR")}
                    {p.audioUrl ? " · 🎙️ audio" : ""}
                    {p.imageUrl ? " · 🖼️ image" : ""}
                    {p.videoUrl ? " · 🎬 vidéo" : ""}
                  </p>
                  {p.content && <p className="text-xs line-clamp-2 whitespace-pre-wrap">{p.content}</p>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => startEdit(p)} aria-label="Modifier">
                    <Pencil className="size-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(p.id)} aria-label="Supprimer">
                    <Trash2 className="size-4 text-rose-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
