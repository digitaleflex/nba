"use client"

import { useEffect, useState, useCallback } from "react"
import {
  Loader2, ShieldAlert, Ban, Globe, Play, Unlock, RotateCw, Search, AlertTriangle, RefreshCw, CheckCircle2,
} from "lucide-react"
import { Card, CardContent, Button, EmptyState, cn } from "@nba/design-system"
import { toast } from "sonner"
interface FraudSummary {
  highEvents: number
  failedLogins: number
  blockedDevices: number
  suspendedAccounts: number
  blockedIps: number
}

interface FraudEvent {
  id: string
  type: string
  severity: string
  userId: string
  ipAddress: string | null
  createdAt: string
  details: Record<string, unknown>
  user: { name: string; email: string } | null
}

interface BlockedIp { ip: string; ttl: number }
interface Playbook { id: string; name: string; severity: string; detectType: string; steps: number }

interface AuthAttempt {
  id: string
  email: string
  type: "LOGIN" | "SIGNUP"
  success: boolean
  reason: string | null
  ipAddress: string
  userAgent: string | null
  createdAt: string
  user: { name: string; email: string } | null
}

export function FraudTab() {
  const [summary, setSummary] = useState<FraudSummary | null>(null)
  const [events, setEvents] = useState<FraudEvent[]>([])
  const [ips, setIps] = useState<BlockedIp[]>([])
  const [playbooks, setPlaybooks] = useState<Playbook[]>([])
  const [attempts, setAttempts] = useState<AuthAttempt[]>([])
  const [loading, setLoading] = useState(true)
  const [suspendEmail, setSuspendEmail] = useState("")
  const [reactivateEmail, setReactivateEmail] = useState("")
  const [selectedPlaybook, setSelectedPlaybook] = useState("")
  const [playbookUserId, setPlaybookUserId] = useState("")
  const [searchEmail, setSearchEmail] = useState("")

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const [abuseRes, eventsRes, ipsRes, playbookRes, attemptsRes] = await Promise.all([
        fetch("/api/admin/security/fraud/abuse"),
        fetch("/api/admin/security/fraud/events"),
        fetch("/api/admin/security/fraud/blocked-ips"),
        fetch("/api/admin/security/fraud/playbook"),
        fetch("/api/admin/security/fraud/auth-attempts"),
      ])
      if (abuseRes.ok) { const d = await abuseRes.json(); setSummary(d.summary) }
      if (eventsRes.ok) { const d = await eventsRes.json(); setEvents(d.events || []) }
      if (ipsRes.ok) { const d = await ipsRes.json(); setIps(d.ips || []) }
      if (playbookRes.ok) { const d = await playbookRes.json(); setPlaybooks(d.playbooks || []) }
      if (attemptsRes.ok) { const d = await attemptsRes.json(); setAttempts(d.attempts || []) }
    } catch { toast.error("Erreur de chargement des données de fraude. Réessayez.") }
    finally { setLoading(false) }
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { refresh(); const id = setInterval(refresh, 30000); return () => clearInterval(id) }, [refresh])

  async function suspendUser() {
    if (!suspendEmail) return toast.error("Saisissez l'email du compte à suspendre.")
    if (!confirm("Suspendre ce compte ? L'utilisateur sera déconnecté et ne pourra plus se connecter.")) return
    try {
      const search = await fetch(`/api/admin/members/search?email=${suspendEmail}`)
      if (!search.ok) return toast.error("Aucun compte trouvé avec cet email.")
      const { id } = await search.json()
      const res = await fetch("/api/admin/security/fraud/suspend", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: id }) })
      if (res.ok) { toast.success("Compte suspendu. Un email a été envoyé à l'utilisateur."); setSuspendEmail(""); refresh() } else toast.error("Échec de la suspension. Vérifiez que le compte n'est pas déjà suspendu.")
    } catch { toast.error("Impossible de contacter le serveur. Réessayez.") }
  }

  async function reactivateUser(userId: string) {
    if (!confirm("Réactiver ce compte ? L'utilisateur pourra se reconnecter.")) return
    const res = await fetch("/api/admin/security/fraud/reactivate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId }) })
    if (res.ok) { toast.success("Compte réactivé. L'utilisateur peut se reconnecter."); refresh() } else toast.error("Échec de la réactivation. Réessayez.")
  }

  async function unblockIp(ip: string) {
    if (!confirm(`Débloquer l'adresse IP ${ip} ? Elle pourra de nouveau accéder au site.`)) return
    const res = await fetch("/api/admin/security/fraud/unblock-ip", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ip }) })
    if (res.ok) { toast.success("IP débloquée. L'accès est rétabli."); refresh() } else toast.error("Échec du déblocage. Réessayez.")
  }

  async function executePlaybook() {
    if (!playbookUserId || !selectedPlaybook) return toast.error("Sélectionnez un utilisateur et un protocole de sécurité.")
    if (!confirm(`Appliquer le protocole « ${selectedPlaybook} » sur cet utilisateur ? Cette action appliquera des restrictions automatiques.`)) return
    const res = await fetch("/api/admin/security/fraud/playbook", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: playbookUserId, detectType: selectedPlaybook }) })
    if (res.ok) { toast.success("Protocole appliqué. Les restrictions sont en place."); refresh() } else toast.error("Échec du protocole. Réessayez.")
  }

  async function searchUserFn() {
    if (!searchEmail) return
    const res = await fetch(`/api/admin/members/search?email=${searchEmail}`)
    if (res.ok) { const d = await res.json(); setPlaybookUserId(d.id); toast.success(`Utilisateur trouvé : ${d.name}`) }
    else toast.error("Aucun compte trouvé avec cet email.")
  }

  if (loading && !summary) return <div className="flex items-center justify-center py-20"><Loader2 className="size-6 animate-spin" /></div>

  return (
    <div className="space-y-6" data-testid="fraud-tab">
      <div className="flex items-center justify-between border-b border-border/40 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Anti-Fraude</h1>
          <p className="text-xs text-muted-foreground mt-1">Lutte contre la fraude et les abus</p>
        </div>
        <Button variant="outline" size="sm" onClick={refresh} className="shrink-0"><RotateCw className="size-3.5 mr-1" /> Actualiser</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard icon={ShieldAlert} label="Alertes critiques" value={summary?.highEvents ?? 0} color="text-red-500" className="stagger-1" />
        <StatCard icon={AlertTriangle} label="Connexions échouées" value={summary?.failedLogins ?? 0} color="text-orange-500" className="stagger-2" />
        <StatCard icon={Globe} label="IPs bloquées" value={summary?.blockedIps ?? 0} color="text-purple-500" className="stagger-3" />
        <StatCard icon={Ban} label="Comptes suspendus" value={summary?.suspendedAccounts ?? 0} color="text-rose-500" className="stagger-4" />
        <StatCard icon={Ban} label="Appareils bloqués" value={summary?.blockedDevices ?? 0} color="text-amber-500" className="stagger-5" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card><CardContent className="p-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Suspendre un compte</h3>
          <div className="flex gap-2">
            <input className="flex-1 px-3 py-2 text-sm rounded-lg border bg-background" placeholder="Email" value={suspendEmail} onChange={e => setSuspendEmail(e.target.value)} />
            <Button size="sm" variant="destructive" onClick={suspendUser}>Suspendre</Button>
          </div>
        </CardContent></Card>

        <Card><CardContent className="p-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Réactiver un compte</h3>
          <div className="flex gap-2">
            <input className="flex-1 px-3 py-2 text-sm rounded-lg border bg-background" placeholder="Email" value={reactivateEmail} onChange={e => setReactivateEmail(e.target.value)} />
            <Button size="sm" variant="default" onClick={async () => {
              if (!reactivateEmail) return toast.error("Email requis")
              const search = await fetch(`/api/admin/members/search?email=${reactivateEmail}`)
              if (!search.ok) return toast.error("Utilisateur introuvable")
              const { id } = await search.json()
              await reactivateUser(id)
              setReactivateEmail("")
            }}><RefreshCw className="size-3.5 mr-1" /> Reactiver</Button>
          </div>
        </CardContent></Card>

        <Card><CardContent className="p-6 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Appliquer un protocole de sécurité</h3>
          <div className="flex gap-2">
            <input className="flex-1 px-3 py-2 text-sm rounded-lg border bg-background" placeholder="Email" value={searchEmail} onChange={e => setSearchEmail(e.target.value)} />
            <Button size="sm" variant="outline" onClick={searchUserFn} aria-label="Rechercher"><Search className="size-3.5" /></Button>
          </div>
          <div className="flex gap-2">
            <select className="flex-1 px-3 py-2 text-sm rounded-lg border bg-background" value={selectedPlaybook} onChange={e => setSelectedPlaybook(e.target.value)}>
              <option value="">Playbook...</option>
              {playbooks.map(p => <option key={p.id} value={p.detectType}>{p.name} ({p.severity})</option>)}
            </select>
            <Button size="sm" onClick={executePlaybook} aria-label="Exécuter"><Play className="size-3.5" /></Button>
          </div>
        </CardContent></Card>
      </div>

      <Card><CardContent className="p-6 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Evenements recents (HAUT/CRITIQUE)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead><tr className="border-b text-muted-foreground uppercase tracking-wider text-[10px]">
              <th className="px-3 py-2">Date</th><th className="px-3 py-2">Type</th><th className="px-3 py-2">Severite</th><th className="px-3 py-2">Utilisateur</th><th className="px-3 py-2">IP</th><th className="px-3 py-2 text-right">Action</th>
            </tr></thead>
            <tbody className="divide-y">
              {events.slice(0, 20).map(e => {
                const acknowledged = !!(e.details as any)?.acknowledgedAt
                return (
                <tr key={e.id} className={cn("hover:bg-accent/30", acknowledged ? "opacity-60" : "", e.severity === "CRITICAL" && !acknowledged && "alert-pulse")}>
                  <td className="px-3 py-2 text-muted-foreground">{new Date(e.createdAt).toLocaleString("fr-FR")}</td>
                  <td className="px-3 py-2 font-medium">{e.type}</td>
                  <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${e.severity === "CRITICAL" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"}`}>{e.severity}</span></td>
                  <td className="px-3 py-2">{e.user ? `${e.user.email}` : "—"}</td>
                  <td className="px-3 py-2 text-muted-foreground font-mono text-[10px]">{e.ipAddress || "—"}</td>
                  <td className="px-3 py-2 text-right">
                    {acknowledged ? (
                      <CheckCircle2 className="size-3.5 text-emerald-500 inline" />
                    ) : (
                      <button
                        onClick={async () => {
                          await fetch(`/api/admin/security/events/${e.id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ acknowledged: true }),
                          })
                          refresh()
                        }}
                        className="text-[10px] text-muted-foreground hover:text-foreground underline underline-offset-2 cursor-pointer"
                      >
                        Marquer
                      </button>
                    )}
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
          {events.length === 0 && <EmptyState icon={ShieldAlert} title="Aucun événement récent" description="Aucun événement à haute sévérité détecté." />}
        </div>
      </CardContent></Card>

      <Card><CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tentatives d&apos;authentification récentes (connexion + inscription)</h3>
          <span className="text-[10px] text-muted-foreground">{attempts.length} affichées / 100 max</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead><tr className="border-b text-muted-foreground uppercase tracking-wider text-[10px]">
              <th className="px-3 py-2">Date</th><th className="px-3 py-2">Type</th><th className="px-3 py-2">Statut</th><th className="px-3 py-2">Email</th><th className="px-3 py-2">Raison</th><th className="px-3 py-2">IP</th>
            </tr></thead>
            <tbody className="divide-y">
              {attempts.map(a => (
                <tr key={a.id} className="hover:bg-accent/30">
                  <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{new Date(a.createdAt).toLocaleString("fr-FR")}</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${a.type === "SIGNUP" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}`}>
                      {a.type === "SIGNUP" ? "Inscription" : "Connexion"}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${a.success ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                      {a.success ? "Succès" : "Échec"}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-mono">{a.email}</td>
                  <td className="px-3 py-2 text-muted-foreground max-w-[220px] truncate" title={a.reason ?? ""}>{a.reason || "—"}</td>
                  <td className="px-3 py-2 text-muted-foreground font-mono text-[10px]">{a.ipAddress || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {attempts.length === 0 && <EmptyState icon={ShieldAlert} title="Aucune tentative récente" description="Les tentatives de connexion et d'inscription (succès et échecs) apparaîtront ici." />}
        </div>
      </CardContent></Card>

      <Card><CardContent className="p-6 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">IPs bloquées ({ips.length})</h3>
        {ips.length === 0 ? <EmptyState icon={Globe} title="Aucune IP bloquée" description="Toutes les adresses IP sont autorisées." /> : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {ips.map(({ ip }) => (
              <div key={ip} className="flex items-center justify-between p-2 rounded-lg bg-accent/20 text-xs">
                <span className="font-mono">{ip}</span>
                <button onClick={() => unblockIp(ip)} className="p-1 rounded-md hover:bg-accent cursor-pointer" aria-label="Débloquer"><Unlock className="size-3" /></button>
              </div>
            ))}
          </div>
        )}
      </CardContent></Card>
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function StatCard({ icon: Icon, label, value, color, className }: { icon: any; label: string; value: number; color: string; className?: string }) {
  return (
    <div className={cn("rounded-xl border p-4 flex items-center gap-3 interactive-card animate-slide-up", className)}>
      <div className={`p-2 rounded-lg bg-accent/30 ${color}`}><Icon className="size-5" /></div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-xl font-bold ${color}`}>{value}</p>
      </div>
    </div>
  )
}
