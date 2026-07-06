"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button, Card, CardContent } from "@nba/design-system"
import { FileText, Upload, Camera, RefreshCw, Shield, Check, ArrowRight, Loader2, Scan, ImageUp } from "lucide-react"

const DOCUMENT_TYPES = [
  { value: "ID_CARD", label: "Carte Nationale" },
  { value: "PASSPORT", label: "Passeport" },
  { value: "DRIVERS_LICENSE", label: "Permis de conduire" },
]

const QUALITY_GUIDELINES = [
  "Document complet, 4 coins visibles",
  "Texte et photo parfaitement lisibles",
  "Pas de reflets ni de flash",
  "Pas de doigts sur les informations",
  "Bon éclairage, fond neutre",
]

const DB_NAME = "kyc-draft-store"
const STORE_NAME = "drafts"

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB non supporté"))
      return
    }
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function getDraft(key: string): Promise<any> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly")
      const store = transaction.objectStore(STORE_NAME)
      const request = store.get(key)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  } catch {
    return null
  }
}

async function saveDraft(key: string, value: any): Promise<void> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite")
      const store = transaction.objectStore(STORE_NAME)
      const request = store.put(value, key)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  } catch (err) {
    console.error("Failed to save draft", err)
  }
}

async function deleteDraft(key: string): Promise<void> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite")
      const store = transaction.objectStore(STORE_NAME)
      const request = store.delete(key)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  } catch (err) {
    console.error("Failed to delete draft", err)
  }
}

async function clearDrafts(): Promise<void> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite")
      const store = transaction.objectStore(STORE_NAME)
      const request = store.clear()
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  } catch (err) {
    console.error("Failed to clear drafts", err)
  }
}

function DocumentPreview({ file }: { file: File }) {
  const isImage = file.type.startsWith("image/")
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!isImage) return
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file, isImage])

  if (isImage && previewUrl) {
    return (
      <div className="relative w-full max-w-[120px] aspect-[4/3] rounded-lg overflow-hidden border border-border mx-auto shadow-sm animate-in zoom-in-95 duration-200">
        <img src={previewUrl} alt={file.name} className="w-full h-full object-cover" />
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-1 p-2 bg-muted/40 rounded-lg max-w-[160px] mx-auto border border-border/50 shadow-sm animate-in zoom-in-95 duration-200">
      <FileText className="size-6 text-muted-foreground" />
      <span className="text-[10px] font-medium text-foreground truncate max-w-[120px]">{file.name}</span>
      <span className="text-[9px] text-muted-foreground">{(file.size / 1024 / 1024).toFixed(1)} Mo</span>
    </div>
  )
}

interface StepKycProps {
  onNext: () => void
}
export function StepKyc({ onNext }: StepKycProps) {
  const [documentType, setDocumentType] = useState("ID_CARD")
  const [frontFile, setFrontFile] = useState<File | null>(null)
  const [backFile, setBackFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState("")
  const [isInitialized, setIsInitialized] = useState(false)

  // 1. Charger les brouillons depuis IndexedDB au montage
  useEffect(() => {
    async function loadDrafts() {
      try {
        const type = await getDraft("documentType")
        const front = await getDraft("frontFile")
        const back = await getDraft("backFile")

        if (type) setDocumentType(type)
        if (front) setFrontFile(front)
        if (back) setBackFile(back)
      } catch (err) {
        console.error("Erreur lors du chargement des brouillons KYC :", err)
      } finally {
        setIsInitialized(true)
      }
    }
    loadDrafts()
  }, [])

  // 2. Synchroniser les brouillons vers IndexedDB
  useEffect(() => {
    if (!isInitialized) return
    saveDraft("documentType", documentType)
  }, [documentType, isInitialized])

  useEffect(() => {
    if (!isInitialized) return
    if (frontFile) {
      saveDraft("frontFile", frontFile)
    } else {
      deleteDraft("frontFile")
    }
  }, [frontFile, isInitialized])

  useEffect(() => {
    if (!isInitialized) return
    if (backFile) {
      saveDraft("backFile", backFile)
    } else {
      deleteDraft("backFile")
    }
  }, [backFile, isInitialized])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!frontFile) {
      setError("Veuillez sélectionner le recto de votre document")
      return
    }
    if (documentType !== "PASSPORT" && !backFile) {
      setError("Veuillez sélectionner le verso de votre document")
      return
    }

    setLoading(true)
    setError("")
    setUploadProgress(25)

    const form = new FormData()
    form.append("documentType", documentType)
    form.append("front", frontFile)
    setUploadProgress(60)
    if (backFile) form.append("back", backFile)
    setUploadProgress(80)

    const res = await fetch("/api/onboarding/kyc", { method: "POST", body: form })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? "Erreur lors de l'envoi")
      setLoading(false)
      setUploadProgress(0)
      return
    }

    setUploadProgress(100)
    await clearDrafts()
    setTimeout(() => {
      onNext()
    }, 400)
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 animate-float">
          <FileText className="size-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Vérification d&rsquo;identité</h2>
          <p className="text-sm text-muted-foreground">
            Vérification KYC réglementaire obligatoire pour accéder aux services
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm space-y-2 animate-float">
        <div className="flex items-center gap-2 text-primary font-medium">
          <Shield className="size-4" />
          <span>Protection de vos données</span>
        </div>
        <p className="text-muted-foreground">
          Vos documents et votre photo sont utilisés <strong>uniquement</strong> pour la vérification
          d&rsquo;identité obligatoire (KYC). Ils sont chiffrés, jamais partagés avec des tiers, et
          définitivement supprimés de nos serveurs dans les <strong>30 jours suivant la fin de la vérification</strong>.
        </p>
      </div>

      <Card size="sm" className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6 pt-6">
            {/* Type de document */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Type de document</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {DOCUMENT_TYPES.map((dt) => (
                  <button
                    key={dt.value}
                    type="button"
                    onClick={() => setDocumentType(dt.value)}
                    className={`rounded-lg border px-3 py-2 text-xs sm:text-sm transition-all duration-200 ${
                      documentType === dt.value
                        ? "border-primary bg-primary/5 text-primary ring-1 ring-primary/20"
                        : "border-border text-muted-foreground hover:border-primary/50 hover:bg-primary/[0.02]"
                    }`}
                  >
                    {dt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Consignes qualité */}
            <div className="rounded-lg bg-muted/30 p-3 space-y-1.5 border border-border/50">
              <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <Scan className="size-3" />
                Consignes pour une photo valide
              </p>
              <ul className="space-y-1">
                {QUALITY_GUIDELINES.map((g) => (
                  <li key={g} className="text-xs text-muted-foreground flex items-start gap-1.5">
                    <Check className="size-3 mt-0.5 shrink-0 text-primary/60" />
                    {g}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground/70 mt-1">Taille max : 50 Mo par fichier</p>
            </div>

            {/* Recto */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Recto du document</label>
              <label
                className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-4 text-sm transition-all duration-200 ${
                  frontFile
                    ? "border-success/30 bg-success/[0.01]"
                    : "border-border text-muted-foreground hover:border-primary/50 hover:bg-primary/[0.02]"
                }`}
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.currentTarget.querySelector("input")?.click(); } }}
              >
                {frontFile ? (
                  <div className="text-center space-y-2">
                    <DocumentPreview file={frontFile} />
                    <span className="text-xs text-muted-foreground underline block hover:text-foreground">Changer de fichier</span>
                  </div>
                ) : (
                  <>
                    <ImageUp className="size-6 text-muted-foreground animate-pulse" />
                    <span>Cliquez pour télécharger</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={(e) => setFrontFile(e.target.files?.[0] ?? null)}
                  className="hidden"
                />
              </label>
            </div>

            {/* Verso */}
            {documentType !== "PASSPORT" && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  Verso du document <span className="text-muted-foreground font-normal">(obligatoire)</span>
                </label>
                <label
                  className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-4 text-sm transition-all duration-200 ${
                    backFile
                      ? "border-success/30 bg-success/[0.01]"
                      : "border-border text-muted-foreground hover:border-primary/50 hover:bg-primary/[0.02]"
                  }`}
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.currentTarget.querySelector("input")?.click(); } }}
                >
                  {backFile ? (
                    <div className="text-center space-y-2">
                      <DocumentPreview file={backFile} />
                      <span className="text-xs text-muted-foreground underline block hover:text-foreground">Changer de fichier</span>
                    </div>
                  ) : (
                    <>
                      <ImageUp className="size-6 text-muted-foreground animate-pulse" />
                      <span>Cliquez pour télécharger</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onChange={(e) => setBackFile(e.target.files?.[0] ?? null)}
                    className="hidden"
                  />
                </label>
              </div>
            )}

            {/* Selfie supprimé pour validation rapide */}

            {error && (
              <p role="alert" className="text-sm text-destructive flex items-center gap-1.5 bg-destructive/10 rounded-lg px-3 py-2 animate-in fade-in slide-in-from-top-1 duration-200">
                <span className="size-1.5 rounded-full bg-destructive shrink-0" />
                {error}
              </p>
            )}

            {/* Barre de progression upload */}
            {loading && uploadProgress > 0 && (
              <div className="space-y-1 animate-in fade-in duration-200">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Envoi en cours…</span>
                  <span className="text-muted-foreground">{uploadProgress}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                    role="progressbar"
                    aria-valuenow={uploadProgress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>
              </div>
            )}

            <Button type="submit" className="w-full h-9 transition-all duration-200" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  Envoi en cours…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Envoyer
                  <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </span>
              )}
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  )
}
