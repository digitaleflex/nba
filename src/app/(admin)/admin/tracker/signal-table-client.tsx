"use client"

import { useState } from "react"
import Link from "next/link"
import { cn } from "@nba/design-system"

interface PerUser {
  email: string
  name: string
  externalId: string | null
  emailBucket: string
  emailEvent: string | null
  pushStatus: string | null
  inAppRead: boolean
}

interface SignalRow {
  id: string
  title: string
  publishedAt: string | null
  plans: string
  recipients: number
  emailsSent: number
  delivered: number
  bounced: number
  complained: number
  opened: number
  pending: number
  failed: number
  unknown: number
  pushSent: number
  pushFailed: number
  perUser: PerUser[]
}

export function SignalTableClient({ rows }: { rows: SignalRow[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <>
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr className="text-left">
                <th className="px-4 py-2.5 font-medium">Signal</th>
                <th className="px-4 py-2.5 font-medium hidden md:table-cell">Groupes</th>
                <th className="px-4 py-2.5 font-medium text-right">Dest.</th>
                <th className="px-4 py-2.5 font-medium text-right">Emails</th>
                <th className="px-4 py-2.5 font-medium text-right">Délivrés</th>
                <th className="px-4 py-2.5 font-medium text-right hidden md:table-cell">Ouverts</th>
                <th className="px-4 py-2.5 font-medium text-right hidden md:table-cell">Bounces</th>
                <th className="px-4 py-2.5 font-medium text-right hidden md:table-cell">Plaintes</th>
                <th className="px-4 py-2.5 font-medium text-right hidden md:table-cell">Push</th>
                <th className="px-4 py-2.5 font-medium text-right">Détail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((r) => (
                <>
                  <tr
                    key={r.id}
                    onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                    className={cn(
                      "hover:bg-muted/30 cursor-pointer transition-colors",
                      expandedId === r.id && "bg-muted/20"
                    )}
                  >
                    <td className="px-4 py-3 max-w-[200px]">
                      <div className="font-medium truncate">{r.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {r.publishedAt ? new Date(r.publishedAt).toLocaleString("fr-FR") : "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs max-w-[100px] truncate hidden md:table-cell">{r.plans}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{r.recipients}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{r.emailsSent}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-success">{r.delivered}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-info hidden md:table-cell">{r.opened}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-destructive hidden md:table-cell">{r.bounced}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-destructive hidden md:table-cell">{r.complained}</td>
                    <td className="px-4 py-3 text-right tabular-nums hidden md:table-cell">
                      <span className="text-success">{r.pushSent}</span>
                      {r.pushFailed > 0 && (
                        <span className="text-destructive"> / {r.pushFailed}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-primary">
                      {expandedId === r.id ? "▲" : "▼"}
                    </td>
                  </tr>
                  {expandedId === r.id && (
                    <tr key={`${r.id}-detail`}>
                      <td colSpan={10} className="px-0 py-0">
                        <div className="bg-muted/10 border-t border-border">
                          <div className="px-4 py-3 border-b border-border bg-muted/20">
                            <span className="font-semibold text-sm">Détail par utilisateur</span>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead className="text-muted-foreground bg-muted/5">
                                <tr className="text-left">
                                  <th className="px-4 py-2 font-medium text-xs">Utilisateur</th>
                                  <th className="px-4 py-2 font-medium text-xs">Email</th>
                                  <th className="px-4 py-2 font-medium text-xs">Email (Resend)</th>
                                  <th className="px-4 py-2 font-medium text-xs">Push web</th>
                                  <th className="px-4 py-2 font-medium text-xs">In-app</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border/50">
                                {r.perUser.map((u, i) => (
                                  <tr key={i} className="hover:bg-muted/20">
                                    <td className="px-4 py-2 text-sm">{u.name}</td>
                                    <td className="px-4 py-2 text-xs text-muted-foreground">{u.email}</td>
                                    <td className="px-4 py-2">
                                      <BucketBadge bucket={u.emailBucket} event={u.emailEvent} />
                                    </td>
                                    <td className="px-4 py-2">
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
                                        <span className="inline-flex items-center rounded-full bg-info/10 px-2 py-0.5 text-xs font-medium text-info">
                                          lu
                                        </span>
                                      ) : (
                                        <span className="text-xs text-muted-foreground">non lu</span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                                {r.perUser.length === 0 && (
                                  <tr>
                                    <td colSpan={5} className="px-4 py-6 text-center text-xs text-muted-foreground">
                                      Aucun destinataire pour ce signal.
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-muted-foreground">
                    Aucun signal publié récemment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
