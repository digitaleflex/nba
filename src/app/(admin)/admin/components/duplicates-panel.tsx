"use client"

import { useEffect, useState, useCallback } from "react"
import { Copy, Loader2, RefreshCw, CheckCircle2, UserCheck, ChevronDown, ChevronRight, Mail, Globe, User, ShieldX } from "lucide-react"
import { toast } from "sonner"
import { useConfirm } from "@nba/components/confirm-dialog"

interface DuplicateAccount {
  id: string
  name: string
  email: string
  isActive: boolean
  onboardingStatus: string
  signalsAccessOverride: boolean
  createdAt: string
  plans: { name: string; price: string }[]
}

interface DuplicateGroup {
  name: string
  count: number
  activeCount: number
  approvedCount: number
  plans: string[]
  totalPaid: number
  detectedBy: string[]
  accounts: DuplicateAccount[]
}

export function DuplicatesPanel() {
  const [groups, setGroups] = useState<DuplicateGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [revoking, setRevoking] = useState(false)
  const { confirm, node } = useConfirm()

  async function revokeDuplicates(g: DuplicateGroup, keepUserId: string) {
    const toRevoke = g.accounts.filter((a) => a.id !== keepUserId)
    if (toRevoke.length === 0) return

    const keepLabel = g.accounts.find((a) => a.id === keepUserId)?.email ?? "?"
    confirm({
      title: "Révoquer les doublons ?",
      description:
        `Garder « ${keepLabel} » et révoquer ${toRevoke.length} compte(s) du groupe ${g.name}. ` +
        `Les accès payés seront révoqués et le compte désactivé (il faudra un nouveau paiement pour réactiver).`,
      confirmLabel: "Révoquer",
      onConfirm: async () => {
        setRevoking(true)
        try {
          const res = await fetch("/api/admin/members/duplicates/revoke", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              groupName: g.name,
              keepUserId,
              revokeUserIds: toRevoke.map((a) => a.id),
            }),
          })
          if (!res.ok) throw new Error()
          const d = await res.json()
          toast.success(`${d.revokedAccess} accès révoqués · ${d.suspendedAccounts} compte(s) désactivé(s)`)
          refresh()
        } catch {
          toast.error("Erreur lors de la révocation des doublons")
        } finally {
          setRevoking(false)
        }
      },
    })
  }

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/members/duplicates", { cache: "no-store" })
      if (!res.ok) throw new Error()
      const d = await res.json()
      setGroups(d.duplicates || [])
    } catch {
      setGroups([])
      toast.error("Erreur de détection des doublons. Réessayez.")
    } finally {
      setLoading(false)
    }
  }, [])

    useEffect(() => { refresh() }, [refresh])

  return (
    <div className="rounded-xl border p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Copy className="size-4 text-amber-500" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Comptes en double / suspect</h2>
        </div>
        <button onClick={() => refresh()} className="p-1.5 rounded-md hover:bg-accent cursor-pointer" title="Actualiser">
          <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1"><User className="w-3 h-3 text-sky-500" /> même nom</span>
        <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-violet-500" /> email similaire</span>
        <span className="flex items-center gap-1"><Globe className="w-3 h-3 text-orange-500" /> même IP</span>
      </div>

      {loading && groups.length === 0 ? (
        <div className="flex items-center justify-center py-8"><Loader2 className="size-5 animate-spin" /></div>
      ) : groups.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
          <CheckCircle2 className="size-6 text-emerald-500" />
          <p className="text-sm">Aucun compte en double détecté</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-amber-500/10 p-3">
              <p className="text-[10px] uppercase text-muted-foreground">Groupes de doublons</p>
              <p className="text-lg font-bold">{groups.length}</p>
            </div>
            <div className="rounded-lg bg-muted/40 p-3">
              <p className="text-[10px] uppercase text-muted-foreground">Accès multipliés</p>
              <p className="text-lg font-bold text-amber-600">
                {groups.reduce((acc, g) => acc + Math.max(0, g.approvedCount - 1), 0)}
              </p>
            </div>
          </div>

          {groups.map((g) => {
            const isOpen = expanded === g.name
            return (
              <div key={g.name} className="rounded-lg border overflow-hidden">
                <button
                  onClick={() => setExpanded(isOpen ? null : g.name)}
                  className="w-full flex items-center justify-between p-3 hover:bg-accent/30 text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                    <span className="text-sm font-medium truncate">
                      {g.detectedBy?.includes("IP partagée") ? g.name.split(", ").slice(0, 2).join(" + ") : g.name}
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0">({g.count} comptes)</span>
                    <span className="flex items-center gap-0.5 shrink-0">
                      {g.detectedBy?.includes("nom") && <User className="w-3 h-3 text-sky-500" />}
                      {g.detectedBy?.includes("email") && <Mail className="w-3 h-3 text-violet-500" />}
                      {g.detectedBy?.includes("IP partagée") && <Globe className="w-3 h-3 text-orange-500" />}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {g.totalPaid > 0 && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600">
                        {g.totalPaid.toLocaleString("fr-FR")} F
                      </span>
                    )}
                    {g.approvedCount > 1 && (
                      <span className="px-2 py-0.5 flex items-center gap-1 text-[10px] font-bold bg-rose-500/10 text-rose-600">
                        <UserCheck className="w-2.5 h-2.5" /> Multi
                      </span>
                    )}
                  </div>
                </button>
                {isOpen && (
                  <div className="border-t divide-y">
                    {g.accounts.map((a) => (
                      <div key={a.id} className="px-3 py-2 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate">{a.email}</p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {a.onboardingStatus} · {a.plans.length > 0 ? a.plans.map((p) => p.name).join(", ") : "aucun plan"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {a.isActive ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-600">Actif</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-muted/50 text-muted-foreground">Inactif</span>
                          )}
                          <button
                            onClick={() => revokeDuplicates(g, a.id)}
                            disabled={revoking || g.accounts.length < 2}
                            className="p-1.5 rounded-md text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            title={`Garder ${a.email} et révoquer les autres comptes du groupe`}
                          >
                            <ShieldX className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
      {node}
    </div>
  )
}
