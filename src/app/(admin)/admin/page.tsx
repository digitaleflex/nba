"use client"

import { useEffect, useState, useCallback, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { authClient } from "@nba/lib/auth-client"
import {
  Check, X, Clock, ExternalLink, ListTodo, Radio, History, Trash2, Calendar,
  Search, Eye, Layers, Copy, Play, Loader2, Laptop, Phone, Users, Shield,
  FileCheck, Link2, Bell, Activity, BarChart2, Settings, Ban, ArrowRight,
  AlertTriangle, Server, ArrowUpRight, Image as ImageIcon
} from "lucide-react"
import { toast } from "sonner"
import { Button, Card, CardContent, Badge, Tabs, TabsList, TabsTrigger, TabsContent, Input, cn } from "@nba/design-system"
import dynamic from "next/dynamic"

const SignalEditor = dynamic(
  () => import("./components/signal-editor").then((mod) => mod.SignalEditor),
  {
    loading: () => (
      <div className="py-12 flex justify-center items-center">
        <Loader2 className="animate-spin text-primary size-6" />
      </div>
    ),
    ssr: false,
  }
)

const AdminContextPanel = dynamic(
  () => import("./components/admin-context-panel").then((mod) => mod.AdminContextPanel),
  { ssr: false }
)

import { parseSimpleMarkdown } from "@nba/lib/utils"
import { useNotificationSound } from "@nba/lib/hooks/use-notification-sound"

interface AccessRequest {
  id: string
  status: string
  createdAt: string
  user: {
    id: string
    name: string
    email: string
    phone: string | null
    country: string | null
    onboardingStatus: string
    createdAt: string
  }
  plan: {
    name: string
  }
  onboarding: {
    status: string
    progress: number
    checklist: Record<string, boolean>
    nextStep: string | null
  }
}

interface Signal {
  id: string
  content: string
  imageUrl: string | null
  imageUrls: any
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED"
  publishedAt: string | null
  scheduledAt: string | null
  createdAt: string
  creator: { name: string }
  audience: { plan: { name: string } }[]
  currentVersion: number
}

interface Member {
  id: string
  name: string
  email: string
  phone: string | null
  country: string | null
  onboardingStatus: string
  isActive: boolean
  createdAt: string
  role: { name: string }
  _count: {
    accessRequests: number
    kycDocuments: number
    notifications: number
  }
}

interface KYCDoc {
  id: string
  type: string
  status: string
  createdAt: string
  submittedAt: string
  user: { name: string; email: string }
  files?: { label: string; url: string }[]
}

interface BrokerVerification {
  id: string
  brokerName: string
  accountId: string
  status: string
  createdAt: string
  submittedAt: string
  videoUrl?: string
  videoFilePath?: string
  user: { name: string; email: string }
}

interface AuditLog {
  id: string
  action: string
  resourceType: string
  createdAt: string
  ipAddress: string | null
  user: { name: string; email: string } | null
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
  const { data: currentSession } = authClient.useSession()
  const { play: playNotifSound } = useNotificationSound()

  // Context Panel State
  const [panelOpen, setPanelOpen] = useState(false)
  const [panelTitle, setPanelTitle] = useState("")
  const [panelType, setPanelType] = useState<"user" | "kyc" | "broker" | "signal" | null>(null)
  const [panelData, setPanelData] = useState<any>(null)

  // Operations Center Data
  const [opsData, setOpsData] = useState<any>(null)
  const [loadingOps, setLoadingOps] = useState(true)

  // Module Users State
  const [members, setMembers] = useState<Member[]>([])
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [searchUser, setSearchUser] = useState(searchParams.get("search") || "")

  // Module Membres State (approuvés par abonnement)
  const [membres, setMembres] = useState<any[]>([])
  const [membrePlanFilter, setMembrePlanFilter] = useState("")
  const [membrePlans, setMembrePlans] = useState<any[]>([])
  const [loadingMembres, setLoadingMembres] = useState(false)

  // Module Requests State
  const [requests, setRequests] = useState<AccessRequest[]>([])
  const [loadingRequests, setLoadingRequests] = useState(false)

  // Module Signals State
  const [signals, setSignals] = useState<Signal[]>([])
  const [loadingSignals, setLoadingSignals] = useState(false)

  // Module KYC State
  const [kycDocs, setKycDocs] = useState<KYCDoc[]>([])
  const [loadingKyc, setLoadingKyc] = useState(false)
  const [kycPage, setKycPage] = useState(1)
  const [kycTotalPages, setKycTotalPages] = useState(1)
  const [kycStatusFilter, setKycStatusFilter] = useState("ALL")

  // Module Broker State
  const [brokerDocs, setBrokerDocs] = useState<BrokerVerification[]>([])
  const [loadingBroker, setLoadingBroker] = useState(false)
  const [brokerPage, setBrokerPage] = useState(1)
  const [brokerTotalPages, setBrokerTotalPages] = useState(1)
  const [brokerStatusFilter, setBrokerStatusFilter] = useState("ALL")

  // Module Audit State
  const [audits, setAudits] = useState<AuditLog[]>([])
  const [loadingAudits, setLoadingAudits] = useState(false)

  // Module Notifications State
  const [notifTitle, setNotifTitle] = useState("")
  const [notifContent, setNotifContent] = useState("")
  const [sendingNotif, setSendingNotif] = useState(false)
  const [sendingTest, setSendingTest] = useState(false)
  const [notifSent, setNotifSent] = useState(false)
  const [notifTested, setNotifTested] = useState(false)
  const [notifHistory, setNotifHistory] = useState<any[]>([])
  const [loadingNotifHistory, setLoadingNotifHistory] = useState(false)

  // Module Security State
  const [securityData, setSecurityData] = useState<any>(null)
  const [loadingSecurity, setLoadingSecurity] = useState(false)

  // Module Settings State (empty - SMTP removed, using Resend)

  // Error states
  const [errorOps, setErrorOps] = useState<string | null>(null)
  const [errorMembers, setErrorMembers] = useState<string | null>(null)
  const [errorRequests, setErrorRequests] = useState<string | null>(null)
  const [errorSignals, setErrorSignals] = useState<string | null>(null)
  const [errorKyc, setErrorKyc] = useState<string | null>(null)
  const [errorBroker, setErrorBroker] = useState<string | null>(null)

  // Search/Filters (General UI)
  const [generalSearch, setGeneralSearch] = useState("")

  // Fetch Operations Center data
  const fetchOperations = useCallback(async () => {
    setLoadingOps(true)
    setErrorOps(null)
    try {
      const res = await fetch("/api/admin/operations")
      if (res.ok) {
        const data = await res.json()
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

  // Fetch Users
  const fetchMembers = useCallback(async () => {
    setLoadingMembers(true)
    setErrorMembers(null)
    try {
      const url = searchUser ? `/api/admin/members?q=${encodeURIComponent(searchUser)}` : "/api/admin/members"
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setMembers(data.members || [])
      } else {
        setErrorMembers("Erreur de chargement des membres")
      }
    } catch (err) {
      console.error(err)
      setErrorMembers("Erreur de chargement des membres")
    } finally {
      setLoadingMembers(false)
    }
  }, [searchUser])

  // Fetch Membres (approuvés, filtrables par abonnement)
  const fetchMembres = useCallback(async () => {
    setLoadingMembres(true)
    try {
      const params = new URLSearchParams()
      if (membrePlanFilter) params.set("planId", membrePlanFilter)
      const url = `/api/admin/members?${params}`
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setMembres(data.members || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingMembres(false)
    }
  }, [membrePlanFilter])

  const fetchMembrePlans = useCallback(async () => {
    try {
      const res = await fetch("/api/public/plans")
      if (res.ok) {
        const data = await res.json()
        setMembrePlans(Array.isArray(data) ? data : [])
      }
    } catch (err) {
      console.error(err)
    }
  }, [])

  // Fetch Access Requests
  const fetchRequests = useCallback(async () => {
    setLoadingRequests(true)
    setErrorRequests(null)
    try {
      const res = await fetch("/api/admin/access-requests")
      if (res.ok) {
        const data = await res.json()
        setRequests(data)
      } else {
        setErrorRequests("Erreur de chargement des demandes")
      }
    } catch (err) {
      console.error(err)
      setErrorRequests("Erreur de chargement des demandes")
    } finally {
      setLoadingRequests(false)
    }
  }, [])

  // Fetch Signals
  const fetchSignals = useCallback(async () => {
    setLoadingSignals(true)
    setErrorSignals(null)
    try {
      const res = await fetch("/api/admin/signals")
      if (res.ok) {
        const data = await res.json()
        setSignals(data.signals ?? data)
      } else {
        setErrorSignals("Erreur de chargement des signaux")
      }
    } catch (err) {
      console.error(err)
      setErrorSignals("Erreur de chargement des signaux")
    } finally {
      setLoadingSignals(false)
    }
  }, [])

  // Fetch KYC
  const fetchKyc = useCallback(async () => {
    setLoadingKyc(true)
    setErrorKyc(null)
    try {
      const params = new URLSearchParams()
      if (kycStatusFilter !== "ALL") params.set("status", kycStatusFilter)
      params.set("page", String(kycPage))
      const res = await fetch(`/api/admin/kyc?${params}`)
      if (res.ok) {
        const data = await res.json()
        setKycDocs(data.docs ?? data)
        setKycTotalPages(data.pagination?.totalPages ?? 1)
      } else {
        setErrorKyc("Erreur de chargement des dossiers KYC")
      }
    } catch (err) {
      console.error(err)
      setErrorKyc("Erreur de chargement des dossiers KYC")
    } finally {
      setLoadingKyc(false)
    }
  }, [kycStatusFilter, kycPage])

  // Fetch Broker
  const fetchBroker = useCallback(async () => {
    setLoadingBroker(true)
    setErrorBroker(null)
    try {
      const params = new URLSearchParams()
      if (brokerStatusFilter !== "ALL") params.set("status", brokerStatusFilter)
      params.set("page", String(brokerPage))
      const res = await fetch(`/api/admin/broker?${params}`)
      if (res.ok) {
        const data = await res.json()
        setBrokerDocs(data.docs ?? data)
        setBrokerTotalPages(data.pagination?.totalPages ?? 1)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingBroker(false)
    }
  }, [brokerStatusFilter, brokerPage])

  // Fetch Audits
  const fetchAudits = useCallback(async () => {
    setLoadingAudits(true)
    try {
      const res = await fetch("/api/admin/audit-logs")
      if (res.ok) {
        const data = await res.json()
        setAudits(data.logs || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingAudits(false)
    }
  }, [])

  // Fetch Security Data
  const fetchSecurity = useCallback(async () => {
    setLoadingSecurity(true)
    try {
      const res = await fetch("/api/admin/security")
      if (res.ok) {
        const data = await res.json()
        setSecurityData(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingSecurity(false)
    }
  }, [])

  // Send Notification (broadcast to all users)
  const handleSendNotification = async () => {
    if (!notifTitle.trim() || !notifContent.trim()) return
    setSendingNotif(true)
    setNotifSent(false)
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: notifTitle, content: notifContent }),
      })
      if (res.ok) {
        setNotifTitle("")
        setNotifContent("")
        setNotifSent(true)
        setTimeout(() => setNotifSent(false), 3000)
        fetchNotifHistory()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSendingNotif(false)
    }
  }

  // Send test notification to self
  const handleTestNotification = async () => {
    if (!notifTitle.trim() || !notifContent.trim() || !currentSession?.user?.id) return
    setSendingTest(true)
    setNotifTested(false)
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: notifTitle, content: notifContent, userId: currentSession.user.id }),
      })
      if (res.ok) {
        setNotifTested(true)
        playNotifSound()
        setTimeout(() => setNotifTested(false), 3000)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSendingTest(false)
    }
  }

  // Fetch Notification History
  const fetchNotifHistory = useCallback(async () => {
    setLoadingNotifHistory(true)
    try {
      const res = await fetch("/api/admin/notifications")
      if (res.ok) {
        const data = await res.json()
        setNotifHistory(data.notifications || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingNotifHistory(false)
    }
  }, [])

  // Effect to load data dynamically based on active tab
  useEffect(() => {
    if (activeTab === "dashboard") fetchOperations()
    else if (activeTab === "users") fetchMembers()
    else if (activeTab === "membres") { fetchMembrePlans(); fetchMembres() }
    else if (activeTab === "requests") fetchRequests()
    else if (activeTab === "signals") fetchSignals()
    else if (activeTab === "kyc") { setKycPage(1); fetchKyc() }
    else if (activeTab === "broker") { setBrokerPage(1); fetchBroker() }
    else if (activeTab === "audit") fetchAudits()
    else if (activeTab === "security") fetchSecurity()
    else if (activeTab === "stats" && !opsData) fetchOperations()
    else if (activeTab === "notifications") fetchNotifHistory()
  }, [activeTab, fetchOperations, fetchMembers, fetchMembres, fetchMembrePlans, fetchRequests, fetchSignals, fetchKyc, fetchBroker, fetchAudits, fetchSecurity, fetchNotifHistory, kycPage, kycStatusFilter, brokerPage, brokerStatusFilter])

      async function handleDeleteSignal(id: string) {
        if (!confirm("Voulez-vous vraiment supprimer ce signal ?")) return
        await fetch(`/api/admin/signals/${id}`, {
          method: "DELETE",
        })
        setSignals((prev) => prev.filter((s) => s.id !== id))
        toast.success("Signal supprimé avec succès.")
      }

      async function handlePublishSignal(id: string) {
        if (!confirm("Publier ce signal maintenant ?")) return
        const res = await fetch(`/api/admin/signals/${id}/publish`, { method: "POST" })
        if (res.ok) {
          fetchSignals()
          toast.success("Signal publié avec succès.")
        }
      }

      async function handleDuplicateSignal(id: string) {
        if (!confirm("Dupliquer ce signal en brouillon ?")) return
        const res = await fetch(`/api/admin/signals/${id}/duplicate`, { method: "POST" })
        if (res.ok) {
          fetchSignals()
          toast.success("Signal dupliqué en brouillon.")
        }
      }

      // Context Panel Action Executions
  const handlePanelAction = async (actionType: string, extraData?: any) => {
    try {
      if (actionType === "suspend" || actionType === "reactivate") {
        const isActive = actionType === "reactivate"
        const res = await fetch("/api/admin/members", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: extraData.id, isActive }),
        })
        if (res.ok) {
          fetchMembers()
          setPanelOpen(false)
          toast.success(`Utilisateur ${isActive ? "réactivé" : "suspendu"} avec succès.`)
        }
      } else if (actionType === "kyc_approve" || actionType === "kyc_reject") {
        const status = actionType === "kyc_approve" ? "APPROVED" : "REJECTED"
        const res = await fetch(`/api/admin/kyc/${extraData.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status, notes: extraData.notes || "Approuvé/Refusé via le panneau d'opérations" }),
        })
        if (res.ok) {
          fetchKyc()
          fetchMembers()
          fetchOperations()
          setPanelOpen(false)
          toast.success("Document KYC traité.")
        }
      } else if (actionType === "broker_approve" || actionType === "broker_reject") {
        const status = actionType === "broker_approve" ? "APPROVED" : "REJECTED"
        const res = await fetch(`/api/admin/broker/${extraData.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status, notes: extraData.notes || "Traité via le panneau d'opérations" }),
        })
        if (res.ok) {
          fetchBroker()
          fetchMembers()
          fetchOperations()
          setPanelOpen(false)
          toast.success("Compte broker traité.")
        }
      } else if (actionType === "change_role") {
        // Get the role ID by name
        const rolesRes = await fetch("/api/admin/roles")
        const roles = await rolesRes.json()
        const role = roles.find((r: any) => r.name === extraData.roleName)
        if (role) {
          const updateRes = await fetch("/api/admin/members", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: extraData.id, roleId: role.id }),
          })
          if (updateRes.ok) {
            fetchMembers()
            setPanelOpen(false)
            toast.success(`Rôle changé en ${extraData.roleName} avec succès.`)
          }
        }
      } else if (actionType === "force_onboarding") {
        const res = await fetch("/api/admin/members", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: extraData.id, onboardingStatus: "ACTIVE" }),
        })
        if (res.ok) {
          fetchMembers()
          setPanelOpen(false)
          toast.success("Statut d'onboarding forcé à ACTIVE avec succès.")
        } else {
          toast.error("Erreur lors de la validation manuelle.")
        }
      } else if (actionType === "delete_user") {
        const res = await fetch(`/api/admin/members?userId=${extraData.id}`, {
          method: "DELETE",
        })
        if (res.ok) {
          fetchMembers()
          setPanelOpen(false)
          toast.success("Utilisateur supprimé avec succès.")
        } else {
          toast.error("Erreur lors de la suppression de l'utilisateur.")
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
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Action review (requests onboarding)
  async function handleReview(id: string, status: string) {
    if (!confirm(status === "APPROVED" ? "Approuver cette demande d'accès ?" : "Rejeter cette demande d'accès ?")) return
    await fetch(`/api/admin/access-requests/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, reviewerId: "admin", notes: "Review onboarding" }),
    })
    fetchRequests()
    fetchOperations()
  }

  return (
    <div className="min-h-screen text-foreground font-sans antialiased pb-20 md:pb-0">
      {/* Dynamic Module views */}
      <div className="space-y-7 animate-in fade-in-50 duration-200">
        
        {/* ============================================================== */}
        {/* OPERATIONS CENTER (DASHBOARD) */}
        {/* ============================================================== */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-5">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-foreground">Operations Center</h1>
                <p className="text-xs text-muted-foreground mt-1">
                  Surveillez l'état opérationnel et traitez les tâches prioritaires.
                </p>
              </div>
              <Badge variant="outline" className="text-[10px] text-emerald-600 bg-emerald-500/5 border-emerald-500/20 py-1 px-2.5">
                ● Live System
              </Badge>
            </div>

            {loadingOps ? (
              <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
            ) : (
              <>
                {/* SECTION PRIORITAIRE : À TRAITER MAINTENANT */}
                <Card className="border-border bg-card/50 backdrop-blur-md shadow-xs">
                  <CardContent className="p-6">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground pb-4 border-b border-border">
                      À traiter maintenant
                    </h2>
                    <div className="divide-y divide-border">
                      {/* KYC Alert */}
                      {opsData?.attention?.kycPendingCount > 0 ? (
                        <div
                          onClick={() => router.push("/admin?tab=kyc")}
                          className="flex items-center justify-between py-3.5 hover:bg-muted/40 px-2 rounded-xl transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-3">
                            <span className="size-2 rounded-full bg-rose-500 animate-pulse" />
                            <span className="font-semibold text-xs text-foreground">
                              {opsData.attention.kycPendingCount} dossiers KYC en attente de vérification
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground group-hover:text-foreground transition-colors">
                            <span>Traiter</span>
                            <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                          </div>
                        </div>
                      ) : null}

                      {/* Broker Alert */}
                      {opsData?.attention?.brokerPendingCount > 0 ? (
                        <div
                          onClick={() => router.push("/admin?tab=broker")}
                          className="flex items-center justify-between py-3.5 hover:bg-muted/40 px-2 rounded-xl transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-3">
                            <span className="size-2 rounded-full bg-amber-500" />
                            <span className="font-semibold text-xs text-foreground">
                              {opsData.attention.brokerPendingCount} vérifications Broker à valider
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground group-hover:text-foreground transition-colors">
                            <span>Traiter</span>
                            <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                          </div>
                        </div>
                      ) : null}

                      {/* Access Requests Alert */}
                      {opsData?.attention?.requestsPendingCount > 0 ? (
                        <div
                          onClick={() => router.push("/admin?tab=requests")}
                          className="flex items-center justify-between py-3.5 hover:bg-muted/40 px-2 rounded-xl transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-3">
                            <span className="size-2 rounded-full bg-blue-500" />
                            <span className="font-semibold text-xs text-foreground">
                              {opsData.attention.requestsPendingCount} demandes d'accès à examiner
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground group-hover:text-foreground transition-colors">
                            <span>Examiner</span>
                            <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                          </div>
                        </div>
                      ) : null}

                      {/* Scheduled Signal Alert */}
                      {opsData?.attention?.nextScheduledSignal ? (
                        <div
                          onClick={() => router.push("/admin?tab=signals")}
                          className="flex items-center justify-between py-3.5 hover:bg-muted/40 px-2 rounded-xl transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-3">
                            <span className="size-2 rounded-full bg-emerald-500" />
                            <span className="font-semibold text-xs text-foreground">
                              1 signal programmé pour publication le {new Date(opsData.attention.nextScheduledSignal.scheduledAt).toLocaleString("fr-FR")}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground group-hover:text-foreground transition-colors">
                            <span>Voir</span>
                            <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                          </div>
                        </div>
                      ) : null}

                      {/* All Clear state */}
                      {opsData?.attention?.kycPendingCount === 0 &&
                        opsData?.attention?.brokerPendingCount === 0 &&
                        opsData?.attention?.requestsPendingCount === 0 && (
                          <div className="py-6 text-center text-xs text-muted-foreground select-none">
                            🟢 Aucune intervention urgente requise. Système nominal.
                          </div>
                        )}
                    </div>
                  </CardContent>
                </Card>

                {/* KPIS CARDS ROW */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="border-border bg-card/30">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Membres Actifs</p>
                        <p className="text-xl font-bold text-foreground">{opsData.stats.totalMembers}</p>
                      </div>
                      <Users className="size-5 text-muted-foreground/60" />
                    </CardContent>
                  </Card>

                  <Card className="border-border bg-card/30">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Demandes en attente</p>
                        <p className="text-xl font-bold text-foreground">{opsData.attention.requestsPendingCount}</p>
                      </div>
                      <ListTodo className="size-5 text-muted-foreground/60" />
                    </CardContent>
                  </Card>

                  <Card className="border-border bg-card/30">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">KYC à traiter</p>
                        <p className="text-xl font-bold text-foreground">{opsData.attention.kycPendingCount}</p>
                      </div>
                      <FileCheck className="size-5 text-muted-foreground/60" />
                    </CardContent>
                  </Card>

                  <Card className="border-border bg-card/30">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Signaux publiés</p>
                        <p className="text-xl font-bold text-foreground">{opsData.stats.publishedSignalsCount}</p>
                      </div>
                      <Radio className="size-5 text-muted-foreground/60" />
                    </CardContent>
                  </Card>
                </div>

                {/* GRAPH & TIMELINE ROW */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Graph (7 days activity) */}
                  <Card className="border-border bg-card/20 lg:col-span-2">
                    <CardContent className="p-6">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground pb-4 border-b border-border">
                        Inscriptions (7 derniers jours)
                      </h3>
                      {/* Simple SVG Chart */}
                      <div className="h-48 w-full flex items-end justify-between pt-6 px-4">
                        {opsData.activityGraph.map((dayData: any, idx: number) => {
                          const maxCount = Math.max(...opsData.activityGraph.map((d: any) => d.count), 5)
                          const pct = (dayData.count / maxCount) * 100
                          return (
                            <div key={idx} className="flex flex-col items-center gap-2 flex-1">
                              <span className="text-[10px] font-bold text-foreground">{dayData.count}</span>
                              <div
                                style={{ height: `${Math.max(5, pct * 0.8)}%` }}
                                className="w-6 rounded-t-xs bg-primary/20 dark:bg-primary/45 border-t border-primary/50"
                              />
                              <span className="text-[9px] text-muted-foreground font-semibold">{dayData.day}</span>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recent Activity Timeline */}
                  <Card className="border-border bg-card/20">
                    <CardContent className="p-6">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground pb-4 border-b border-border">
                        Activités récentes
                      </h3>
                      <div className="pt-4 space-y-4 max-h-48 overflow-y-auto">
                        {opsData.recentActivities.length > 0 ? (
                          opsData.recentActivities.map((act: any, idx: number) => (
                            <div key={idx} className="flex items-start gap-2.5 text-[10px]">
                              <span className="size-1.5 rounded-full bg-neutral-400 mt-1 shrink-0" />
                              <div>
                                <p className="font-semibold text-foreground">
                                  {act.action}
                                </p>
                                <p className="text-[9px] text-muted-foreground">
                                  {act.user?.name || "System"} • {new Date(act.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="py-6 text-center text-xs text-muted-foreground select-none">
                            Aucune activité récente.
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* ALERTES SANTE INFRASTRUCTURE */}
                <Card className="border-border bg-card/20">
                  <CardContent className="p-6">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground pb-4 border-b border-border">
                      Santé du Système
                    </h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-4 text-xs">
                      <div className="flex items-center gap-3">
                        <Server className="size-4 text-muted-foreground" />
                        <div>
                          <p className="font-bold text-foreground">Redis Server</p>
                          <Badge variant="outline" className={cn("text-[9px] py-0 px-1.5 mt-0.5", opsData.systemStatus.redis === "healthy" ? "text-emerald-600 bg-emerald-500/5 border-emerald-500/20" : "text-rose-600 bg-rose-500/5 border-rose-500/20")}>
                            {opsData.systemStatus.redis === "healthy" ? "En ligne" : "Échec"}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Activity className="size-4 text-muted-foreground" />
                        <div>
                          <p className="font-bold text-foreground">BullMQ Workers</p>
                          <Badge variant="outline" className={cn("text-[9px] py-0 px-1.5 mt-0.5", opsData.systemStatus.bullmq === "healthy" ? "text-emerald-600 bg-emerald-500/5 border-emerald-500/20" : "text-amber-600 bg-amber-500/5 border-amber-500/20")}>
                            {opsData.systemStatus.bullmq === "healthy" ? "Actifs (Concurrence 10)" : "Ralentis"}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Laptop className="size-4 text-muted-foreground" />
                        <div>
                          <p className="font-bold text-foreground">Stockage Disque</p>
                          <Badge variant="outline" className={cn("text-[9px] py-0 px-1.5 mt-0.5", opsData.systemStatus.storage === "healthy" ? "text-emerald-600 bg-emerald-500/5 border-emerald-500/20" : "text-amber-600 bg-amber-500/5 border-amber-500/20")}>
                            {opsData.systemStatus.storage === "healthy" ? "Normal (15% RAM)" : "Presque plein"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* UTILISATEURS (MEMBRES) */}
        {/* ============================================================== */}
        {activeTab === "users" && (
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
                                {member.name.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold text-foreground">{member.name}</p>
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
                                setPanelTitle("Détails Utilisateur")
                                setPanelType("user")
                                setPanelData(member)
                                setPanelOpen(true)
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
        )}

        {/* ============================================================== */}
        {/* MEMBRES PAR ABONNEMENT */}
        {/* ============================================================== */}
        {activeTab === "membres" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-5">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-foreground">Membres</h1>
                <p className="text-xs text-muted-foreground mt-1">
                  Membres validés, filtrés par abonnement
                </p>
              </div>
            </div>

            {/* Filtre par abonnement */}
            <div className="flex items-center gap-2">
              <select
                value={membrePlanFilter}
                onChange={(e) => setMembrePlanFilter(e.target.value)}
                className="h-9 rounded-lg border border-border bg-background px-3 text-xs text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
              >
                <option value="">Tous les abonnements</option>
                {membrePlans.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <span className="text-xs text-muted-foreground">
                {loadingMembres ? "..." : `${membres.length} membre${membres.length > 1 ? "s" : ""}`}
              </span>
            </div>

            {/* Liste */}
            <Card className="border-border bg-card/30">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-card/30 text-muted-foreground font-bold uppercase tracking-wider text-[10px]">
                      <th className="px-4 py-3">Membre</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Abonnement(s)</th>
                      <th className="px-4 py-3">Statut</th>
                      <th className="px-4 py-3">Inscrit le</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {loadingMembres ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center"><Loader2 className="animate-spin text-primary inline" /></td>
                      </tr>
                    ) : membres.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-muted-foreground">Aucun membre trouvé</td>
                      </tr>
                    ) : (
                      membres.map((m: any) => (
                        <tr key={m.id} className="hover:bg-card/30 transition-colors">
                          <td className="px-4 py-3 font-medium text-foreground">{m.name}</td>
                          <td className="px-4 py-3 text-muted-foreground">{m.email}</td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {m.accessRequests?.map((ar: any) => (
                                <Badge key={ar.plan.id} variant="secondary" className="text-[10px] px-1.5 py-0">
                                  {ar.plan.name}
                                </Badge>
                              ))}
                              {(!m.accessRequests || m.accessRequests.length === 0) && (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className={cn(
                              "text-[10px] px-1.5 py-0",
                              m.isActive ? "text-emerald-600 border-emerald-500/20 bg-emerald-500/10" : "text-muted-foreground"
                            )}>
                              {m.isActive ? "Actif" : "Inactif"}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {new Date(m.createdAt).toLocaleDateString("fr-FR")}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* ============================================================== */}
        {/* DEMANDES D'ACCÈS */}
        {/* ============================================================== */}
        {activeTab === "requests" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-5">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-foreground">Demandes d'accès</h1>
                <p className="text-xs text-muted-foreground mt-1">
                  Validez les dossiers d'inscription des membres pour activer leurs comptes.
                </p>
              </div>
            </div>

            {loadingRequests ? (
              <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
            ) : requests.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {requests.map((req) => (
                  <Card key={req.id} className="border-border bg-card/30">
                    <CardContent className="p-5 space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-foreground text-sm">{req.user.name}</h3>
                          <p className="text-[10px] text-muted-foreground">{req.user.email}</p>
                        </div>
                        <Badge variant="outline" className="text-[9px] border-border">
                          {req.plan.name}
                        </Badge>
                      </div>

                      <div className="space-y-1.5 text-[11px] text-muted-foreground">
                        <div className="flex justify-between">
                          <span>Progression Onboarding</span>
                          <span className="font-semibold text-foreground">{req.onboarding.progress}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${req.onboarding.progress}%` }}
                            className="h-full bg-primary transition-all duration-300"
                          />
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-border/60">
                        <span className="text-[10px] text-muted-foreground">
                          Soumis le {new Date(req.createdAt).toLocaleDateString()}
                        </span>
                        <div className="flex gap-2">
                          <Button
                            variant="destructive"
                            size="sm"
                            className="text-[10px] h-7 px-3.5 cursor-pointer"
                            onClick={() => handleReview(req.id, "REJECTED")}
                          >
                            Refuser
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            className="text-[10px] h-7 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white border-0 cursor-pointer"
                            onClick={() => handleReview(req.id, "APPROVED")}
                          >
                            Approuver
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center border border-dashed border-border rounded-2xl text-muted-foreground select-none">
                Aucune demande d'accès en attente d'approbation.
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* SIGNALS */}
        {/* ============================================================== */}
        {activeTab === "signals" && (
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
            <div className="xl:col-span-3 space-y-6">
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Publier un signal</h2>
              <SignalEditor onSignalCreated={fetchSignals} />
            </div>

            <div className="xl:col-span-2 space-y-6">
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Historique des publications</h2>
              {loadingSignals ? (
                <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
              ) : signals.length > 0 ? (
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                  {signals.map((sig) => (
                    <Card key={sig.id} className="border-border bg-card/20">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[9px] uppercase",
                              sig.status === "PUBLISHED" && "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
                              sig.status === "DRAFT" && "bg-neutral-500/10 text-neutral-400 border-neutral-500/20",
                              sig.status === "ARCHIVED" && "bg-rose-500/10 text-rose-600 border-rose-500/20"
                            )}
                          >
                            {sig.status}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {sig.publishedAt ? new Date(sig.publishedAt).toLocaleDateString() : new Date(sig.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <p className="text-xs text-foreground line-clamp-3 leading-relaxed whitespace-pre-wrap">
                          {sig.content}
                        </p>

                        <div className="flex justify-between items-center pt-2 border-t border-border/60">
                          <span className="text-[9px] text-muted-foreground">Créé par : {sig.creator?.name || "Admin"}</span>
                          <div className="flex gap-1.5">
                            {sig.status === "DRAFT" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-9 text-emerald-500 hover:text-emerald-600 cursor-pointer"
                                onClick={() => handlePublishSignal(sig.id)}
                                title="Publier"
                              >
                                <Play className="size-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-9 text-muted-foreground hover:text-foreground cursor-pointer"
                              onClick={() => handleDuplicateSignal(sig.id)}
                              title="Dupliquer"
                            >
                              <Copy className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-9 text-muted-foreground hover:text-foreground cursor-pointer"
                              onClick={() => {
                                setPanelTitle("Détails du Signal")
                                setPanelType("signal")
                                setPanelData(sig)
                                setPanelOpen(true)
                              }}
                            >
                              <Eye className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-9 text-muted-foreground hover:text-destructive cursor-pointer"
                              onClick={() => handleDeleteSignal(sig.id)}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center border border-dashed border-border rounded-xl text-muted-foreground">
                  Aucun signal créé.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* DOSSIERS KYC */}
        {/* ============================================================== */}
        {activeTab === "kyc" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-5">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-foreground">Dossiers KYC</h1>
                <p className="text-xs text-muted-foreground mt-1">
                  Examinez et validez les pièces d'identité des abonnés.
                </p>
              </div>
              <div className="flex gap-2">
                {["ALL", "PENDING", "APPROVED", "REJECTED"].map((s) => (
                  <button
                    key={s}
                    onClick={() => { setKycStatusFilter(s); setKycPage(1) }}
                    className={cn(
                      "text-[10px] px-3 py-1 rounded-full border transition-colors cursor-pointer",
                      kycStatusFilter === s
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    )}
                  >
                    {s === "ALL" ? "Tous" : s}
                  </button>
                ))}
              </div>
            </div>

            {loadingKyc ? (
              <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
            ) : kycDocs.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {kycDocs.map((doc) => (
                    <Card key={doc.id} className="border-border bg-card/30 overflow-hidden">
                      <div className="h-40 bg-card border-b border-border flex items-center justify-center text-muted-foreground relative">
                        <ImageIcon className="size-8 text-muted-foreground/30" />
                        <Badge
                          variant="outline"
                          className={cn(
                            "absolute top-3 right-3 text-[9px] uppercase",
                            doc.status === "APPROVED" && "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
                            doc.status === "REJECTED" && "bg-rose-500/10 text-rose-600 border-rose-500/20",
                            doc.status === "PENDING" && "bg-amber-500/10 text-amber-600 border-amber-500/20"
                          )}
                        >
                          {doc.status}
                        </Badge>
                      </div>
                      <CardContent className="p-4 space-y-4">
                        <div>
                          <h4 className="font-bold text-foreground text-xs">{doc.user?.name}</h4>
                          <p className="text-[10px] text-muted-foreground">{doc.user?.email}</p>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-muted-foreground border-t border-border/60 pt-3">
                          <span>Reçu le : {new Date(doc.submittedAt || doc.createdAt).toLocaleDateString()}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-[10px] border-border h-7 cursor-pointer"
                            onClick={() => {
                              setPanelTitle("Dossier KYC")
                              setPanelType("kyc")
                              setPanelData(doc)
                              setPanelOpen(true)
                            }}
                          >
                            Examiner
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {kycTotalPages > 1 && (
                  <div className="flex items-center justify-center gap-4 pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={kycPage <= 1}
                      onClick={() => setKycPage((p) => Math.max(1, p - 1))}
                      className="text-xs cursor-pointer"
                    >
                      ← Précédent
                    </Button>
                    <span className="text-[10px] text-muted-foreground">
                      Page {kycPage} / {kycTotalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={kycPage >= kycTotalPages}
                      onClick={() => setKycPage((p) => p + 1)}
                      className="text-xs cursor-pointer"
                    >
                      Suivant →
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="py-16 text-center border border-dashed border-border rounded-2xl text-muted-foreground">
                Aucun document KYC reçu.
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* BROKER VERIFICATION */}
        {/* ============================================================== */}
        {activeTab === "broker" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-5">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-foreground">Vérifications Broker</h1>
                <p className="text-xs text-muted-foreground mt-1">
                  Vérifiez la liaison de compte broker des utilisateurs avec les vidéos fournies.
                </p>
              </div>
              <div className="flex gap-2">
                {["ALL", "PENDING", "APPROVED", "REJECTED"].map((s) => (
                  <button
                    key={s}
                    onClick={() => { setBrokerStatusFilter(s); setBrokerPage(1) }}
                    className={cn(
                      "text-[10px] px-3 py-1 rounded-full border transition-colors cursor-pointer",
                      brokerStatusFilter === s
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    )}
                  >
                    {s === "ALL" ? "Tous" : s}
                  </button>
                ))}
              </div>
            </div>

            {loadingBroker ? (
              <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
            ) : brokerDocs.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {brokerDocs.map((doc) => (
                    <Card key={doc.id} className="border-border bg-card/30">
                      <CardContent className="p-5 space-y-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-bold text-foreground text-xs">{doc.user?.name}</h4>
                            <p className="text-[10px] text-muted-foreground">{doc.user?.email}</p>
                          </div>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[9px] uppercase",
                              doc.status === "APPROVED" && "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
                              doc.status === "REJECTED" && "bg-rose-500/10 text-rose-600 border-rose-500/20",
                              doc.status === "PENDING" && "bg-amber-500/10 text-amber-600 border-amber-500/20"
                            )}
                          >
                            {doc.status}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-muted/40 border border-border/60 text-[10px]">
                          <div>
                            <span className="text-[9px] text-muted-foreground block uppercase">Broker</span>
                            <span className="font-semibold text-foreground">{doc.brokerName}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-muted-foreground block uppercase">Numéro Compte</span>
                            <span className="font-semibold text-foreground">{doc.accountId}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-border/60 text-[10px] text-muted-foreground">
                          <span>Soumis le : {new Date(doc.submittedAt || doc.createdAt).toLocaleDateString()}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-[10px] border-border h-7 cursor-pointer"
                            onClick={() => {
                              setPanelTitle("Vérification Broker")
                              setPanelType("broker")
                              setPanelData(doc)
                              setPanelOpen(true)
                            }}
                          >
                            Visionner Preuve
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {brokerTotalPages > 1 && (
                  <div className="flex items-center justify-center gap-4 pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={brokerPage <= 1}
                      onClick={() => setBrokerPage((p) => Math.max(1, p - 1))}
                      className="text-xs cursor-pointer"
                    >
                      ← Précédent
                    </Button>
                    <span className="text-[10px] text-muted-foreground">
                      Page {brokerPage} / {brokerTotalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={brokerPage >= brokerTotalPages}
                      onClick={() => setBrokerPage((p) => p + 1)}
                      className="text-xs cursor-pointer"
                    >
                      Suivant →
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="py-16 text-center border border-dashed border-border rounded-2xl text-muted-foreground">
                Aucune demande de vérification broker en attente.
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* NOTIFICATIONS */}
        {/* ============================================================== */}
        {activeTab === "notifications" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-5">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-foreground">Notifications</h1>
                <p className="text-xs text-muted-foreground mt-1">
                  Gérez l'envoi de messages d'information internes.
                </p>
              </div>
            </div>

            <Card className="border-border bg-card/30 max-w-lg">
              <CardContent className="p-6 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Rédiger une notification système</h3>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground uppercase font-bold">Titre</label>
                    <Input
                      placeholder="Alerte système..."
                      className="bg-background border-border text-xs text-foreground"
                      value={notifTitle}
                      onChange={(e) => setNotifTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground uppercase font-bold">Contenu</label>
                    <textarea
                      placeholder="Votre message..."
                      className="w-full p-3 rounded-lg border bg-background border-border text-xs text-foreground focus:outline-none focus:border-primary/50 min-h-24"
                      value={notifContent}
                      onChange={(e) => setNotifContent(e.target.value)}
                    />
                  </div>
                  {notifTested && (
                    <p className="text-xs text-success font-medium">Test reçu ! Vérifiez vos notifications.</p>
                  )}
                  {notifSent && (
                    <p className="text-xs text-success font-medium">Notification diffusée à tous les utilisateurs.</p>
                  )}
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 cursor-pointer"
                      onClick={handleTestNotification}
                      disabled={sendingTest || !notifTitle.trim() || !notifContent.trim() || !currentSession?.user?.id}
                    >
                      {sendingTest ? (
                        <>
                          <Loader2 className="size-4 mr-2 animate-spin" />
                          Test...
                        </>
                      ) : (
                        "Tester"
                      )}
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1 cursor-pointer"
                      onClick={handleSendNotification}
                      disabled={sendingNotif || !notifTitle.trim() || !notifContent.trim()}
                    >
                      {sendingNotif ? (
                        <>
                          <Loader2 className="size-4 mr-2 animate-spin" />
                          Envoi...
                        </>
                      ) : (
                        "Diffuser"
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Historique des notifications */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Historique des notifications</h3>
              {loadingNotifHistory ? (
                <div className="py-8 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
              ) : notifHistory.length > 0 ? (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {notifHistory.map((notif) => (
                    <Card key={notif.id} className="border-border bg-card/20">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-foreground">{notif.title}</span>
                          <span className="text-[9px] text-muted-foreground">
                            {new Date(notif.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground line-clamp-2">{notif.body}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground py-4 text-center">Aucune notification envoyée.</p>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* AUDIT LOGS */}
        {/* ============================================================== */}
        {activeTab === "audit" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-5">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-foreground">Journal d'audit</h1>
                <p className="text-xs text-muted-foreground mt-1">
                  Timeline de type GitHub enregistrant toutes les modifications critiques de la plateforme.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={async () => {
                  if (!confirm("Supprimer les logs d'audit de plus de 90 jours ?")) return
                  const res = await fetch("/api/admin/audit-logs", { method: "DELETE" })
                  if (res.ok) {
                    const data = await res.json()
                    alert(`${data.deleted} logs supprimés (plus de ${data.olderThanDays} jours)`)
                    fetchAudits()
                  }
                }}
              >
                <Trash2 className="size-3 mr-1" />
                Purger les vieux logs
              </Button>
            </div>

            <Card className="border-border bg-card/10">
              <div className="p-6">
                <div className="space-y-6">
                  {loadingAudits ? (
                    <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
                  ) : audits.length > 0 ? (
                    audits.map((log) => (
                      <div key={log.id} className="relative pl-6 border-l border-border pb-6 last:pb-0">
                        <span className="absolute -left-1.5 top-1.5 size-3 rounded-full border border-border bg-card flex items-center justify-center">
                          <span className="size-1 rounded-full bg-primary" />
                        </span>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-4">
                            <span className="font-semibold text-xs text-foreground">
                              {log.action}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(log.createdAt).toLocaleString("fr-FR")}
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            Réalisé par : {log.user?.name || "System"} • Appareil : {log.ipAddress || "Interne"}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-10 text-center text-muted-foreground">Aucun log enregistré.</div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* ============================================================== */}
        {/* SECURITY CENTER */}
        {/* ============================================================== */}
        {activeTab === "security" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-5">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-foreground">Centre de sécurité</h1>
                <p className="text-xs text-muted-foreground mt-1">
                  Surveillez les connexions récentes et détectez d'éventuelles tentatives d'intrusion.
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
                        <p className="text-xs text-muted-foreground py-4 text-center">
                          Aucune session active.
                        </p>
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
                            <span className="text-muted-foreground">Échecs aujourd'hui</span>
                            <span className="font-bold text-destructive">{securityData.failedLogins}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Dernière tentative</span>
                            <span className="text-muted-foreground">{securityData.lastFailedAttempt || "—"}</span>
                          </div>
                        </>
                      ) : (
                        <p className="text-xs text-muted-foreground py-4 text-center">
                          Aucune tentative suspecte détectée.
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* STATISTIQUES CONSOLIDEES */}
        {/* ============================================================== */}
        {activeTab === "stats" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-5">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-foreground">Statistiques globales</h1>
                <p className="text-xs text-muted-foreground mt-1">
                  Compteurs clés consolidés d'activité de la plateforme NBA.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <Card className="border-border bg-card/30 p-6 space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">Membres</span>
                <p className="text-2xl font-bold text-foreground">
                  {opsData?.stats?.totalMembers || 0}
                </p>
              </Card>
              <Card className="border-border bg-card/30 p-6 space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">Signaux émis</span>
                <p className="text-2xl font-bold text-foreground">
                  {opsData?.stats?.publishedSignalsCount || 0}
                </p>
              </Card>
              <Card className="border-border bg-card/30 p-6 space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">Dossiers KYC Validés</span>
                <p className="text-2xl font-bold text-foreground">
                  {opsData?.stats?.approvedKycCount || 0}
                </p>
              </Card>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* PARAMÈTRES SYSTEME */}
        {/* ============================================================== */}
        {activeTab === "settings" && (
          <div className="space-y-6 max-w-xl">
            <div className="flex items-center justify-between border-b border-border pb-5">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-foreground">Paramètres système</h1>
                <p className="text-xs text-muted-foreground mt-1">
                  Configuration du système (emails gérés via Resend).
                </p>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Admin sliding contextual detail panel */}
      <AdminContextPanel
        isOpen={panelOpen}
        onClose={() => setPanelOpen(false)}
        title={panelTitle}
        type={panelType}
        data={panelData}
        onAction={handlePanelAction}
      />
    </div>
  )
}
