"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Input } from "@nba/design-system"
import { toast } from "sonner"
import { KeyRound, Loader2 } from "lucide-react"

export default function VerifyDevicePage() {
  const router = useRouter()
  const [code, setCode] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) {
      toast.error("Veuillez saisir un code")
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch("/api/dashboard/devices/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      })
      const data = (await res.json()) as { ok?: boolean; error?: string }
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Code invalide ou expiré")
      }
      toast.success("Appareil vérifié avec succès")
      router.push("/dashboard/devices")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec de la vérification")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="size-5 text-primary" />
            Vérifier un appareil
          </CardTitle>
          <CardDescription>
            Saisissez le code à 6 chiffres reçu par email pour valider cet
            appareil.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              inputMode="numeric"
              maxLength={6}
              autoComplete="one-time-code"
              className="text-center text-lg tracking-[0.5em]"
              aria-label="Code de vérification"
            />
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Vérification...
                </>
              ) : (
                "Vérifier"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
