"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Shield, Trash2, Ban, RefreshCw, UserX, AlertTriangle } from "lucide-react"
import { Card, CardContent, Button, Input, Badge, cn } from "@nba/design-system"

export function ModerationTab() {
  const [bans, setBans] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [banEmail, setBanEmail] = useState("")
  const [banReason, setBanReason] = useState("")
  const [banning, setBanning] = useState(false)

  const fetchBans = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/moderation/bans")
      if (res.ok) setBans(await res.json())
    } catch { toast.error("Erreur de chargement") }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchBans() }, [])

  async function handleBan() {
    if (!banEmail || !banReason) { toast.error("Email et motif requis"); return }
    setBanning(true)
    try {
      const res = await fetch("/api/admin/moderation/bans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: banEmail, reason: banReason }),
      })
      if (res.ok) {
        toast.success(`${banEmail} banni`)
        setBanEmail("")
        setBanReason("")
        fetchBans()
      } else {
        toast.error("Erreur lors du bannissement")
      }
    } catch { toast.error("Erreur réseau") }
    finally { setBanning(false) }
  }

  async function handleUnban(email: string) {
    if (!confirm(`Réhabiliter ${email} ?`)) return
    try {
      const res = await fetch("/api/admin/moderation/bans", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      if (res.ok) { toast.success(`${email} réhabilité`); fetchBans() }
      else toast.error("Erreur")
    } catch { toast.error("Erreur réseau") }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Shield className="size-5 text-amber-500" /> Modération
          </h1>
          <p className="text-xs text-muted-foreground mt-1">Bannir les fraudeurs, blacklister les emails</p>
        </div>
      </div>

      {/* Bannir un utilisateur */}
      <Card className="border-rose-500/20">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Ban className="size-4 text-rose-500" />
            <h2 className="text-sm font-semibold text-foreground">Bannir un utilisateur</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Le bannissement supprime le compte, révoque les sessions et bloque toute réinscription avec cet email.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Email à bannir..."
              value={banEmail}
              onChange={(e) => setBanEmail(e.target.value)}
              className="flex-1 h-9 text-xs"
            />
            <Input
              placeholder="Motif (fraude, spam, multi-compte...)"
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              className="flex-[2] h-9 text-xs"
            />
            <Button
              onClick={handleBan}
              disabled={banning || !banEmail || !banReason}
              className="bg-rose-600 hover:bg-rose-700 text-white shrink-0"
              size="sm"
            >
              {banning ? <RefreshCw className="size-3.5 animate-spin" /> : <UserX className="size-3.5" />}
              Bannir
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste des bannis */}
      <Card className="border-border">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">
              Emails blacklistés ({bans.length})
            </h2>
          </div>
          {loading ? (
            <div className="py-6 text-center"><RefreshCw className="size-5 animate-spin text-muted-foreground mx-auto" /></div>
          ) : bans.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">Aucun email blacklisté.</p>
          ) : (
            <div className="space-y-2">
              {bans.map((b: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-rose-500/5 border border-rose-500/10">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-foreground">{b.email}</span>
                      <Badge variant="outline" className="text-[10px] bg-rose-500/10 text-rose-600 border-rose-500/20">{b.reason}</Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Banni le {new Date(b.bannedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleUnban(b.email)}
                    className="text-xs text-muted-foreground hover:text-foreground">
                    <Trash2 className="size-3 mr-1" /> Réhabiliter
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}