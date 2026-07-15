"use client"

import { useState } from "react"
import { cn } from "@nba/design-system"

interface UserSignal {
  signalId: string
  signalTitle: string
  publishedAt: string
  plans: string
  plan: string
  emailBucket: string
  emailEvent: string | null
  pushStatus: string | null
  inAppRead: boolean
}

interface UserInfo {
  id: string
  name: string
  email: string
  signals: UserSignal[]
}

export function UserTimeline({ users }: { users: UserInfo[] }) {
  const [query, setQuery] = useState("")
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  const filtered = query
    ? users.filter(
        (u) =>
          u.name.toLowerCase().includes(query.toLowerCase()) ||
          u.email.toLowerCase().includes(query.toLowerCase()),
      )
    : []

  const selected = users.find((u) => u.id === selectedUserId)

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-muted/30">
        <h2 className="font-semibold">Timeline individuelle</h2>
        <p className="text-xs text-muted-foreground">
          Recherchez un utilisateur pour voir tous les signaux qu&apos;il a reçus
        </p>
      </div>

      <div className="p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedUserId(null)
            }}
            placeholder="Nom ou email..."
            className="h-9 w-full rounded-lg border border-border bg-background px-3 text-xs outline-none focus:border-primary"
          />
          {query && filtered.length > 0 && !selectedUserId && (
            <div className="absolute top-full left-0 right-0 mt-1 rounded-lg border border-border bg-background shadow-lg z-10 max-h-48 overflow-y-auto">
              {filtered.map((u) => (
                <button
                  key={u.id}
                  onClick={() => {
                    setSelectedUserId(u.id)
                    setQuery(`${u.name} — ${u.email}`)
                  }}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-muted/50 transition-colors"
                >
                  <span className="font-medium">{u.name}</span>
                  <span className="text-muted-foreground ml-2">{u.email}</span>
                  <span className="text-muted-foreground ml-auto">
                    {u.signals.length} signal{u.signals.length > 1 ? "x" : ""}
                  </span>
                </button>
              ))}
            </div>
          )}
          {query && filtered.length === 0 && !selectedUserId && (
            <div className="absolute top-full left-0 right-0 mt-1 rounded-lg border border-border bg-background shadow-lg z-10 p-3 text-xs text-muted-foreground text-center">
              Aucun utilisateur trouvé
            </div>
          )}
        </div>

        {/* Timeline */}
        {selected && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/20">
              <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                {selected.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium">{selected.name}</p>
                <p className="text-xs text-muted-foreground">{selected.email}</p>
              </div>
              <div className="ml-auto text-xs text-muted-foreground">
                {selected.signals.length} signal{selected.signals.length > 1 ? "x" : ""}
              </div>
            </div>

            {selected.signals.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">
                Aucun signal reçu par cet utilisateur.
              </p>
            ) : (
              <div className="relative pl-6 space-y-4">
                {/* Timeline line */}
                <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />

                {selected.signals.map((s, i) => (
                  <div key={s.signalId} className="relative">
                    {/* Dot */}
                    <div className="absolute -left-[21px] top-1.5 size-3 rounded-full border-2 border-background bg-primary" />

                    <div className="rounded-lg border border-border p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{s.signalTitle}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(s.publishedAt).toLocaleString("fr-FR")}
                          </p>
                        </div>
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-medium text-primary shrink-0">
                          {s.plan}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <StatusBadge
                          label="Email"
                          value={s.emailEvent ?? s.emailBucket}
                          tone={
                            s.emailBucket === "delivered"
                              ? "success"
                              : s.emailBucket === "opened"
                                ? "info"
                                : s.emailBucket === "bounced" || s.emailBucket === "failed" || s.emailBucket === "complained"
                                  ? "danger"
                                  : "muted"
                          }
                        />
                        <StatusBadge
                          label="Push"
                          value={s.pushStatus ?? "—"}
                          tone={
                            s.pushStatus === "envoyé"
                              ? "success"
                              : s.pushStatus === "échoué"
                                ? "danger"
                                : "muted"
                          }
                        />
                        <StatusBadge
                          label="In-app"
                          value={s.inAppRead ? "lu" : "non lu"}
                          tone={s.inAppRead ? "info" : "muted"}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => {
                setSelectedUserId(null)
                setQuery("")
              }}
              className="text-xs text-primary hover:underline"
            >
              ← Changer d&apos;utilisateur
            </button>
          </div>
        )}

        {!selected && !query && (
          <p className="text-xs text-muted-foreground text-center py-6">
            Tapez un nom ou email pour voir la timeline d&apos;un membre
          </p>
        )}
      </div>
    </div>
  )
}

function StatusBadge({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: "success" | "info" | "danger" | "muted"
}) {
  const colors: Record<string, string> = {
    success: "bg-success/10 text-success",
    info: "bg-info/10 text-info",
    danger: "bg-destructive/10 text-destructive",
    muted: "bg-muted text-muted-foreground",
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/50 px-2.5 py-1 text-[10px] font-medium text-muted-foreground">
      <span className={cn("size-1.5 rounded-full", colors[tone].split(" ")[0])} />
      {label}: <span className="font-semibold">{value}</span>
    </span>
  )
}
