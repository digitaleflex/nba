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

interface StepKycProps {
  onNext: () => void
}

export function StepKyc({ onNext }: StepKycProps) {
  const [documentType, setDocumentType] = useState("ID_CARD")
  const [frontFile, setFrontFile] = useState<File | null>(null)
  const [backFile, setBackFile] = useState<File | null>(null)
  const [selfieBlob, setSelfieBlob] = useState<Blob | null>(null)
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null)
  const [cameraState, setCameraState] = useState<"idle" | "opening" | "active" | "captured">("idle")
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [flash, setFlash] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState("")
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const startCamera = useCallback(async () => {
    setCameraState("opening")
    setCameraError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setCameraState("active")
    } catch {
      setCameraError("Impossible d'accéder à la caméra. Vérifiez les autorisations ou utilisez un fichier.")
      setCameraState("idle")
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    setCameraState("idle")
  }, [])

  const captureSelfie = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.drawImage(video, 0, 0)
    setFlash(true)
    setTimeout(() => setFlash(false), 200)

    canvas.toBlob((blob) => {
      if (blob) {
        setSelfieBlob(blob)
        setSelfiePreview(canvas.toDataURL("image/jpeg"))
        stopCamera()
        setCameraState("captured")
      }
    }, "image/jpeg", 0.92)
  }, [stopCamera])

  const retakeSelfie = useCallback(() => {
    setSelfieBlob(null)
    setSelfiePreview(null)
    setCameraState("idle")
    startCamera()
  }, [startCamera])

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
      }
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!frontFile) {
      setError("Veuillez sélectionner un document")
      return
    }
    if (!selfieBlob) {
      setError("Veuillez prendre une photo de vous avec votre document")
      return
    }

    setLoading(true)
    setError("")
    setUploadProgress(25)

    const form = new FormData()
    form.append("documentType", documentType)
    form.append("front", frontFile)
    setUploadProgress(50)
    if (backFile) form.append("back", backFile)
    form.append("selfie", selfieBlob, "selfie.jpg")
    setUploadProgress(75)

    const res = await fetch("/api/onboarding/kyc", { method: "POST", body: form })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? "Erreur lors de l'envoi")
      setLoading(false)
      setUploadProgress(0)
      return
    }

    setUploadProgress(100)
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
              <div className="grid grid-cols-3 gap-2">
                {DOCUMENT_TYPES.map((dt) => (
                  <button
                    key={dt.value}
                    type="button"
                    onClick={() => setDocumentType(dt.value)}
                    className={`rounded-lg border px-3 py-2 text-sm transition-all duration-200 ${
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
              <label className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 text-sm transition-all duration-200 ${
                frontFile
                  ? "border-success/50 bg-success/[0.02] text-success"
                  : "border-border text-muted-foreground hover:border-primary/50 hover:bg-primary/[0.02]"
              }`}>
                {frontFile ? <Check className="size-6" /> : <Upload className="size-6" />}
                {frontFile ? (
                  <div className="text-center">
                    <p className="font-medium text-success text-xs">{frontFile.name}</p>
                    <p className="text-xs text-muted-foreground/70 mt-0.5">{(frontFile.size / 1024 / 1024).toFixed(1)} Mo</p>
                  </div>
                ) : (
                  <>
                    <ImageUp className="size-5 -mb-1" />
                    <span>Cliquez pour télécharger</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={(e) => setFrontFile(e.target.files?.[0] ?? null)}
                  className="hidden"
                  required
                />
              </label>
            </div>

            {/* Verso */}
            {documentType !== "PASSPORT" && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  Verso du document <span className="text-muted-foreground font-normal">(obligatoire)</span>
                </label>
                <label className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 text-sm transition-all duration-200 ${
                  backFile
                    ? "border-success/50 bg-success/[0.02] text-success"
                    : "border-border text-muted-foreground hover:border-primary/50 hover:bg-primary/[0.02]"
                }`}>
                  {backFile ? <Check className="size-6" /> : <Upload className="size-6" />}
                  {backFile ? (
                    <div className="text-center">
                      <p className="font-medium text-success text-xs">{backFile.name}</p>
                      <p className="text-xs text-muted-foreground/70 mt-0.5">{(backFile.size / 1024 / 1024).toFixed(1)} Mo</p>
                    </div>
                  ) : (
                    <>
                      <ImageUp className="size-5 -mb-1" />
                      <span>Cliquez pour télécharger</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onChange={(e) => setBackFile(e.target.files?.[0] ?? null)}
                    className="hidden"
                    required
                  />
                </label>
              </div>
            )}

            {/* Selfie avec document */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Selfie avec votre document <span className="text-destructive">*</span>
              </label>
              <p className="text-xs text-muted-foreground">
                Tenez votre document ouvert à côté de votre visage, en laissant apparaître{" "}
                <strong>trois doigts</strong> sur le document (pouce, index, majeur).
              </p>

              {cameraState === "idle" && !selfiePreview && (
                <div className="flex gap-2 animate-in fade-in duration-300">
                  <button
                    type="button"
                    onClick={startCamera}
                    className="flex flex-1 cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border p-6 text-sm text-muted-foreground hover:border-primary/50 hover:bg-primary/[0.02] transition-all duration-200"
                  >
                    <Camera className="size-6" />
                    <span>Ouvrir la caméra</span>
                  </button>
                  <label className="flex flex-1 cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border p-6 text-sm text-muted-foreground hover:border-primary/50 hover:bg-primary/[0.02] transition-all duration-200">
                    <Upload className="size-6" />
                    <span>Importer une photo</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          setSelfieBlob(file)
                          setSelfiePreview(URL.createObjectURL(file))
                          setCameraState("captured")
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              )}

              {cameraState === "opening" && (
                <div className="flex flex-col items-center gap-3 rounded-lg border-2 border-dashed border-border p-8 animate-in fade-in duration-300">
                  <div className="animate-pulse-glow rounded-full p-4">
                    <Loader2 className="size-8 text-primary animate-spin" />
                  </div>
                  <p className="text-sm text-muted-foreground">Initialisation de la caméra…</p>
                  <p className="text-xs text-muted-foreground/70">Autorisez l&rsquo;accès à la caméra si demandé</p>
                </div>
              )}

              {cameraState === "active" && (
                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="relative overflow-hidden rounded-lg bg-black">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-auto" />
                    <canvas ref={canvasRef} className="hidden" />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-48 h-48 rounded-full border-2 border-white/50 animate-pulse-glow" />
                    </div>
                    {flash && (
                      <div className="absolute inset-0 bg-white animate-in fade-out duration-200" />
                    )}
                  </div>
                  <p className="text-xs text-center text-muted-foreground">
                    Placez votre visage dans le cercle, document à côté, 3 doigts visibles
                  </p>
                  <Button type="button" onClick={captureSelfie} className="w-full h-9 animate-in fade-in duration-300">
                    <Camera className="size-4" />
                    Prendre la photo
                  </Button>
                  {cameraError && (
                    <p className="text-xs text-destructive text-center bg-destructive/10 rounded-lg px-3 py-2 animate-in fade-in duration-200">
                      {cameraError}
                    </p>
                  )}
                </div>
              )}

              {cameraState === "captured" && selfiePreview && (
                <div className="space-y-3 animate-in fade-in zoom-in-95 duration-300">
                  <div className="relative overflow-hidden rounded-lg ring-2 ring-success/30">
                    <img src={selfiePreview} alt="Selfie" className="w-full h-auto" />
                    <div className="absolute top-2 right-2 flex items-center gap-1.5 rounded-full bg-success/90 px-2.5 py-1 text-xs font-medium text-white animate-in fade-in slide-in-from-right duration-300">
                      <Check className="size-3" />
                      Photo prise
                    </div>
                  </div>
                  <Button type="button" variant="outline" onClick={retakeSelfie} className="w-full h-9 group">
                    <RefreshCw className="size-4 transition-transform duration-300 group-hover:rotate-180" />
                    Reprendre la photo
                  </Button>
                </div>
              )}
            </div>

            {error && (
              <p className="text-sm text-destructive flex items-center gap-1.5 bg-destructive/10 rounded-lg px-3 py-2 animate-in fade-in slide-in-from-top-1 duration-200">
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
