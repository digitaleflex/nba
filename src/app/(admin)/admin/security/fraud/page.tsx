"use client"

import { useEffect, useState, useCallback } from "react"
import { type ComponentType } from "react"
import { Loader2, ShieldAlert, Ban, Globe, Users, Play, Unlock, RotateCw, Search } from "lucide-react"
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

interface BlockedIp {
  ip: string
  ttl: number
}

interface Playbook {
  id: string
  name: string
  severity: string
  detectType: string
  steps: number
}

export default function FraudDashboard() {
  const [summary, setSummary] = useState<FraudSummary | null>(null)
  const [events, setEvents] = useState<FraudEvent[]>([])
  const [ips, setIps] = useState<BlockedIp[]>([])
  const [playbooks, setPlaybooks] = useState<Playbook[]>([])
  const [loading, setLoading] = useState(true)
  const [suspendEmail, setSuspendEmail] = useState("")
  const [selectedPlaybook, setSelectedPlaybook] = useState("")
  const [playbookUserId, setPlaybookUserId] = useState("")
  const [searchEmail, setSearchEmail] = useState("")

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const [abuseRes, eventsRes, ipsRes, playbookRes] = await Promise.all([
        fetch("/api/admin/security/fraud/abuse"),
        fetch("/api/admin/security/fraud/events"),
        fetch("/api/admin/security/fraud/blocked-ips"),
        fetch("/api/admin/security/fraud/playbook"),
      ])
      if (abuseRes.ok) { const d = await abuseRes.json(); setSummary(d.summary); setEvents(prev => [...d.recentEvents, ...prev].slice(0, 50)) }
      if (eventsRes.ok) { const d = await eventsRes.json(); setEvents(d.events || []) }
      if (ipsRes.ok) { const d = await ipsRes.json(); setIps(d.ips || []) }
      if (playbookRes.ok) { const d = await playbookRes.json(); setPlaybooks(d.playbooks || []) }
    } catch { toast.error("Erreur chargement donnees fraude") }
    finally { setLoading(false) }
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { refresh()
  }, [refresh])

  async function suspendUser() {
    if (!suspendEmail) return toast.error("Email requis")
    try {
      const search = await fetch(`/api/admin/members/search?email=${suspendEmail}`)
      if (!search.ok) return toast.error("Utilisateur introuvable")
      const { id } = await search.json()
      const res = await fetch("/api/admin/security/fraud/suspend", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: id, reason: "Fraud admin" }),
      })
      if (res.ok) { toast.success("Compte suspendu"); setSuspendEmail(""); refresh() }
      else toast.error("Erreur suspension")
    } catch { toast.error("Erreur suspension") }
  }

  async function unblockIp(ip: string) {
    const res = await fetch("/api/admin/security/fraud/unblock-ip", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ip }),
    })
    if (res.ok) { toast.success("IP debloquee"); refresh() }
    else toast.error("Erreur deblocage")
  }

  async function executePlaybook() {
    if (!playbookUserId || !selectedPlaybook) return toast.error("Utilisateur et playbook requis")
    const res = await fetch("/api/admin/security/fraud/playbook", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: playbookUserId, detectType: selectedPlaybook }),
    })
    if (res.ok) { toast.success("Playbook execute"); refresh() }
    else toast.error("Erreur execution playbook")
  }

  async function searchUser() {
    if (!searchEmail) return
    const res = await fetch(`/api/admin/members/search?email=${searchEmail}`)
    if (res.ok) { const d = await res.json(); setPlaybookUserId(d.id); toast.success(`Utilisateur trouve: ${d.name}`) }
    else toast.error("Utilisateur introuvable")
  }

  if (loading && !summary) return <div className="flex items-center justify-center py-20"><Loader2 className="size-6 animate-spin" /></div>

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Anti-Fraude</h1>
          <p className="text-sm text-muted-foreground mt-1">Centre de lutte contre la fraude et les abus</p>
        </div>
        <button onClick={refresh} className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg border hover:bg-accent transition-colors cursor-pointer"><RotateCw className="size-4" /> Actualiser</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard icon={ShieldAlert} label="Evenements HAUT" value={summary?.highEvents ?? 0} color="text-red-500" />
        <StatCard icon={Ban} label="Echecs connexion/h" value={summary?.failedLogins ?? 0} color="text-orange-500" />
        <StatCard icon={Globe} label="IPs bloquees" value={summary?.blockedIps ?? 0} color="text-purple-500" />
        <StatCard icon={Users} label="Comptes suspendus" value={summary?.suspendedAccounts ?? 0} color="text-rose-500" />
        <StatCard icon={Ban} label="Appareils bloques" value={summary?.blockedDevices ?? 0} color="text-amber-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border p-6 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Suspendre un compte</h2>
          <div className="flex gap-2">
            <input className="flex-1 px-3 py-2 text-sm rounded-lg border bg-background" placeholder="Email de l'utilisateur" value={suspendEmail} onChange={e => setSuspendEmail(e.target.value)} />
            <button onClick={suspendUser} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 cursor-pointer">Suspendre</button>
          </div>
        </div>

        <div className="rounded-xl border p-6 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Executer un playbook</h2>
          <div className="flex gap-2">
            <div className="flex-1 flex gap-2">
              <input className="flex-1 px-3 py-2 text-sm rounded-lg border bg-background" placeholder="Email" value={searchEmail} onChange={e => setSearchEmail(e.target.value)} />
              <button onClick={searchUser} className="px-3 py-2 text-sm rounded-lg border hover:bg-accent cursor-pointer"><Search className="size-4" /></button>
            </div>
          </div>
          <div className="flex gap-2">
            <select className="flex-1 px-3 py-2 text-sm rounded-lg border bg-background" value={selectedPlaybook} onChange={e => setSelectedPlaybook(e.target.value)}>
              <option value="">Choisir un playbook...</option>
              {playbooks.map(p => <option key={p.id} value={p.detectType || p.id}>{p.name} ({p.severity})</option>)}
            </select>
            <button onClick={executePlaybook} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 cursor-pointer"><Play className="size-4" /></button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border p-6 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Evenements recents (HAUT/CRITIQUE)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead><tr className="border-b text-muted-foreground uppercase tracking-wider">
                <th className="px-3 py-2">Date</th><th className="px-3 py-2">Type</th><th className="px-3 py-2">Severite</th><th className="px-3 py-2">Utilisateur</th><th className="px-3 py-2">IP</th>
              </tr></thead>
              <tbody className="divide-y">
                {events.slice(0, 20).map(e => (
                  <tr key={e.id} className="hover:bg-accent/30">
                    <td className="px-3 py-2 text-muted-foreground">{new Date(e.createdAt).toLocaleString("fr-FR")}</td>
                    <td className="px-3 py-2 font-medium">{e.type}</td>
                    <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${e.severity === "CRITICAL" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"}`}>{e.severity}</span></td>
                    <td className="px-3 py-2">{e.user ? `${e.user.name} (${e.user.email})` : "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground font-mono text-[10px]">{e.ipAddress || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {events.length === 0 && <p className="text-sm text-muted-foreground py-8 text-center">Aucun evenement recent</p>}
          </div>
        </div>

        <div className="rounded-xl border p-6 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">IPs bloquees</h2>
          {ips.length === 0 ? <p className="text-sm text-muted-foreground">Aucune IP bloquee</p> : (
            <div className="space-y-2">
              {ips.map(({ ip, ttl }) => (
                <div key={ip} className="flex items-center justify-between p-2 rounded-lg bg-accent/20">
                  <div>
                    <p className="text-xs font-mono">{ip}</p>
                    <p className="text-[10px] text-muted-foreground">TTL: {Math.round(ttl / 60)}min</p>
                  </div>
                  <button onClick={() => unblockIp(ip)} className="p-1.5 rounded-md hover:bg-accent cursor-pointer"><Unlock className="size-3.5" /></button>
                </div>
              ))}
            </div>
          )}
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground pt-4">Playbooks disponibles</h2>
          <div className="space-y-1">
            {playbooks.map(p => (
              <div key={p.id} className="flex items-center justify-between p-2 rounded-lg text-xs">
                <span>{p.name}</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${p.severity === "P0" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>{p.severity}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }: { icon: ComponentType<{ className?: string }>; label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl border p-4 flex items-center gap-3">
      <div className={`p-2 rounded-lg bg-accent/30 ${color}`}><Icon className="size-5" /></div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-xl font-bold ${color}`}>{value}</p>
      </div>
    </div>
  )
}
