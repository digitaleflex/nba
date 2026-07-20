"use client"

import { useState } from "react"
import { Card, CardContent, Button, Input } from "@nba/design-system"
import { Send, Check, Loader2 } from "lucide-react"
import { apiFetch, getErrorMessage } from "@nba/lib/fetch-client"

export default function SupportPage() {
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    setError(null)
    try {
      await apiFetch("/api/dashboard/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message }),
      })
      setSent(true)
      setSubject("")
      setMessage("")
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Support</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Besoin d&apos;aide ? Envoie-nous un message.
        </p>
      </div>

      <Card className="border-border">
        <CardContent className="p-6">
          {sent ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <div className="size-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <Check className="size-6 text-emerald-500" />
              </div>
              <p className="font-semibold text-foreground">Message envoyé !</p>
              <p className="text-sm text-muted-foreground">
                Notre équipe te répondra dans les plus brefs délais.
              </p>
              <Button variant="outline" size="sm" onClick={() => setSent(false)}>
                Envoyer un autre message
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Sujet</label>
                <Input
                  placeholder="Ex: Problème de connexion, question abonnement..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  className="bg-background border-border text-foreground"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Message</label>
                <textarea
                  placeholder="Décris ton problème ou ta question..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={6}
                  className="w-full p-3 text-sm rounded-xl border bg-background border-border text-foreground outline-none focus:border-primary/50 resize-y min-h-32"
                />
              </div>

              {error && (
                <p role="alert" className="text-sm text-destructive">{error}</p>
              )}

              <Button type="submit" disabled={sending || !subject.trim() || !message.trim()} className="w-full gap-2">
                {sending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
                {sending ? "Envoi..." : "Envoyer"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

    </div>
  )
}
