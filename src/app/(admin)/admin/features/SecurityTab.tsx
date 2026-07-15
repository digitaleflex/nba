"use client"

import { useEffect, useState, useCallback } from "react"
import { Loader2, EyeOff, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, Button } from "@nba/design-system"
import { EmptyState } from "@nba/app/components/empty-state"
import { CachedGet } from "./types"

interface SecurityTabProps {
  cachedGet: CachedGet
  invalidate: () => void
}

export function SecurityTab({ cachedGet, invalidate }: SecurityTabProps) {
  const [securityData, setSecurityData] = useState<any>(null)
  const [loadingSecurity, setLoadingSecurity] = useState(false)
  const [sessions, setSessions] = useState<any[]>([])
  const [loadingSessions, setLoadingSessions] = useState(false)

  const fetchSecurity = useCallback(async () => {
    setLoadingSecurity(true)
    try {
      const { ok, data } = await cachedGet("/api/admin/security")
      if (ok) {
        setSecurityData(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingSecurity(false)
    }
  }, [cachedGet])

  const fetchSessions = useCallback(async () => {
    setLoadingSessions(true)
    try {
      const { ok, data } = await cachedGet("/api/admin/security/sessions")
      if (ok) {
        setSessions(data || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingSessions(false)
    }
  }, [cachedGet])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSecurity()
    fetchSessions()
  }, [fetchSecurity, fetchSessions])

  async function handleRevokeSession(id: string) {
    if (!confirm("Révoquer cette session ? L'utilisateur devra se reconnecter.")) return
    invalidate()
    try {
      const res = await fetch(`/api/admin/security/sessions/${id}`, { method: "DELETE" })
      if (res.ok) {
        fetchSessions()
        toast.success("Session révoquée avec succès.")
      } else {
        toast.error("Erreur lors de la révocation de la session.")
      }
    } catch (err) {
      console.error(err)
      toast.error("Erreur lors de la révocation de la session.")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Centre de sécurité</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Surveillez les connexions récentes et détectez d&apos;éventuelles tentatives d&apos;intrusion.
          </p>
        </div>
      </div>

      {loadingSecurity ? (
        <div className="py-10 flex justify-center">
          <Loader2 className="animate-spin text-primary size-6" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Connexions récentes */}
          <Card className="border-border bg-card/30">
            <CardContent className="p-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground pb-4 border-b border-border">
                Sessions actives
              </h3>
              <div className="pt-4 space-y-3">
                {securityData?.activeSessions > 0 ? (
                  <>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Sessions ouvertes</span>
                      <span className="font-bold text-foreground">{securityData.activeSessions}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">IPs uniques</span>
                      <span className="font-bold text-foreground">{securityData.uniqueIps || 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Dernière connexion</span>
                      <span className="text-muted-foreground">{securityData.lastLogin || "—"}</span>
                    </div>
                  </>
                ) : (
                  <EmptyState icon={EyeOff} title="Aucune session active" />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tentatives de force brute */}
          <Card className="border-border bg-card/30">
            <CardContent className="p-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground pb-4 border-b border-border">
                Tentatives de connexion échouées
              </h3>
              <div className="pt-4 space-y-3">
                {securityData?.failedLogins > 0 ? (
                  <>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Échecs aujourd&apos;hui</span>
                      <span className="font-bold text-destructive">{securityData.failedLogins}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Dernière tentative</span>
                      <span className="text-muted-foreground">{securityData.lastFailedAttempt || "—"}</span>
                    </div>
                  </>
                ) : (
                  <EmptyState icon={ShieldCheck} title="Aucune tentative suspecte" />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sessions récentes */}
      <Card className="border-border bg-card/30">
        <CardContent className="p-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground pb-4 border-b border-border">
            Sessions récentes
          </h3>
          {loadingSessions ? (
            <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
          ) : sessions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-card/30 text-muted-foreground font-bold uppercase tracking-wider text-[10px]">
                    <th className="px-4 py-3">Utilisateur</th>
                    <th className="px-4 py-3">IP</th>
                    <th className="px-4 py-3">User-Agent</th>
                    <th className="px-4 py-3">Créée le</th>
                    <th className="px-4 py-3">Expire le</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sessions.map((s) => (
                    <tr key={s.id} className="hover:bg-card/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-foreground">{s.user?.name || "—"}</p>
                        <p className="text-[10px] text-muted-foreground">{s.user?.email || "—"}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{s.ipAddress || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">{s.userAgent || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(s.createdAt).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(s.expiresAt).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="destructive"
                          size="sm"
                          className="text-[10px] h-7 px-3.5 cursor-pointer"
                          onClick={() => handleRevokeSession(s.id)}
                        >
                          Révoquer
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState icon={EyeOff} title="Aucune session enregistrée" />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
