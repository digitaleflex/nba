"use client"

import { useEffect, useState, useCallback, Suspense, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"
import { cn } from "@nba/design-system"
import { toast } from "sonner"

import { DashboardTab } from "./features/DashboardTab"
import { RequestsTab } from "./features/RequestsTab"
import { SignalsTab } from "./features/SignalsTab"
import { KycTab } from "./features/KycTab"
import { BrokerTab } from "./features/BrokerTab"
import { StatsTab } from "./features/StatsTab"
import { AnalyticsTab } from "./features/AnalyticsTab"
import { SecurityTab } from "./features/SecurityTab"
import { EmailsTab } from "./features/EmailsTab"
import { SettingsTab } from "./features/SettingsTab"
import { AuditTab } from "./features/AuditTab"
import { UsersTab } from "./features/UsersTab"
import { MembresTab } from "./features/MembresTab"
import { NotificationsTab } from "./features/NotificationsTab"
import { ModerationTab } from "./features/ModerationTab"
import { FormationTab } from "./features/FormationTab"
import { DevicesTab } from "./features/DevicesTab"
import { AdminTools } from "./components/admin-tools"
import { OpenPanelArgs, RegisterRefetch } from "./features/types"
import { ADMIN_CONTEXTS, getContextForTab, getTabLabel } from "./admin-context"

const AdminContextPanel = dynamic(
  () => import("./components/admin-context-panel").then((mod) => mod.AdminContextPanel),
  { ssr: false }
)

// Cache client léger pour éviter les refetch redondants entre onglets admin.
const adminCache = new Map<string, { time: number; data: unknown }>()

async function cachedGet(url: string, ttlMs = 20000): Promise<{ ok: boolean; data: any }> {
  const hit = adminCache.get(url)
  if (hit && Date.now() - hit.time < ttlMs) {
    return { ok: true, data: hit.data }
  }
  const res = await fetch(url)
  if (!res.ok) {
    // On ne remonte que le message user-friendly ('error') renvoyé par l'API,
    // jamais le corps brut (évite toute fuite de données techniques).
    let errMsg: string | null = null
    try {
      const body = (await res.json()) as { error?: string }
      errMsg = body?.error ?? null
    } catch {
      // corps non-JSON : on garde null
    }
    return { ok: false, data: errMsg ? { error: errMsg } : null }
  }
  const data = await res.json()
  adminCache.set(url, { time: Date.now(), data })
  return { ok: true, data }
}

function invalidateAdminCache() {
  adminCache.clear()
}

export default function AdminPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20 text-muted-foreground h-screen">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    }>
      <AdminConsoleContent />
    </Suspense>
  )
}

function AdminConsoleContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeTab = searchParams.get("tab") || "dashboard"

  // Context Panel State
  const [panelOpen, setPanelOpen] = useState(false)
  const [panelTitle, setPanelTitle] = useState("")
  const [panelType, setPanelType] = useState<"user" | "kyc" | "broker" | "signal" | null>(null)
  const [panelData, setPanelData] = useState<any>(null)
  const [panelBreadcrumb, setPanelBreadcrumb] = useState<string | undefined>(undefined)

  // Operations Center Data
  const [opsData, setOpsData] = useState<any>(null)
  const [loadingOps, setLoadingOps] = useState(true)
  const [errorOps, setErrorOps] = useState<string | null>(null)

  // Refetch registration from the active tab (used by the shared context panel)
  const activeRefetch = useRef<(() => void) | null>(null)
  const registerRefetch: RegisterRefetch = useCallback((fn) => {
    activeRefetch.current = fn ?? null
  }, [])

  const openPanel = useCallback((args: OpenPanelArgs) => {
    setPanelTitle(args.title)
    setPanelType(args.type)
    setPanelData(args.data)
    setPanelBreadcrumb(args.breadcrumb ?? getTabLabel(activeTab))
    setPanelOpen(true)
  }, [activeTab])

  // Fetch Operations Center data
  const fetchOperations = useCallback(async () => {
    setLoadingOps(true)
    setErrorOps(null)
    try {
      const { ok, data } = await cachedGet("/api/admin/operations")
      if (ok) {
        setOpsData(data)
      } else {
        setErrorOps("Erreur de chargement des opérations")
      }
    } catch (err) {
      console.error(err)
      setErrorOps("Erreur de chargement des opérations")
    } finally {
      setLoadingOps(false)
    }
  }, [])

  // Helper: execute an action, show toast with undo button
  const undoableAction = useCallback(async (
    execute: () => Promise<boolean>,
    undo: () => Promise<void>,
    successMsg: string,
  ) => {
    const ok = await execute()
    if (!ok) return
    toast.success(successMsg, {
      action: {
        label: "Annuler",
        onClick: async () => {
          await undo()
          toast.info("Action annulée")
          invalidateAdminCache()
          activeRefetch.current?.()
        },
      },
      duration: 6000,
    })
  }, [])

  const refreshOps = useCallback(() => {
    invalidateAdminCache()
    fetchOperations()
  }, [fetchOperations])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOperations()
    // Dashboard live par défaut : auto-refresh 10s
    const id = setInterval(fetchOperations, 10_000)
    return () => clearInterval(id)
  }, [fetchOperations])

  // Context Panel Action Executions
  const handlePanelAction = async (actionType: string, extraData?: any) => {
    invalidateAdminCache()
    try {
      if (actionType === "suspend" || actionType === "reactivate") {
        const makeActive = actionType === "reactivate"
        await undoableAction(
          async () => {
            const res = await fetch("/api/admin/members", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId: extraData.id, isActive: makeActive }),
            })
            if (res.ok) { activeRefetch.current?.(); setPanelOpen(false); return true }
            return false
          },
          async () => {
            await fetch("/api/admin/members", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId: extraData.id, isActive: !makeActive }),
            })
          },
          `Utilisateur ${makeActive ? "réactivé" : "suspendu"}`,
        )
      } else if (actionType === "kyc_approve" || actionType === "kyc_reject") {
        const status = actionType === "kyc_approve" ? "APPROVED" : "REJECTED"
        const res = await fetch(`/api/admin/kyc/${extraData.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status, notes: extraData.notes || "Approuvé/Refusé via le panneau d'opérations" }),
        })
        if (res.ok) {
          activeRefetch.current?.()
          fetchOperations()
          setPanelOpen(false)
          toast.success("Document KYC traité.")
        } else {
          toast.error("Erreur lors du traitement KYC.")
        }
      } else if (actionType === "broker_approve" || actionType === "broker_reject") {
        const status = actionType === "broker_approve" ? "APPROVED" : "REJECTED"
        const res = await fetch(`/api/admin/broker/${extraData.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status, notes: extraData.notes || "Traité via le panneau d'opérations" }),
        })
        if (res.ok) {
          activeRefetch.current?.()
          fetchOperations()
          setPanelOpen(false)
          toast.success("Compte broker traité.")
        } else {
          toast.error("Erreur lors du traitement broker.")
        }
      } else if (actionType === "change_role") {
        const rolesRes = await fetch("/api/admin/roles")
        if (!rolesRes.ok) { toast.error("Erreur lors du chargement des rôles."); return }
        const roles = await rolesRes.json()
        const role = roles.find((r: any) => r.name === extraData.roleName)
        if (!role) { toast.error("Rôle introuvable."); return }
        const prevRole = roles.find((r: any) => r.name === extraData.prevRoleName)
        await undoableAction(
          async () => {
            const updateRes = await fetch("/api/admin/members", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId: extraData.id, roleId: role.id }),
            })
            if (updateRes.ok) {
              activeRefetch.current?.()
              setPanelOpen(false)
              return true
            }
            return false
          },
          async () => {
            if (!prevRole) {
              toast.error("Rôle précédent introuvable — annulation impossible.")
              return
            }
            await fetch("/api/admin/members", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId: extraData.id, roleId: prevRole.id }),
            })
            activeRefetch.current?.()
          },
          `Rôle changé en ${extraData.roleName}`,
        )
      } else if (actionType === "revoke_sessions") {
        const res = await fetch("/api/admin/members/revoke-sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: extraData.id }),
        })
        if (res.ok) {
          setPanelOpen(false)
          toast.success("Toutes les sessions de l'utilisateur ont été révoquées.")
        } else {
          toast.error("Erreur lors de la révocation des sessions.")
        }
      } else if (actionType === "reset_realtime") {
        const res = await fetch("/api/admin/members/reset-realtime", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: extraData.id }),
        })
        if (res.ok) {
          setPanelOpen(false)
          toast.success("Real-time réinitialisé pour l'utilisateur (sockets déconnectés).")
        } else {
          toast.error("Erreur lors du reset real-time.")
        }
      } else if (actionType === "mark_messages_read") {
        const res = await fetch("/api/admin/members/mark-messages-read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: extraData.id }),
        })
        if (res.ok) {
          setPanelOpen(false)
          toast.success("Tous les messages de l'utilisateur ont été marqués comme lus.")
        } else {
          toast.error("Erreur lors de la mise à jour des messages.")
        }
      } else if (actionType === "reset_email") {
        const prevStatus = extraData.emailStatus || "BOUNCED"
        await undoableAction(
          async () => {
            const res = await fetch("/api/admin/members", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId: extraData.id, emailStatus: "OK" }),
            })
            if (res.ok) { activeRefetch.current?.(); setPanelOpen(false); return true }
            return false
          },
          async () => {
            await fetch("/api/admin/members", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId: extraData.id, emailStatus: prevStatus }),
            })
          },
          "Email réinitialisé",
        )
      } else if (actionType === "toggle_signal_override") {
        const prevValue = extraData.prevValue ?? !extraData.value
        await undoableAction(
          async () => {
            const res = await fetch("/api/admin/members", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId: extraData.id, signalsAccessOverride: extraData.value }),
            })
            if (res.ok) {
              setPanelData((prev: any) => (prev ? { ...prev, signalsAccessOverride: extraData.value } : prev))
              activeRefetch.current?.()
              fetchOperations()
              setPanelOpen(false)
              return true
            }
            return false
          },
          async () => {
            await fetch("/api/admin/members", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId: extraData.id, signalsAccessOverride: prevValue }),
            })
            setPanelData((prev: any) => (prev ? { ...prev, signalsAccessOverride: prevValue } : prev))
          },
          extraData.value ? "Accès aux signaux exceptionnel accordé." : "Accès aux signaux exceptionnel révoqué.",
        )
      } else if (actionType === "force_onboarding") {
        const res = await fetch("/api/admin/members", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: extraData.id, onboardingStatus: "ACTIVE" }),
        })
        if (res.ok) {
          activeRefetch.current?.()
          setPanelOpen(false)
          toast.success("Statut d'onboarding forcé à ACTIVE avec succès.")
        } else {
          toast.error("Erreur lors de la validation manuelle.")
        }
      } else if (actionType === "delete_user") {
        const res = await fetch(`/api/admin/members?userId=${extraData.id}`, { method: "DELETE" })
        if (res.ok) {
          activeRefetch.current?.()
          setPanelOpen(false)
          toast.success("Utilisateur supprimé avec succès.")
        } else {
          toast.error("Erreur lors de la suppression.")
        }
      } else if (actionType === "ban_user") {
        const res = await fetch("/api/admin/moderation/bans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: extraData.email, reason: extraData.reason }),
        })
        if (res.ok) {
          activeRefetch.current?.()
          setPanelOpen(false)
          toast.success(`${extraData.email} banni et blacklisté`)
        } else {
          toast.error("Erreur lors du bannissement")
        }
      } else if (actionType === "send_user_notification") {
        const res = await fetch("/api/admin/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: extraData.id,
            title: extraData.title,
            content: extraData.content,
          }),
        })
        if (res.ok) {
          toast.success("Notification individuelle envoyée avec succès.")
        } else {
          toast.error("Erreur lors de l'envoi de la notification.")
        }
      } else if (actionType === "impersonate") {
        const res = await fetch(`/api/admin/members/${extraData.id}/impersonate`, {
          method: "POST",
        })
        if (res.ok) {
          toast.success("Connexion en tant que l'utilisateur…")
          // better-auth a posé un nouveau cookie de session : on force un
          // full reload pour adopter la session du membre côté client.
          window.location.href = "/dashboard"
        } else {
          const body = await res.json().catch(() => ({}))
          toast.error(body.error || "Impossible de vous connecter en tant que cet utilisateur.")
        }
      }
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="min-h-screen text-foreground font-sans antialiased pb-20 md:pb-0">
      {/* Dynamic Module views */}
      <div className="space-y-7 animate-in fade-in-50 duration-200">

        {/* ============================================================== */}
        {/* SUB-NAVIGATION (4 contextes mentaux) */}
        {/* ============================================================== */}
        <div className="relative">
          <div className="flex overflow-x-auto flex-nowrap items-center gap-2 pb-1 scrollbar-none [-webkit-overflow-scrolling:touch] snap-x">
            <div className="shrink-0 w-1" />
            {/* Right fade gradient hint (mobile only) */}
            <div className="pointer-events-none absolute right-0 top-0 bottom-1 w-10 bg-gradient-to-l from-background to-transparent md:hidden" />
            {ADMIN_CONTEXTS.flatMap((context, gi) => {
              const items: React.ReactNode[] = []
              const isContextActive = getContextForTab(activeTab) === context.id
              if (gi > 0) {
                items.push(<div key={`sep-${gi}`} className="shrink-0 w-px h-5 bg-border/40 mx-1.5" />)
              }
              items.push(
                <span
                  key={`gl-${gi}`}
                  className={cn(
                    "shrink-0 text-[10px] font-semibold uppercase tracking-wider select-none",
                    isContextActive ? "text-primary" : "text-muted-foreground/50"
                  )}
                >
                  {context.label}
                </span>
              )
              context.tabs.forEach((tab) => {
                items.push(
                  <button
                    key={tab.value}
                    onClick={() => router.push(`/admin?tab=${tab.value}`)}
                    className={cn(
                      "text-[11px] px-3 min-h-[30px] md:min-h-0 md:py-1.5 rounded-full border transition-colors cursor-pointer shrink-0 snap-start",
                      activeTab === tab.value
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border text-muted-foreground hover:bg-muted/50"
                    )}
                  >
                    {tab.label}
                  </button>
                )
              })
              return items
            })}
          </div>
          {activeTab === "moderation" && (
            <ModerationTab />
          )}
        </div>

        {/* ============================================================== */}
        {/* OUTILS SUPER-ADMIN (toujours visibles) */}
        {/* ============================================================== */}
        <AdminTools />

        {/* ============================================================== */}
        {/* MODULE VIEWS */}
        {/* ============================================================== */}
        {activeTab === "dashboard" && (
          <DashboardTab opsData={opsData} loadingOps={loadingOps} errorOps={errorOps} router={router} />
        )}

        {activeTab === "users" && (
          <UsersTab
            cachedGet={cachedGet}
            invalidate={invalidateAdminCache}
            onOpenPanel={openPanel}
            registerRefetch={registerRefetch}
            initialSearch={searchParams.get("search") || ""}
          />
        )}

        {activeTab === "membres" && (
          <MembresTab cachedGet={cachedGet} invalidate={invalidateAdminCache} />
        )}

        {activeTab === "requests" && (
          <RequestsTab cachedGet={cachedGet} invalidate={invalidateAdminCache} refreshOps={refreshOps} />
        )}

        {activeTab === "signals" && (
          <SignalsTab cachedGet={cachedGet} invalidate={invalidateAdminCache} onOpenPanel={openPanel} />
        )}

        {activeTab === "kyc" && (
          <KycTab cachedGet={cachedGet} onOpenPanel={openPanel} registerRefetch={registerRefetch} />
        )}

        {activeTab === "broker" && (
          <BrokerTab cachedGet={cachedGet} invalidate={invalidateAdminCache} onOpenPanel={openPanel} registerRefetch={registerRefetch} />
        )}

        {activeTab === "stats" && (
          <StatsTab opsData={opsData} />
        )}

        {activeTab === "analytics" && (
          <AnalyticsTab cachedGet={cachedGet} />
        )}

        {activeTab === "security" && (
          <SecurityTab cachedGet={cachedGet} invalidate={invalidateAdminCache} />
        )}

        {activeTab === "emails" && (
          <EmailsTab cachedGet={cachedGet} opsData={opsData} />
        )}

        {activeTab === "settings" && (
          <SettingsTab cachedGet={cachedGet} />
        )}

        {activeTab === "notifications" && (
          <NotificationsTab cachedGet={cachedGet} invalidate={invalidateAdminCache} />
        )}

        {activeTab === "audit" && (
          <AuditTab cachedGet={cachedGet} invalidate={invalidateAdminCache} />
        )}

        {activeTab === "formation" && (
          <FormationTab />
        )}

        {activeTab === "devices" && (
          <DevicesTab />
        )}

      </div>

      {/* Admin sliding contextual detail panel */}
      <AdminContextPanel
        isOpen={panelOpen}
        onClose={() => setPanelOpen(false)}
        title={panelTitle}
        type={panelType}
        data={panelData}
        breadcrumb={panelBreadcrumb}
        onAction={handlePanelAction}
      />
    </div>
  )
}
