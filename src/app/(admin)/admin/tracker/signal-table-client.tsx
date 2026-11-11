"use client"

import { useState } from "react"
import { cn } from "@nba/design-system"
import { computeDeliveryRates } from "@nba/lib/services/delivery-metrics"
import { ChevronDown, ChevronRight, Image, Loader2, User } from "lucide-react"
import { loadSignalRecipients } from "./actions"
import type { PerUser, SignalRow } from "./types"

export function SignalTableClient({ rows }: { rows: SignalRow[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [contentOpenId, setContentOpenId] = useState<string | null>(null)
  // Destinataires chargés à la demande : le payload initial ne contient que
  // les agrégats, pas des milliers de lignes à chaque refresh (10 s).
  const [recipients, setRecipients] = useState<Record<string, PerUser[]>>({})
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [errorId, setErrorId] = useState<string | null>(null)

  async function load(id: string) {
    setLoadingId(id)
    setErrorId((current) => (current === id ? null : current))
    try {
      const list = await loadSignalRecipients(id)
      setRecipients((prev) => ({ ...prev, [id]: list }))
    } catch {
      setErrorId(id)
    } finally {
      setLoadingId((current) => (current === id ? null : current))
    }
  }

  function toggle(id: string) {
    const next = expandedId === id ? null : id
    setExpandedId(next)
    // Ne recharge pas à chaque ouverture : le cache local suffit.
    if (next && recipients[next] === undefined) void load(next)
  }

  return (
    <div className="space-y-3">
      {rows.map((r) => {
        const isExpanded = expandedId === r.id
        const isContentOpen = contentOpenId === r.id
        const users = recipients[r.id]
        const isLoading = loadingId === r.id
        // `delivered` inclut déjà les ouverts (cf. delivery-metrics) — ne pas
        // additionner les deux, sinon le taux peut dépasser 100 %.
        const { deliveryRate } = computeDeliveryRates({
          sent: r.emailsSent,
          delivered: r.delivered,
          opened: r.opened,
          bounced: r.bounced,
          complained: r.complained,
        })

        return (
          <div key={r.id} className="rounded-xl border border-border overflow-hidden">
            {/* Main row - clickable header */}
            <button
              type="button"
              onClick={() => toggle(r.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  toggle(r.id)
                }
              }}
              role="button"
              tabIndex={0}
              aria-expanded={isExpanded}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors select-none text-left"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm">{r.title}</span>
                  {r.hasImages && <Image className="size-3.5 text-muted-foreground" aria-hidden="true" />}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
                  <span>{r.publishedAt ? new Date(r.publishedAt).toLocaleString("fr-FR") : "—"}</span>
                  <span>Par {r.author}</span>
                </div>
              </div>

              {/* Plan badges with counts */}
              <div className="flex items-center gap-1.5 flex-wrap max-w-[200px]">
                {r.planBreakdown.map((p) => (
                  <span key={p.name} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-medium text-primary shrink-0">
                    {p.name}
                    <span className="text-primary/60">({p.count})</span>
                  </span>
                ))}
              </div>

              {/* Quick stats */}
              <div className="flex items-center gap-4 text-xs tabular-nums">
                <div className="text-right">
                  <div className="font-semibold">{r.recipients}</div>
                  <div className="text-[9px] text-muted-foreground">Dest.</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{r.emailsSent}</div>
                  <div className="text-[9px] text-muted-foreground">Emails</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-success">{deliveryRate}%</div>
                  <div className="text-[9px] text-muted-foreground">Délivrés</div>
                </div>
              </div>

              <div className="shrink-0">
                {isExpanded ? <ChevronDown className="size-4 text-muted-foreground" /> : <ChevronRight className="size-4 text-muted-foreground" />}
              </div>
            </button>

            {/* Content preview (toggle) */}
            <div className="border-t border-border/50">
              <button
                type="button"
                onClick={() => setContentOpenId(isContentOpen ? null : r.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    setContentOpenId(isContentOpen ? null : r.id)
                  }
                }}
                role="button"
                tabIndex={0}
                aria-expanded={isContentOpen}
                className="w-full flex items-center gap-2 px-4 py-1.5 text-xs text-muted-foreground hover:bg-muted/20 transition-colors cursor-pointer"
              >
                {isContentOpen ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
                Contenu du signal
              </button>
              {isContentOpen && (
                <div className="px-4 py-2 bg-muted/10 border-t border-border/50">
                  <pre className="text-xs text-foreground/80 whitespace-pre-wrap font-sans leading-relaxed">{r.content}</pre>
                </div>
              )}
            </div>

            {/* Expanded detail */}
            {isExpanded && (
              <div className="border-t border-border bg-muted/10">
                {/* Stats row */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-px bg-border/50">
                  <div className="bg-card/50 px-4 py-2">
                    <div className="text-xs font-semibold">{r.emailsSent}</div>
                    <div className="text-[9px] text-muted-foreground">Emails envoyés</div>
                  </div>
                  <div className="bg-card/50 px-4 py-2">
                    <div className="text-xs font-semibold text-success">{r.delivered}</div>
                    <div className="text-[9px] text-muted-foreground">Délivrés</div>
                  </div>
                  <div className="bg-card/50 px-4 py-2">
                    <div className="text-xs font-semibold text-info">{r.opened}</div>
                    <div className="text-[9px] text-muted-foreground">Ouverts</div>
                  </div>
                  <div className="bg-card/50 px-4 py-2">
                    <div className="text-xs font-semibold text-destructive">{r.bounced}</div>
                    <div className="text-[9px] text-muted-foreground">Bounces</div>
                  </div>
                  <div className="bg-card/50 px-4 py-2">
                    <div className="text-xs font-semibold text-destructive">{r.complained}</div>
                    <div className="text-[9px] text-muted-foreground">Plaintes</div>
                  </div>
                  <div className="bg-card/50 px-4 py-2">
                    <div className="text-xs font-semibold">{r.pushSent}</div>
                    <div className="text-[9px] text-muted-foreground">Push envoyés</div>
                  </div>
                  <div className="bg-card/50 px-4 py-2">
                    <div className="text-xs font-semibold text-destructive">{r.pushFailed}</div>
                    <div className="text-[9px] text-muted-foreground">Push échoués</div>
                  </div>
                  <div className="bg-card/50 px-4 py-2">
                    <div className="text-xs font-semibold">{r.inAppRead}</div>
                    <div className="text-[9px] text-muted-foreground">In-app lus</div>
                  </div>
                  <div className="bg-card/50 px-4 py-2">
                    <div className="text-xs font-semibold">{r.recipients - r.inAppRead}</div>
                    <div className="text-[9px] text-muted-foreground">In-app non lus</div>
                  </div>
                  <div className="bg-card/50 px-4 py-2">
                    <div className="text-xs font-semibold text-muted-foreground">{r.unknown}</div>
                    <div className="text-[9px] text-muted-foreground">Statut inconnu</div>
                  </div>
                </div>

                {isLoading && (
                  <div className="flex items-center justify-center gap-2 py-6 text-xs text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    Chargement des {r.perUserCount} destinataires…
                  </div>
                )}

                {!isLoading && errorId === r.id && (
                  <div className="flex items-center justify-center gap-3 py-6 text-xs text-destructive">
                    Impossible de charger les destinataires.
                    <button
                      type="button"
                      onClick={() => void load(r.id)}
                      className="rounded-lg border border-destructive/40 px-3 py-1 font-medium hover:bg-destructive/10"
                    >
                      Réessayer
                    </button>
                  </div>
                )}

                {!isLoading && errorId !== r.id && users && users.length === 0 && (
                  <div className="px-4 py-6 text-center text-xs text-muted-foreground">
                    Aucun destinataire pour ce signal.
                  </div>
                )}

                {!isLoading && errorId !== r.id && users && users.length > 0 && (
                  <RecipientDetails users={users} />
                )}
              </div>
            )}
          </div>
        )
      })}
      {rows.length === 0 && (
        <div className="py-10 text-center text-muted-foreground text-sm">
          Aucun signal publié récemment.
        </div>
      )}
    </div>
  )
}

function RecipientDetails({ users }: { users: PerUser[] }) {
  const grouped = new Map<string, PerUser[]>()
  for (const u of users) {
    const list = grouped.get(u.plan) ?? []
    list.push(u)
    grouped.set(u.plan, list)
  }
  const entries = Array.from(grouped.entries()).sort(([a], [b]) => a.localeCompare(b))

  return (
    <>
      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-border/50">
        {entries.flatMap(([plan, planUsers]) => [
          <div key={`plan-${plan}`} className="px-4 py-2 bg-muted/20 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <User className="size-3" />
            {plan}
            <span className="font-normal text-muted-foreground/60">({planUsers.length})</span>
          </div>,
          ...planUsers.map((u, i) => (
            <div key={`${u.email}-${i}`} className="px-4 py-3 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium truncate">{u.name}</span>
                <BucketBadge bucket={u.emailBucket} event={u.emailEvent} />
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {u.email}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <span className="inline-flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-primary" />
                  Push&nbsp;: {u.pushStatus ?? "—"}
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className={cn("size-1.5 rounded-full", u.inAppRead ? "bg-info" : "bg-muted-foreground")} />
                  In-app&nbsp;: {u.inAppRead ? "lu" : "non lu"}
                </span>
              </div>
            </div>
          )),
        ])}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto" role="region" aria-label="Contenu défilant">
        <table className="w-full text-sm">
          <thead className="text-muted-foreground bg-muted/5">
            <tr className="text-left">
              <th className="px-4 py-2 font-medium text-xs">Utilisateur</th>
              <th className="px-4 py-2 font-medium text-xs">Groupe</th>
              <th className="px-4 py-2 font-medium text-xs hidden md:table-cell">Email</th>
              <th className="px-4 py-2 font-medium text-xs">Email (Resend)</th>
              <th className="px-4 py-2 font-medium text-xs hidden md:table-cell">Push web</th>
              <th className="px-4 py-2 font-medium text-xs">In-app</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {entries.flatMap(([plan, planUsers]) => [
              <tr key={`plan-${plan}`} className="bg-muted/20">
                <td colSpan={6} className="px-4 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <span className="inline-flex items-center gap-1.5">
                    <User className="size-3" />
                    {plan}
                    <span className="font-normal text-muted-foreground/60">({planUsers.length})</span>
                  </span>
                </td>
              </tr>,
              ...planUsers.map((u, i) => (
                <tr key={`${u.email}-${i}`} className="hover:bg-muted/20">
                  <td className="px-4 py-2 text-sm">{u.name}</td>
                  <td className="px-4 py-2">
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {u.plan}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-xs text-muted-foreground hidden md:table-cell">{u.email}</td>
                  <td className="px-4 py-2">
                    <BucketBadge bucket={u.emailBucket} event={u.emailEvent} />
                  </td>
                  <td className="px-4 py-2 hidden md:table-cell">
                    {u.pushStatus ? (
                      <span
                        className={
                          u.pushStatus === "envoyé"
                            ? "inline-flex items-center rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success"
                            : "inline-flex items-center rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive"
                        }
                      >
                        {u.pushStatus}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {u.inAppRead ? (
                      <span className="inline-flex items-center rounded-full bg-info/10 px-2 py-0.5 text-xs font-medium text-info">lu</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">non lu</span>
                    )}
                  </td>
                </tr>
              )),
            ])}
          </tbody>
        </table>
      </div>
    </>
  )
}

function BucketBadge({ bucket, event }: { bucket: string; event: string | null }) {
  const map: Record<string, string> = {
    delivered: "bg-success/10 text-success",
    opened: "bg-info/10 text-info",
    bounced: "bg-destructive/10 text-destructive",
    complained: "bg-destructive/10 text-destructive",
    pending: "bg-amber-500/10 text-amber-600",
    failed: "bg-destructive/10 text-destructive",
    unknown: "bg-muted text-muted-foreground",
  }
  const cls = map[bucket] ?? map.unknown
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>{event ?? bucket}</span>
}
