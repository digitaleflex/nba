"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button, Card, CardContent } from "@nba/design-system"
import { FileText, Upload, ArrowRight } from "lucide-react"

const DOCUMENT_TYPES = [
  { value: "ID_CARD", label: "Carte Nationale" },
  { value: "PASSPORT", label: "Passeport" },
  { value: "DRIVERS_LICENSE", label: "Permis de conduire" },
]

export default function KycPage() {
  const router = useRouter()
  const [documentType, setDocumentType] = useState("ID_CARD")
  const [frontFile, setFrontFile] = useState<File | null>(null)
  const [backFile, setBackFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!frontFile) {
      setError("Veuillez sélectionner un document")
      return
    }

    setLoading(true)
    setError("")

    const form = new FormData()
    form.append("documentType", documentType)
    form.append("front", frontFile)
    if (backFile) form.append("back", backFile)

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
            Fournissez un document officiel pour vérifier votre identité
          </p>
        </div>
      </div>

      <Card size="sm" className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 pt-6">
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

            {documentType !== "PASSPORT" && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Verso du document (optionnel)</label>
                <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border p-6 text-sm text-muted-foreground hover:border-primary/50 transition-colors">
                  <Upload className="size-6" />
                  {backFile ? backFile.name : "Cliquez pour télécharger"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onChange={(e) => setBackFile(e.target.files?.[0] ?? null)}
                    className="hidden"
                  />
                </label>
              </div>
            )}

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
