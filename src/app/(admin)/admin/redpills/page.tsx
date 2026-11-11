"use client"

import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, Input, Button, Badge } from "@nba/design-system"
import { Loader2, Plus, Pencil, Trash2, Flame, Upload, Mic } from "lucide-react"
import { VoiceRecorder } from "./components/voice-recorder"

interface RedpillAdmin {
  id: string
  title: string
  content: string | null
  audioUrl: string | null
  imageUrl: string | null
  videoUrl: string | null
  isPublished: boolean
  publishedAt: string
  creator?: { name: string | null; email: string }
  _count?: { reads: number }
}

const emptyForm = { title: "", content: "", audioUrl: "", imageUrl: "", videoUrl: "", isPublished: true }

export default function AdminRedpillsPage() {
  const [pills, setPills] = useState<RedpillAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState<"audio" | "image" | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showRecorder, setShowRecorder] = useState(false)
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)

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
      isPublished: p.isPublished,
    })
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(emptyForm)
  }

  async function handleUpload(file: File, kind: "audio" | "image") {
    setUploading(kind)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/admin/redpills/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Upload échoué")
      setForm((f) => (kind === "audio" ? { ...f, audioUrl: data.path } : { ...f, imageUrl: data.path }))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload échoué")
    } finally {
      setUploading(null)
    }
  }

  async function handleRecorded(blob: Blob) {
    setShowRecorder(false)
    const ext = blob.type.includes("mp4") ? "m4a" : blob.type.includes("ogg") ? "ogg" : "webm"
    const url = URL.createObjectURL(blob)
    setRecordedUrl(url)
    setUploading("audio")
    try {
      const fd = new FormData()
      fd.append("file", new File([blob], `note-vocale.${ext}`, { type: blob.type }))
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
      const payload = {
        title: form.title.trim(),
        content: form.content.trim() || null,
        audioUrl: form.audioUrl.trim() || null,
        imageUrl: form.imageUrl.trim() || null,
        videoUrl: form.videoUrl.trim() || null,
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
            <textarea
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              placeholder="Texte motivation…"
              rows={4}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Input
                  value={form.audioUrl}
                  onChange={(e) => setForm((f) => ({ ...f, audioUrl: e.target.value }))}
                  placeholder="URL audio ou chemin uploadé"
                  className="h-9 text-xs"
                />
                <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                  <Upload className="size-3.5" />
                  {uploading === "audio" ? "Envoi…" : "Uploader un audio"}
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
                {!showRecorder ? (
                  <button
                    type="button"
                    onClick={() => setShowRecorder(true)}
                    disabled={uploading !== null}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 cursor-pointer hover:text-rose-700 disabled:opacity-50"
                  >
                    <Mic className="size-3.5" />
                    Enregistrer au micro
                  </button>
                ) : (
                  <VoiceRecorder
                    onDone={handleRecorded}
                    onCancel={() => setShowRecorder(false)}
                  />
                )}
                {recordedUrl && !showRecorder && (
                  <audio controls src={recordedUrl} className="w-full h-8" preload="metadata" />
                )}
              </div>
              <div className="space-y-1.5">
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
              </div>
            </div>
            <Input
              value={form.videoUrl}
              onChange={(e) => setForm((f) => ({ ...f, videoUrl: e.target.value }))}
              placeholder="URL vidéo (bientôt — champ prévu)"
              className="h-9 text-xs"
            />
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
