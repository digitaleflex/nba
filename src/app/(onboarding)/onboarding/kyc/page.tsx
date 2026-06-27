"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button, Card, CardContent } from "@nba/design-system"
import { FileText, Upload, Camera, RefreshCw, Shield, Check, AlertTriangle, ArrowRight } from "lucide-react"

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

export default function KycPage() {
  const router = useRouter()
  const [documentType, setDocumentType] = useState("ID_CARD")
  const [frontFile, setFrontFile] = useState<File | null>(null)
  const [backFile, setBackFile] = useState<File | null>(null)
  const [selfieBlob, setSelfieBlob] = useState<Blob | null>(null)
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const startCamera = useCallback(async () => {
    setCameraError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setCameraActive(true)
    } catch {
      setCameraError("Impossible d'accéder à la caméra. Vérifiez les autorisations ou utilisez un fichier.")
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    setCameraActive(false)
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
    canvas.toBlob((blob) => {
      if (blob) {
        setSelfieBlob(blob)
        setSelfiePreview(canvas.toDataURL("image/jpeg"))
        stopCamera()
      }
    }, "image/jpeg", 0.92)
  }, [stopCamera])

  const retakeSelfie = useCallback(() => {
    setSelfieBlob(null)
    setSelfiePreview(null)
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

    const form = new FormData()
    form.append("documentType", documentType)
    form.append("front", frontFile)
    if (backFile) form.append("back", backFile)
    form.append("selfie", selfieBlob, "selfie.jpg")

    const res = await fetch("/api/onboarding/kyc", { method: "POST", body: form })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? "Erreur lors de l'envoi")
      setLoading(false)
      return
    }

    router.push("/onboarding/broker")
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
          <FileText className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-semibold">Vérification d&rsquo;identité</h1>
          <p className="text-sm text-muted-foreground">
            Vérification KYC réglementaire obligatoire pour accéder aux services
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm space-y-2">
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
                    className={`rounded-lg border px-3 py-2 text-sm transition-all ${
                      documentType === dt.value
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {dt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Consignes qualité */}
            <div className="rounded-lg bg-muted/30 p-3 space-y-1.5">
              <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <AlertTriangle className="size-3" />
                Consignes pour une photo valide
              </p>
              <ul className="space-y-1">
                {QUALITY_GUIDELINES.map((g) => (
                  <li key={g} className="text-xs text-muted-foreground flex items-start gap-1.5">
                    <Check className="size-3 mt-0.5 shrink-0" />
                    {g}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground mt-1">Taille max : 50 Mo par fichier</p>
            </div>

            {/* Recto */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Recto du document</label>
              <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border p-6 text-sm text-muted-foreground hover:border-primary/50 transition-colors">
                <Upload className="size-6" />
                {frontFile ? frontFile.name : "Cliquez pour télécharger"}
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
                <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border p-6 text-sm text-muted-foreground hover:border-primary/50 transition-colors">
                  <Upload className="size-6" />
                  {backFile ? backFile.name : "Cliquez pour télécharger"}
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
                Cela prouve que vous êtes bien en possession physique du document.
              </p>

              {!selfiePreview && !cameraActive && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={startCamera}
                    className="flex flex-1 cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border p-6 text-sm text-muted-foreground hover:border-primary/50 transition-colors"
                  >
                    <Camera className="size-6" />
                    Ouvrir la caméra
                  </button>
                  <label className="flex flex-1 cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border p-6 text-sm text-muted-foreground hover:border-primary/50 transition-colors">
                    <Upload className="size-6" />
                    Importer une photo
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          setSelfieBlob(file)
                          setSelfiePreview(URL.createObjectURL(file))
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              )}

              {/* Aperçu caméra */}
              {cameraActive && (
                <div className="space-y-3">
                  <div className="relative overflow-hidden rounded-lg bg-black">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-auto" />
                    <canvas ref={canvasRef} className="hidden" />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-48 h-48 rounded-full border-2 border-white/60" />
                    </div>
                  </div>
                  <p className="text-xs text-center text-muted-foreground">
                    Placez votre visage dans le cercle, document à côté, 3 doigts visibles
                  </p>
                  <Button type="button" onClick={captureSelfie} className="w-full h-9">
                    <Camera className="size-4" />
                    Prendre la photo
                  </Button>
                  {cameraError && (
                    <p className="text-xs text-destructive text-center">{cameraError}</p>
                  )}
                </div>
              )}

              {/* Résultat selfie */}
              {selfiePreview && !cameraActive && (
                <div className="space-y-3">
                  <div className="relative overflow-hidden rounded-lg">
                    <img src={selfiePreview} alt="Selfie" className="w-full h-auto" />
                  </div>
                  <Button type="button" variant="outline" onClick={retakeSelfie} className="w-full h-9">
                    <RefreshCw className="size-4" />
                    Reprendre la photo
                  </Button>
                </div>
              )}
            </div>

            {error && (
              <p className="text-sm text-destructive flex items-center gap-1.5 bg-destructive/10 rounded-lg px-3 py-2">
                <span className="size-1.5 rounded-full bg-destructive shrink-0" />
                {error}
              </p>
            )}

            <Button type="submit" className="w-full h-9" disabled={loading}>
              {loading ? "Envoi en cours…" : "Envoyer"}
              <ArrowRight className="size-4" />
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  )
}
