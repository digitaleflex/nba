"use client"

import { useEffect, useState, useCallback } from "react"
import { Search, Loader2 } from "lucide-react"
import { Card, Badge, Button, Input, cn } from "@nba/design-system"
import { Member, CachedGet, OpenPanel, RegisterRefetch } from "./types"
import { useDebounce } from "./useDebounce"

interface UsersTabProps {
  cachedGet: CachedGet
  invalidate: () => void
  onOpenPanel: OpenPanel
  registerRefetch: RegisterRefetch
  initialSearch?: string
}

export function UsersTab({ cachedGet, onOpenPanel, registerRefetch, initialSearch = "" }: UsersTabProps) {
  const [members, setMembers] = useState<Member[]>([])
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [searchUser, setSearchUser] = useState(initialSearch)
  const debouncedSearchUser = useDebounce(searchUser, 300)

  const fetchMembers = useCallback(async () => {
    setLoadingMembers(true)
    try {
      const url = debouncedSearchUser ? `/api/admin/members?q=${encodeURIComponent(debouncedSearchUser)}` : "/api/admin/members"
      const { ok, data } = await cachedGet(url)
      if (ok) {
        setMembers(Array.isArray(data.members) ? data.members : [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingMembers(false)
    }
  }, [cachedGet, debouncedSearchUser])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMembers()
    registerRefetch(() => {
      fetchMembers()
    })
    return () => registerRefetch(null)
  }, [fetchMembers, registerRefetch])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Gestion des membres</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Recherchez des comptes, modifiez les accès ou suspendez les abonnés.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, email..."
            value={searchUser}
            onChange={(e) => setSearchUser(e.target.value)}
            className="pl-9 bg-background border-border text-xs text-foreground"
          />
        </div>
        <Button variant="default" size="sm" onClick={fetchMembers} className="cursor-pointer">
          Rechercher
        </Button>
      </div>

      <Card className="border-border bg-card/10">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-card/30 text-muted-foreground font-bold uppercase tracking-wider text-[10px]">
                <th className="px-6 py-3">Utilisateur</th>
                <th className="px-6 py-3">Rôle</th>
                <th className="px-6 py-3">WhatsApp</th>
                <th className="px-6 py-3">Onboarding</th>
                <th className="px-6 py-3">Statut</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loadingMembers ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center"><Loader2 className="animate-spin text-primary inline" /></td>
                </tr>
              ) : members.length > 0 ? (
                members.map((member) => (
                  <tr key={member.id} className="hover:bg-card/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                          {(member.name || member.email || "?").slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{member.name || "—"}</p>
                          <p className="text-[10px] text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-muted-foreground">{member.role?.name}</td>
                    <td className="px-6 py-4 text-muted-foreground">{member.phone || "—"}</td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="text-[9px] border-border py-0.5 px-2">
                        {member.onboardingStatus}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className={cn(member.isActive ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-rose-500/10 text-rose-600 border-rose-500/20")}>
                        {member.isActive ? "Actif" : "Suspendu"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[10px] text-muted-foreground hover:text-foreground cursor-pointer"
                        onClick={() => {
                          onOpenPanel({ title: "Détails Utilisateur", type: "user", data: member })
                        }}
                      >
                        Voir
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">Aucun membre trouvé.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
