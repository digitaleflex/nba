"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, Button, Badge, cn } from "@nba/design-system"
import { MessageCircle, Loader2, Clock, Mail, ChevronLeft, Send, CheckCircle2, AlertCircle, Circle } from "lucide-react"
import { toast } from "sonner"

interface SupportTicket {
  id: string
  title: string
  body: string
  createdAt: string
  user: { id: string; name: string; email: string } | null
  data: {
    subject?: string
    message?: string
    adminResponse?: string
    status?: string
    respondedAt?: string
    respondedBy?: string
    [key: string]: unknown
  } | null
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Circle }> = {
  OPEN: { label: "Ouvert", color: "text-amber-600 border-amber-500/20 bg-amber-500/10", icon: Circle },
  IN_PROGRESS: { label: "En cours", color: "text-blue-600 border-blue-500/20 bg-blue-500/10", icon: Clock },
  CLOSED: { label: "Fermé", color: "text-emerald-600 border-emerald-500/20 bg-emerald-500/10", icon: CheckCircle2 },
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("fr-FR", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<SupportTicket | null>(null)
  const [reply, setReply] = useState("")
  const [nextStatus, setNextStatus] = useState("IN_PROGRESS")
  const [sending, setSending] = useState(false)

  const fetchTickets = () => {
    fetch("/api/admin/support")
      .then((r) => { if (!r.ok) throw new Error("Erreur"); return r.json() })
      .then((data) => setTickets(Array.isArray(data?.messages) ? data.messages : []))
      .catch(() => setError("Impossible de charger les tickets."))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchTickets() }, [])

  const handleSendReply = async () => {
    if (!selected || !reply.trim()) return
    setSending(true)
    try {
      const res = await fetch(`/api/admin/support/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminResponse: reply, status: nextStatus }),
      })
      if (!res.ok) throw new Error("Erreur d'envoi")
      toast.success("Réponse envoyée au membre")
      setReply("")
      setSelected(null)
      fetchTickets()
    } catch {
      toast.error("Erreur lors de l'envoi de la réponse")
    } finally {
      setSending(false)
    }
  }

  const openCount = tickets.filter((t) => {
    const sd = (t.data ?? {}) as Record<string, unknown>
    return !sd.status || sd.status === "OPEN"
  }).length

  if (selected) {
    const d = (selected.data ?? {}) as Record<string, unknown>
    const status = (d.status as string) || "OPEN"
    const sc = STATUS_CONFIG[status] ?? STATUS_CONFIG.OPEN
    const StatusIcon = sc.icon

    return (
      <div className="space-y-6">
        <button onClick={() => setSelected(null)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="size-4" /> Retour aux tickets
        </button>

        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
               <h1 className="text-lg font-bold text-foreground">{d.subject as string || selected.title}</h1>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                <span className="font-semibold text-foreground/80">{selected.user?.name || "Inconnu"}</span>
                <span className="text-muted-foreground/60">·</span>
                <a href={`/admin?tab=members&search=${selected.user?.email}`} className="hover:text-foreground transition-colors underline underline-offset-2 decoration-dotted">
                  {selected.user?.email || ""}
                </a>
                {selected.user?.id && (
                  <>
                    <span className="text-muted-foreground/60">·</span>
                    <code className="text-[10px] bg-accent/30 px-1.5 py-0.5 rounded font-mono">{selected.user.id.slice(0, 8)}…</code>
                  </>
                )}
                <span className="text-muted-foreground/60">·</span>
                <span>{formatDate(selected.createdAt)}</span>
              </p>
            </div>
            <Badge variant="outline" className={cn("text-[10px] shrink-0", sc.color)}>
              <StatusIcon className="size-3 mr-1" />{sc.label}
            </Badge>
          </div>

          <div className="flex items-center justify-between gap-3 px-1">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Message du membre</p>
            {selected.user?.id && (
              <div className="flex gap-2">
                <a
                  href={`/admin?tab=fraud`}
                  className="text-[10px] text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
                >
                  Voir Anti-Fraude
                </a>
              </div>
            )}
          </div>
          <Card className="border-border bg-card/30">
            <CardContent className="p-5">
              <p className="text-sm text-foreground/85 whitespace-pre-wrap">{d.message as string || selected.body}</p>
            </CardContent>
          </Card>

          {(d.adminResponse as string) && (
            <Card className="border-emerald-500/20 bg-emerald-500/5">
              <CardContent className="p-5 space-y-1.5">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                  Réponse de {d.respondedBy as string || "Admin"} · {d.respondedAt ? formatDate(d.respondedAt as string) : ""}
                </p>
                <p className="text-sm text-foreground/85 whitespace-pre-wrap">{d.adminResponse as string}</p>
              </CardContent>
            </Card>
          )}

          {status !== "CLOSED" && (
            <Card className="border-border bg-card/30">
              <CardContent className="p-5 space-y-4">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {d.adminResponse ? "Modifier la réponse" : "Répondre au membre"}
                </p>
                <textarea
                  className="min-h-28 w-full rounded-lg border border-border bg-background p-3 text-sm text-foreground resize-y focus:outline-none focus:border-primary/50"
                  placeholder="Votre réponse sera envoyée par email au membre..."
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                />
                <div className="flex items-center gap-3">
                  <select
                    className="text-xs rounded-lg border border-border bg-background px-3 py-1.5 text-foreground cursor-pointer"
                    value={nextStatus}
                    onChange={(e) => setNextStatus(e.target.value)}
                  >
                    <option value="IN_PROGRESS">Marquer « En cours »</option>
                    <option value="CLOSED">Marquer « Fermé »</option>
                  </select>
                  <Button
                    variant="default"
                    size="sm"
                    className="cursor-pointer"
                    disabled={!reply.trim() || sending}
                    onClick={handleSendReply}
                  >
                    {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                    <span className="ml-1.5">{sending ? "Envoi..." : "Envoyer"}</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Support</h1>
          <p className="text-xs text-muted-foreground mt-1">
            {openCount} ticket{openCount !== 1 ? "s" : ""} ouvert{openCount !== 1 ? "s" : ""} — Messages des membres.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="size-6 animate-spin text-primary" /></div>
      ) : error ? (
        <Card className="border-border"><CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <AlertCircle className="size-10 text-destructive" />
          <p className="font-semibold text-foreground">{error}</p>
        </CardContent></Card>
      ) : tickets.length === 0 ? (
        <Card className="border-border"><CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <MessageCircle className="size-10 text-muted-foreground" />
          <p className="font-semibold text-foreground">Aucun ticket</p>
          <p className="text-sm text-muted-foreground">Les demandes des membres apparaîtront ici.</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          {tickets.map((ticket) => {
            const d = (ticket.data ?? {}) as Record<string, unknown>
            const status = (d.status as string) || "OPEN"
            const sc = STATUS_CONFIG[status] ?? STATUS_CONFIG.OPEN
            const StatusIcon = sc.icon
            const hasResponse = !!d.adminResponse

            return (
              <button
                key={ticket.id}
                onClick={() => setSelected(ticket)}
                className="w-full text-left"
              >
                <Card className="border-border hover:bg-muted/20 transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-semibold text-sm text-foreground truncate">
                            {d.subject as string || ticket.title}
                          </p>
                          {hasResponse && <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />}
                        </div>
                         <p className="text-xs text-muted-foreground truncate flex items-center gap-1.5">
                          <span className="font-medium">{ticket.user?.name || "Inconnu"}</span>
                          <span className="text-muted-foreground/50">·</span>
                          <span>{ticket.user?.email || ""}</span>
                          {ticket.user?.id && (
                            <code className="text-[10px] bg-accent/30 px-1 py-0.5 rounded font-mono text-muted-foreground/70">
                              #{ticket.user.id.slice(0, 8)}
                            </code>
                          )}
                        </p>
                        <p className="text-xs text-foreground/70 mt-1 line-clamp-2">
                          {d.message as string || ticket.body}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <Badge variant="outline" className={cn("text-[10px]", sc.color)}>
                          <StatusIcon className="size-3 mr-1" />{sc.label}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">{formatDate(ticket.createdAt)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
