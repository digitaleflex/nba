"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, Badge } from "@nba/design-system"
import { MessageCircle, Loader2, Clock, Mail, ExternalLink } from "lucide-react"

interface SupportMessage {
  id: string
  title: string
  body: string
  createdAt: string
  data: { userId: string; subject: string; message: string } | null
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

export default function AdminSupportPage() {
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch("/api/admin/support")
      .then((r) => {
        if (!r.ok) throw new Error("Erreur de chargement")
        return r.json()
      })
      .then((data) => {
        if (cancelled) return
        setMessages(Array.isArray(data?.messages) ? data.messages : [])
      })
      .catch(() => {
        if (!cancelled) setError("Impossible de charger les messages de support.")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Support</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Messages envoyés par les utilisateurs depuis la page Support.
          </p>
        </div>
        <a
          href="https://t.me/nba_support"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          <ExternalLink className="size-3.5" />
          Telegram
        </a>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <Card className="border-border">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <MessageCircle className="size-10 text-destructive" />
            <div className="space-y-1">
              <p className="font-semibold text-foreground">{error}</p>
              <p className="text-sm text-muted-foreground">
                Réessayez plus tard ou contactez l&apos;équipe technique.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : messages.length === 0 ? (
        <Card className="border-border">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <MessageCircle className="size-10 text-muted-foreground" />
            <div className="space-y-1">
              <p className="font-semibold text-foreground">Aucun message</p>
              <p className="text-sm text-muted-foreground">
                Les messages des utilisateurs apparaîtront ici.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {messages.map((msg) => (
            <Card key={msg.id} className="border-border hover:bg-muted/20 transition-colors">
              <CardContent className="p-5 space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-0.5 min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">
                      {msg.data?.subject || msg.title}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Mail className="size-3" />
                      {(msg.title || "").replace("Support de ", "") || "—"}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    <Clock className="size-3 mr-1" />
                    {formatDate(msg.createdAt)}
                  </Badge>
                </div>
                <p className="text-sm text-foreground/80 whitespace-pre-wrap">
                  {msg.data?.message || msg.body}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
