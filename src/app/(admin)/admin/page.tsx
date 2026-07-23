"use client"

import { useEffect, useState, useCallback, Suspense, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"
import { Card, cn } from "@nba/design-system"
import { toast } from "sonner"

import { SystemPulse } from "./components/SystemPulse"
import { SystemAlert } from "./components/SystemAlert"
import { NotificationBadge } from "./components/NotificationBadge"
import { AdminTools } from "./components/admin-tools"
import { AdminSidebar } from "./components/admin-sidebar"
import { TabSkeleton } from "./components/tab-skeleton"
import { OpenPanelArgs, RegisterRefetch } from "./features/types"
import { ADMIN_CONTEXTS, getContextForTab, getTabLabel } from "./admin-context"

const DashboardTab = dynamic(() => import("./features/DashboardTab"), { loading: () => <TabSkeleton />, ssr: false })
const UsersTab = dynamic(() => import("./features/UsersTab"), { loading: () => <TabSkeleton />, ssr: false })
const MembresTab = dynamic(() => import("./features/MembresTab"), { loading: () => <TabSkeleton />, ssr: false })
const RequestsTab = dynamic(() => import("./features/RequestsTab"), { loading: () => <TabSkeleton />, ssr: false })
const SignalsTab = dynamic(() => import("./features/SignalsTab"), { loading: () => <TabSkeleton />, ssr: false })
const KycTab = dynamic(() => import("./features/KycTab"), { loading: () => <TabSkeleton />, ssr: false })
const BrokerTab = dynamic(() => import("./features/BrokerTab"), { loading: () => <TabSkeleton />, ssr: false })
const AnalyticsTab = dynamic(() => import("./features/AnalyticsTab"), { loading: () => <TabSkeleton />, ssr: false })
const SecurityTab = dynamic(() => import("./features/SecurityTab"), { loading: () => <TabSkeleton />, ssr: false })
const FraudTab = dynamic(() => import("./features/FraudTab"), { loading: () => <TabSkeleton />, ssr: false })
const EmailsTab = dynamic(() => import("./features/EmailsTab"), { loading: () => <TabSkeleton />, ssr: false })
const SettingsTab = dynamic(() => import("./features/SettingsTab"), { loading: () => <TabSkeleton />, ssr: false })
const NotificationsTab = dynamic(() => import("./features/NotificationsTab"), { loading: () => <TabSkeleton />, ssr: false })
const AuditTab = dynamic(() => import("./features/AuditTab"), { loading: () => <TabSkeleton />, ssr: false })
const FormationTab = dynamic(() => import("./features/FormationTab"), { loading: () => <TabSkeleton />, ssr: false })
const DevicesTab = dynamic(() => import("./features/DevicesTab"), { loading: () => <TabSkeleton />, ssr: false })
const CronsTab = dynamic(() => import("./features/CronsTab"), { loading: () => <TabSkeleton />, ssr: false })

const AdminContextPanel = dynamic(
  () => import("./components/admin-context-panel").then((mod) => mod.AdminContextPanel),
  { ssr: false }
)

// Cache client léger pour éviter les refetch redondants entre onglets admin.
const adminCache = new Map<string, { time: number; data: unknown }>()

async function cachedGet(url: string, ttlMs = 60000): Promise<{ ok: boolean; data: any }> {
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
      <div className="flex items-center justify-center py-20 text-muted-foreground" role="status" aria-label="Chargement de la console admin">
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

  // Support tickets for sidebar badge
  const [tickets, setTickets] = useState<any[]>([])

  // System Pulse health state
  const [health, setHealth] = useState<{ status: "healthy" | "degraded" | "down"; lastActivity: string; activityRate: number; activeAlerts: number } | null>(null)

  // System alerts state (Notifications subtiles #256)
  const [systemAlerts, setSystemAlerts] = useState<Array<{ id: string; severity: "critical" | "warning"; title: string; description: string; actionLabel?: string; onAction?: () => void }>>([])
  const dismissAlert = useCallback((id: string) => {
    setSystemAlerts((prev) => prev.filter((a) => a.id !== id))
  }, [])

  // Fetch support ticket count for badge
  useEffect(() => {
    fetch("/api/admin/support")
      .then(r => r.json())
      .then(data => setTickets(Array.isArray(data?.messages) ? data.messages : []))
      .catch(() => {})
  }, [])

  // Pulse polling every 3s
  useEffect(() => {
    function poll() {
      fetch("/api/admin/security/fraud/health")
        .then(r => r.json())
        .then(d => {
          setHealth(d)
          if (d.status === "degraded" || d.status === "down") {
            setSystemAlerts((prev) => {
              const exists = prev.some((a) => a.id === "system-health")
              if (exists) return prev
              return [...prev, {
                id: "system-health",
                severity: d.status === "down" ? "critical" as const : "warning" as const,
                title: d.status === "down" ? "Système en panne" : "Mode dégradé",
                description: `${d.activeAlerts} alerte${d.activeAlerts > 1 ? "s" : ""} active${d.activeAlerts > 1 ? "s" : ""} — ${d.activityRate} action${d.activityRate > 1 ? "s" : ""}/min`,
                actionLabel: "Voir les logs",
                onAction: () => { window.location.href = "/admin?tab=audit" },
              }]
            })
          } else {
            setSystemAlerts((prev) => prev.filter((a) => a.id !== "system-health"))
          }
        })
        .catch(() => {})
    }
    poll()
    const id = setInterval(poll, 3000)
    return () => clearInterval(id)
  }, [])

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

  const openTickets = tickets.filter((t: any) => {
    const sd = (t.data ?? {}) as Record<string, unknown>
    return !sd.status || sd.status === "OPEN"
  }).length

  return (
    <div className="min-h-screen text-foreground font-sans antialiased flex pb-20 md:pb-0">

      <AdminSidebar activeTab={activeTab} supportCount={openTickets} />

      <main className="flex-1 min-w-0">

      <div className="animate-in fade-in-50 duration-200">

        <div className="relative md:hidden border-b border-border/40 bg-background/60">
          <div className="flex overflow-x-auto flex-nowrap items-center gap-2 px-4 py-2.5 scrollbar-none [-webkit-overflow-scrolling:touch] snap-x">
            <div className="shrink-0 w-1" />
            {ADMIN_CONTEXTS.flatMap((context, gi) => {
              const items: React.ReactNode[] = []
              const isContextActive = getContextForTab(activeTab) === context.id
              if (gi > 0) {
                items.push(<div key={`sep-${gi}`} className="shrink-0 w-px h-4 bg-border/30 mx-1" />)
              }
              items.push(
                <span key={`gl-${gi}`} className={cn("shrink-0 text-[10px] font-semibold uppercase tracking-wider select-none", isContextActive ? "text-primary" : "text-muted-foreground/50")}>
                  {context.label}
                </span>
              )
              context.tabs.forEach((tab) => {
                items.push(
                  <button key={tab.value} onClick={() => router.push(`/admin?tab=${tab.value}`)}
                    className={cn("text-[11px] px-3.5 py-1.5 rounded-lg border transition-colors cursor-pointer shrink-0 snap-start font-medium", activeTab === tab.value ? "bg-primary text-primary-foreground border-primary shadow-sm" : "border-border/60 text-muted-foreground hover:bg-muted/50 hover:text-foreground hover:border-border")}
                  >
                    {tab.label}
                  </button>
                )
              })
              return items
            })}
          </div>
        </div>

        <div className="p-4 md:p-6 lg:p-8 space-y-7">
        <AdminTools />

        {health && (
          <SystemPulse
            status={health.status}
            lastActivity={health.lastActivity ? new Date(health.lastActivity) : null}
            activityRate={health.activityRate}
            activeAlerts={health.activeAlerts}
          />
        )}

        {systemAlerts.length > 0 && (
          <div className="space-y-2">
            {systemAlerts.map((alert) => (
              <SystemAlert key={alert.id} alert={alert} onDismiss={dismissAlert} />
            ))}
          </div>
        )}

        {/* ============================================================== */}
        {/* MODULE VIEWS */}
        {/* ============================================================== */}
        {activeTab === "dashboard" && (
          <div key="dashboard" className="animate-slide-right">
            <DashboardTab opsData={opsData} loadingOps={loadingOps} errorOps={errorOps} router={router} />
          </div>
        )}

        {activeTab === "users" && (
          <div key="users" className="animate-slide-right">
            <UsersTab
              cachedGet={cachedGet}
              invalidate={invalidateAdminCache}
              onOpenPanel={openPanel}
              registerRefetch={registerRefetch}
              initialSearch={searchParams.get("search") || ""}
            />
          </div>
        )}

        {activeTab === "membres" && (
          <div key="membres" className="animate-slide-right">
            <MembresTab cachedGet={cachedGet} invalidate={invalidateAdminCache} />
          </div>
        )}

        {activeTab === "requests" && (
          <div key="requests" className="animate-slide-right">
            <RequestsTab cachedGet={cachedGet} invalidate={invalidateAdminCache} refreshOps={refreshOps} />
          </div>
        )}

        {activeTab === "signals" && (
          <div key="signals" className="animate-slide-right">
            <SignalsTab cachedGet={cachedGet} invalidate={invalidateAdminCache} onOpenPanel={openPanel} />
          </div>
        )}

        {activeTab === "kyc" && (
          <div key="kyc" className="animate-slide-right">
            <KycTab cachedGet={cachedGet} onOpenPanel={openPanel} registerRefetch={registerRefetch} />
          </div>
        )}

        {activeTab === "broker" && (
          <div key="broker" className="animate-slide-right">
            <BrokerTab cachedGet={cachedGet} invalidate={invalidateAdminCache} onOpenPanel={openPanel} registerRefetch={registerRefetch} />
          </div>
        )}

        {activeTab === "stats" && (
          <div key="stats" className="animate-slide-right space-y-6">
            <TabPageHeader title="Statistiques globales" description="Compteurs clés consolidés d'activité de la plateforme NBA." />
            {opsData ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <StatCard label="Membres" value={opsData.stats.totalMembers} />
                <StatCard label="Signaux émis" value={opsData.stats.publishedSignalsCount} />
                <StatCard label="Dossiers KYC Validés" value={opsData.stats.approvedKycCount} />
                <StatCard label="E-mails envoyés" value={opsData.stats.totalEmailsSent ?? 0} />
                <StatCard label="E-mails en échec" value={opsData.attention.failedEmailsCount ?? 0} trend={opsData.attention.failedEmailsCount > 0 ? "down" : "neutral"} />
                <StatCard label="Notifications envoyées" value={opsData.stats.totalNotificationsSent ?? 0} />
              </div>
            ) : (
              <div className="py-20 text-center text-sm text-muted-foreground">Chargement...</div>
            )}
          </div>
        )}

        {activeTab === "analytics" && (
          <div key="analytics" className="animate-slide-right">
            <AnalyticsTab cachedGet={cachedGet} />
          </div>
        )}

        {activeTab === "security" && (
          <div key="security" className="animate-slide-right">
            <SecurityTab cachedGet={cachedGet} invalidate={invalidateAdminCache} />
          </div>
        )}
        {activeTab === "fraud" && (
          <div key="fraud" className="animate-slide-right">
            <FraudTab />
          </div>
        )}

        {activeTab === "emails" && (
          <div key="emails" className="animate-slide-right">
            <EmailsTab cachedGet={cachedGet} opsData={opsData} />
          </div>
        )}

        {activeTab === "settings" && (
          <div key="settings" className="animate-slide-right">
            <SettingsTab cachedGet={cachedGet} />
          </div>
        )}

        {activeTab === "notifications" && (
          <div key="notifications" className="animate-slide-right">
            <NotificationsTab cachedGet={cachedGet} invalidate={invalidateAdminCache} />
          </div>
        )}

        {activeTab === "audit" && (
          <div key="audit" className="animate-slide-right">
            <AuditTab cachedGet={cachedGet} invalidate={invalidateAdminCache} />
          </div>
        )}

        {activeTab === "formation" && (
          <div key="formation" className="animate-slide-right">
            <FormationTab />
          </div>
        )}

        {activeTab === "devices" && (
          <div key="devices" className="animate-slide-right">
            <DevicesTab />
          </div>
        )}

        {activeTab === "crons" && (
          <div key="crons" className="animate-slide-right">
            <CronsTab />
          </div>
        )}

        </div>{/* fermeture p-4 md:p-6 lg:p-8 */}
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
      </main>
    </div>
  )
}

function StatCard({ label, value, trend }: { label: string; value: number; trend?: "up" | "down" | "neutral" }) {
  return (
    <Card className="border-border/60 bg-card shadow-sm">
      <div className="p-5 space-y-1.5">
        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{label}</span>
        <div className="flex items-center gap-2">
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {trend === "up" && <span className="text-[10px] text-emerald-500">▲</span>}
          {trend === "down" && <span className="text-[10px] text-rose-500">▼</span>}
        </div>
      </div>
    </Card>
  )
}

function TabPageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="border-b border-border/40 pb-4 mb-6">
      <h1 className="text-xl font-bold tracking-tight text-foreground">{title}</h1>
      {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
    </div>
  )
}
