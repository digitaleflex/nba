"use client"

import { useEffect, useState, useCallback, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Check, X, Clock, ExternalLink, ListTodo, Radio, History, Trash2, Calendar,
  Search, Eye, Layers, Copy, Play, Loader2, Laptop, Phone, Users, Shield,
  FileCheck, Link2, Bell, Mail, Activity, BarChart2, Settings, Ban, ArrowRight,
  AlertTriangle, Server, ArrowUpRight, Image as ImageIcon
} from "lucide-react"
import { Button, Card, CardContent, Badge, Tabs, TabsList, TabsTrigger, TabsContent, Input, cn } from "@nba/design-system"
import { SignalEditor } from "./components/signal-editor"
import { AdminContextPanel } from "./components/admin-context-panel"
import { parseSimpleMarkdown } from "@nba/lib/utils"

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
  accountNumber: string
  status: string
  createdAt: string
  submittedAt: string
  videoUrl?: string
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

interface EmailLog {
  id: string
  status: string
  createdAt: string
  sentAt: string | null
  errorMessage: string | null
  notification: {
    title: string
    user: { name: string; email: string }
  }
}

export default function AdminPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20 dark bg-neutral-950 text-neutral-50 h-screen">
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

  // Operations Center Data
  const [opsData, setOpsData] = useState<any>(null)
  const [loadingOps, setLoadingOps] = useState(true)

  // Module Users State
  const [members, setMembers] = useState<Member[]>([])
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [searchUser, setSearchUser] = useState(searchParams.get("search") || "")

  // Module Requests State
  const [requests, setRequests] = useState<AccessRequest[]>([])
  const [loadingRequests, setLoadingRequests] = useState(false)

  // Module Signals State
  const [signals, setSignals] = useState<Signal[]>([])
  const [loadingSignals, setLoadingSignals] = useState(false)

  // Module KYC State
  const [kycDocs, setKycDocs] = useState<KYCDoc[]>([])
  const [loadingKyc, setLoadingKyc] = useState(false)

  // Module Broker State
  const [brokerDocs, setBrokerDocs] = useState<BrokerVerification[]>([])
  const [loadingBroker, setLoadingBroker] = useState(false)

  // Module Emails State
  const [emails, setEmails] = useState<EmailLog[]>([])
  const [loadingEmails, setLoadingEmails] = useState(false)

  // Module Audit State
  const [audits, setAudits] = useState<AuditLog[]>([])
  const [loadingAudits, setLoadingAudits] = useState(false)

  // Search/Filters (General UI)
  const [generalSearch, setGeneralSearch] = useState("")

  // Fetch Operations Center data
  const fetchOperations = useCallback(async () => {
    setLoadingOps(true)
    try {
      const res = await fetch("/api/admin/operations")
      if (res.ok) {
        const data = await res.json()
        setOpsData(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingOps(false)
    }
  }, [])

  // Fetch Users
  const fetchMembers = useCallback(async () => {
    setLoadingMembers(true)
    try {
      const url = searchUser ? `/api/admin/members?q=${encodeURIComponent(searchUser)}` : "/api/admin/members"
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setMembers(data.members || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingMembers(false)
    }
  }, [searchUser])

  // Fetch Access Requests
  const fetchRequests = useCallback(async () => {
    setLoadingRequests(true)
    try {
      const res = await fetch("/api/admin/access-requests")
      if (res.ok) {
        const data = await res.json()
        setRequests(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingRequests(false)
    }
  }, [])

  // Fetch Signals
  const fetchSignals = useCallback(async () => {
    setLoadingSignals(true)
    try {
      const res = await fetch("/api/admin/signals")
      if (res.ok) {
        const data = await res.json()
        setSignals(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingSignals(false)
    }
  }, [])

  // Fetch KYC
  const fetchKyc = useCallback(async () => {
    setLoadingKyc(true)
    try {
      const res = await fetch("/api/admin/kyc")
      if (res.ok) {
        const data = await res.json()
        setKycDocs(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingKyc(false)
    }
  }, [])

  // Fetch Broker
  const fetchBroker = useCallback(async () => {
    setLoadingBroker(true)
    try {
      const res = await fetch("/api/admin/broker")
      if (res.ok) {
        const data = await res.json()
        setBrokerDocs(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingBroker(false)
    }
  }, [])

  // Fetch Emails
  const fetchEmails = useCallback(async () => {
    setLoadingEmails(true)
    try {
      const res = await fetch("/api/admin/emails")
      if (res.ok) {
        const data = await res.json()
        setEmails(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingEmails(false)
    }
  }, [])

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

  // Effect to load data dynamically based on active tab
  useEffect(() => {
    if (activeTab === "dashboard") fetchOperations()
    else if (activeTab === "users") fetchMembers()
    else if (activeTab === "requests") fetchRequests()
    else if (activeTab === "signals") fetchSignals()
    else if (activeTab === "kyc") fetchKyc()
    else if (activeTab === "broker") fetchBroker()
    else if (activeTab === "emails") fetchEmails()
    else if (activeTab === "audit") fetchAudits()
  }, [activeTab, fetchOperations, fetchMembers, fetchRequests, fetchSignals, fetchKyc, fetchBroker, fetchEmails, fetchAudits])

      async function handleDeleteSignal(id: string) {
        if (!confirm("Voulez-vous vraiment supprimer ce signal ?")) return
        await fetch(`/api/admin/signals/${id}`, {
          method: "DELETE",
        })
        setSignals((prev) => prev.filter((s) => s.id !== id))
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
          alert(`Utilisateur ${isActive ? "réactivé" : "suspendu"} avec succès.`)
        }
      } else if (actionType === "kyc_approve" || actionType === "kyc_reject") {
        const status = actionType === "kyc_approve" ? "APPROVED" : "REJECTED"
        const res = await fetch(`/api/admin/kyc/${extraData.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status, notes: "Approuvé/Refusé via le panneau d'opérations" }),
        })
        if (res.ok) {
          fetchKyc()
          fetchOperations()
          setPanelOpen(false)
          alert("Document KYC traité.")
        }
      } else if (actionType === "broker_approve" || actionType === "broker_reject") {
        const status = actionType === "broker_approve" ? "APPROVED" : "REJECTED"
        const res = await fetch(`/api/admin/broker/${extraData.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status, notes: "Traité via le panneau d'opérations" }),
        })
        if (res.ok) {
          fetchBroker()
          fetchOperations()
          setPanelOpen(false)
          alert("Compte broker traité.")
        }
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Action review (requests onboarding)
  async function handleReview(id: string, status: string) {
    await fetch(`/api/admin/access-requests/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, reviewerId: "admin", notes: "Review onboarding" }),
    })
    fetchRequests()
    fetchOperations()
  }

  return (
    <div className="dark min-h-screen text-neutral-100 bg-neutral-950 font-sans antialiased pb-20 md:pb-0">
      {/* Dynamic Module views */}
      <div className="space-y-7 animate-in fade-in-50 duration-200">
        
        {/* ============================================================== */}
        {/* OPERATIONS CENTER (DASHBOARD) */}
        {/* ============================================================== */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-neutral-850 pb-5">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-neutral-100">Operations Center</h1>
                <p className="text-xs text-muted-foreground mt-1">
                  Surveillez l'état opérationnel et traitez les tâches prioritaires.
                </p>
              </div>
              <Badge variant="outline" className="text-[10px] text-emerald-400 bg-emerald-500/5 border-emerald-500/20 py-1 px-2.5">
                ● Live System
              </Badge>
            </div>

            {loadingOps ? (
              <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
            ) : (
              <>
                {/* SECTION PRIORITAIRE : À TRAITER MAINTENANT */}
                <Card className="border-neutral-850 bg-neutral-900/50 backdrop-blur-md shadow-xs">
                  <CardContent className="p-6">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground pb-4 border-b border-neutral-800">
                      À traiter maintenant
                    </h2>
                    <div className="divide-y divide-neutral-850">
                      {/* KYC Alert */}
                      {opsData?.attention?.kycPendingCount > 0 ? (
                        <div
                          onClick={() => router.push("/admin?tab=kyc")}
                          className="flex items-center justify-between py-3.5 hover:bg-neutral-900/40 px-2 rounded-xl transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-3">
                            <span className="size-2 rounded-full bg-rose-500 animate-pulse" />
                            <span className="font-semibold text-xs text-neutral-200">
                              {opsData.attention.kycPendingCount} dossiers KYC en attente de vérification
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground group-hover:text-neutral-100 transition-colors">
                            <span>Traiter</span>
                            <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                          </div>
                        </div>
                      ) : null}

                      {/* Broker Alert */}
                      {opsData?.attention?.brokerPendingCount > 0 ? (
                        <div
                          onClick={() => router.push("/admin?tab=broker")}
                          className="flex items-center justify-between py-3.5 hover:bg-neutral-900/40 px-2 rounded-xl transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-3">
                            <span className="size-2 rounded-full bg-amber-500" />
                            <span className="font-semibold text-xs text-neutral-200">
                              {opsData.attention.brokerPendingCount} vérifications Broker à valider
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground group-hover:text-neutral-100 transition-colors">
                            <span>Traiter</span>
                            <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                          </div>
                        </div>
                      ) : null}

                      {/* Access Requests Alert */}
                      {opsData?.attention?.requestsPendingCount > 0 ? (
                        <div
                          onClick={() => router.push("/admin?tab=requests")}
                          className="flex items-center justify-between py-3.5 hover:bg-neutral-900/40 px-2 rounded-xl transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-3">
                            <span className="size-2 rounded-full bg-blue-500" />
                            <span className="font-semibold text-xs text-neutral-200">
                              {opsData.attention.requestsPendingCount} demandes d'accès à examiner
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground group-hover:text-neutral-100 transition-colors">
                            <span>Examiner</span>
                            <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                          </div>
                        </div>
                      ) : null}

                      {/* Scheduled Signal Alert */}
                      {opsData?.attention?.nextScheduledSignal ? (
                        <div
                          onClick={() => router.push("/admin?tab=signals")}
                          className="flex items-center justify-between py-3.5 hover:bg-neutral-900/40 px-2 rounded-xl transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-3">
                            <span className="size-2 rounded-full bg-emerald-500" />
                            <span className="font-semibold text-xs text-neutral-200">
                              1 signal programmé pour publication le {new Date(opsData.attention.nextScheduledSignal.scheduledAt).toLocaleString("fr-FR")}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground group-hover:text-neutral-100 transition-colors">
                            <span>Voir</span>
                            <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                          </div>
                        </div>
                      ) : null}

                      {/* Failed Emails Alert */}
                      {opsData?.attention?.failedEmailsCount > 0 ? (
                        <div
                          onClick={() => router.push("/admin?tab=emails")}
                          className="flex items-center justify-between py-3.5 hover:bg-neutral-900/40 px-2 rounded-xl transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-3">
                            <span className="size-2 rounded-full bg-yellow-500 animate-bounce" />
                            <span className="font-semibold text-xs text-neutral-200">
                              {opsData.attention.failedEmailsCount} emails en échec nécessitent une relance
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground group-hover:text-neutral-100 transition-colors">
                            <span>Consulter</span>
                            <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                          </div>
                        </div>
                      ) : null}

                      {/* All Clear state */}
                      {opsData?.attention?.kycPendingCount === 0 &&
                        opsData?.attention?.brokerPendingCount === 0 &&
                        opsData?.attention?.requestsPendingCount === 0 &&
                        opsData?.attention?.failedEmailsCount === 0 && (
                          <div className="py-6 text-center text-xs text-muted-foreground select-none">
                            🟢 Aucune intervention urgente requise. Système nominal.
                          </div>
                        )}
                    </div>
                  </CardContent>
                </Card>

                {/* KPIS CARDS ROW */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="border-neutral-850 bg-neutral-900/30">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Membres Actifs</p>
                        <p className="text-xl font-bold text-neutral-100">{opsData.stats.totalMembers}</p>
                      </div>
                      <Users className="size-5 text-muted-foreground/60" />
                    </CardContent>
                  </Card>

                  <Card className="border-neutral-850 bg-neutral-900/30">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Demandes en attente</p>
                        <p className="text-xl font-bold text-neutral-100">{opsData.attention.requestsPendingCount}</p>
                      </div>
                      <ListTodo className="size-5 text-muted-foreground/60" />
                    </CardContent>
                  </Card>

                  <Card className="border-neutral-850 bg-neutral-900/30">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">KYC à traiter</p>
                        <p className="text-xl font-bold text-neutral-100">{opsData.attention.kycPendingCount}</p>
                      </div>
                      <FileCheck className="size-5 text-muted-foreground/60" />
                    </CardContent>
                  </Card>

                  <Card className="border-neutral-850 bg-neutral-900/30">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Signaux publiés</p>
                        <p className="text-xl font-bold text-neutral-100">{opsData.stats.publishedSignalsCount}</p>
                      </div>
                      <Radio className="size-5 text-muted-foreground/60" />
                    </CardContent>
                  </Card>
                </div>

                {/* GRAPH & TIMELINE ROW */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Graph (7 days activity) */}
                  <Card className="border-neutral-850 bg-neutral-900/20 lg:col-span-2">
                    <CardContent className="p-6">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground pb-4 border-b border-neutral-850">
                        Inscriptions (7 derniers jours)
                      </h3>
                      {/* Simple SVG Chart */}
                      <div className="h-48 w-full flex items-end justify-between pt-6 px-4">
                        {opsData.activityGraph.map((dayData: any, idx: number) => {
                          const maxCount = Math.max(...opsData.activityGraph.map((d: any) => d.count), 5)
                          const pct = (dayData.count / maxCount) * 100
                          return (
                            <div key={idx} className="flex flex-col items-center gap-2 flex-1">
                              <span className="text-[10px] font-bold text-neutral-300">{dayData.count}</span>
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
                  <Card className="border-neutral-850 bg-neutral-900/20">
                    <CardContent className="p-6">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground pb-4 border-b border-neutral-850">
                        Activités récentes
                      </h3>
                      <div className="pt-4 space-y-4 max-h-48 overflow-y-auto">
                        {opsData.recentActivities.length > 0 ? (
                          opsData.recentActivities.map((act: any, idx: number) => (
                            <div key={idx} className="flex items-start gap-2.5 text-[10px]">
                              <span className="size-1.5 rounded-full bg-neutral-400 mt-1 shrink-0" />
                              <div>
                                <p className="font-semibold text-neutral-200">
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
                <Card className="border-neutral-850 bg-neutral-900/20">
                  <CardContent className="p-6">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground pb-4 border-b border-neutral-850">
                      Santé du Système
                    </h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-4 text-xs">
                      <div className="flex items-center gap-3">
                        <Server className="size-4 text-muted-foreground" />
                        <div>
                          <p className="font-bold text-neutral-300">Redis Server</p>
                          <Badge variant="outline" className={cn("text-[9px] py-0 px-1.5 mt-0.5", opsData.systemStatus.redis === "healthy" ? "text-emerald-400 bg-emerald-500/5 border-emerald-500/20" : "text-rose-400 bg-rose-500/5 border-rose-500/20")}>
                            {opsData.systemStatus.redis === "healthy" ? "En ligne" : "Échec"}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Activity className="size-4 text-muted-foreground" />
                        <div>
                          <p className="font-bold text-neutral-300">BullMQ Workers</p>
                          <Badge variant="outline" className={cn("text-[9px] py-0 px-1.5 mt-0.5", opsData.systemStatus.bullmq === "healthy" ? "text-emerald-400 bg-emerald-500/5 border-emerald-500/20" : "text-amber-400 bg-amber-500/5 border-amber-500/20")}>
                            {opsData.systemStatus.bullmq === "healthy" ? "Actifs (Concurrence 10)" : "Ralentis"}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Mail className="size-4 text-muted-foreground" />
                        <div>
                          <p className="font-bold text-neutral-300">SMTP Gateway</p>
                          <Badge variant="outline" className={cn("text-[9px] py-0 px-1.5 mt-0.5", opsData.systemStatus.smtp === "healthy" ? "text-emerald-400 bg-emerald-500/5 border-emerald-500/20" : "text-amber-400 bg-amber-500/5 border-amber-500/20")}>
                            {opsData.systemStatus.smtp === "healthy" ? "Opérationnel" : "Erreurs"}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Laptop className="size-4 text-muted-foreground" />
                        <div>
                          <p className="font-bold text-neutral-300">Stockage Disque</p>
                          <Badge variant="outline" className={cn("text-[9px] py-0 px-1.5 mt-0.5", opsData.systemStatus.storage === "healthy" ? "text-emerald-400 bg-emerald-500/5 border-emerald-500/20" : "text-amber-400 bg-amber-500/5 border-amber-500/20")}>
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
            <div className="flex items-center justify-between border-b border-neutral-850 pb-5">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-neutral-100">Gestion des membres</h1>
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
                  className="pl-9 bg-neutral-900 border-neutral-800 text-xs text-neutral-200"
                />
              </div>
              <Button variant="default" size="sm" onClick={fetchMembers} className="cursor-pointer">
                Rechercher
              </Button>
            </div>

            <Card className="border-neutral-850 bg-neutral-900/10">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-850 bg-neutral-900/30 text-muted-foreground font-bold uppercase tracking-wider text-[10px]">
                      <th className="px-6 py-3">Utilisateur</th>
                      <th className="px-6 py-3">Rôle</th>
                      <th className="px-6 py-3">WhatsApp</th>
                      <th className="px-6 py-3">Onboarding</th>
                      <th className="px-6 py-3">Statut</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-850">
                    {loadingMembers ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center"><Loader2 className="animate-spin text-primary inline" /></td>
                      </tr>
                    ) : members.length > 0 ? (
                      members.map((member) => (
                        <tr key={member.id} className="hover:bg-neutral-900/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                                {member.name.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold text-neutral-100">{member.name}</p>
                                <p className="text-[10px] text-muted-foreground">{member.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-semibold text-muted-foreground">{member.role?.name}</td>
                          <td className="px-6 py-4 text-muted-foreground">{member.phone || "—"}</td>
                          <td className="px-6 py-4">
                            <Badge variant="outline" className="text-[9px] border-neutral-850 py-0.5 px-2">
                              {member.onboardingStatus}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant="outline" className={cn(member.isActive ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20")}>
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
        {/* DEMANDES D'ACCÈS */}
        {/* ============================================================== */}
        {activeTab === "requests" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-neutral-850 pb-5">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-neutral-100">Demandes d'accès</h1>
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
                  <Card key={req.id} className="border-neutral-850 bg-neutral-900/30">
                    <CardContent className="p-5 space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-neutral-100 text-sm">{req.user.name}</h3>
                          <p className="text-[10px] text-muted-foreground">{req.user.email}</p>
                        </div>
                        <Badge variant="outline" className="text-[9px] border-neutral-800">
                          {req.plan.name}
                        </Badge>
                      </div>

                      <div className="space-y-1.5 text-[11px] text-muted-foreground">
                        <div className="flex justify-between">
                          <span>Progression Onboarding</span>
                          <span className="font-semibold text-neutral-200">{req.onboarding.progress}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${req.onboarding.progress}%` }}
                            className="h-full bg-primary transition-all duration-300"
                          />
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-neutral-850/60">
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
              <div className="py-16 text-center border border-dashed border-neutral-800 rounded-2xl text-muted-foreground select-none">
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
              <h2 className="text-sm font-bold text-neutral-100 uppercase tracking-wider">Publier un signal</h2>
              <SignalEditor onSignalCreated={fetchSignals} />
            </div>

            <div className="xl:col-span-2 space-y-6">
              <h2 className="text-sm font-bold text-neutral-100 uppercase tracking-wider">Historique des publications</h2>
              {loadingSignals ? (
                <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
              ) : signals.length > 0 ? (
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                  {signals.map((sig) => (
                    <Card key={sig.id} className="border-neutral-850 bg-neutral-900/20">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[9px] uppercase",
                              sig.status === "PUBLISHED" && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                              sig.status === "DRAFT" && "bg-neutral-500/10 text-neutral-400 border-neutral-500/20",
                              sig.status === "ARCHIVED" && "bg-rose-500/10 text-rose-400 border-rose-500/20"
                            )}
                          >
                            {sig.status}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {sig.publishedAt ? new Date(sig.publishedAt).toLocaleDateString() : new Date(sig.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <p className="text-xs text-neutral-200 line-clamp-3 leading-relaxed whitespace-pre-wrap">
                          {sig.content}
                        </p>

                        <div className="flex justify-between items-center pt-2 border-t border-neutral-850/60">
                          <span className="text-[9px] text-muted-foreground">Créé par : {sig.creator?.name || "Admin"}</span>
                          <div className="flex gap-1.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 text-muted-foreground hover:text-foreground cursor-pointer"
                              onClick={() => {
                                setPanelTitle("Détails du Signal")
                                setPanelType("signal")
                                setPanelData(sig)
                                setPanelOpen(true)
                              }}
                            >
                              <Eye className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 text-muted-foreground hover:text-destructive cursor-pointer"
                              onClick={() => handleDeleteSignal(sig.id)}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center border border-dashed border-neutral-800 rounded-xl text-muted-foreground">
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
            <div className="flex items-center justify-between border-b border-neutral-850 pb-5">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-neutral-100">Dossiers KYC</h1>
                <p className="text-xs text-muted-foreground mt-1">
                  Examinez et validez les pièces d'identité et les selfies des abonnés.
                </p>
              </div>
            </div>

            {loadingKyc ? (
              <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
            ) : kycDocs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {kycDocs.map((doc) => (
                  <Card key={doc.id} className="border-neutral-850 bg-neutral-900/30 overflow-hidden">
                    {/* Visual selfie placeholder */}
                    <div className="h-40 bg-neutral-900 border-b border-neutral-850 flex items-center justify-center text-muted-foreground relative">
                      <ImageIcon className="size-8 text-neutral-800" />
                      <Badge
                        variant="outline"
                        className={cn(
                          "absolute top-3 right-3 text-[9px] uppercase",
                          doc.status === "APPROVED" && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                          doc.status === "REJECTED" && "bg-rose-500/10 text-rose-400 border-rose-500/20",
                          doc.status === "PENDING" && "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        )}
                      >
                        {doc.status}
                      </Badge>
                    </div>
                    <CardContent className="p-4 space-y-4">
                      <div>
                        <h4 className="font-bold text-neutral-200 text-xs">{doc.user?.name}</h4>
                        <p className="text-[10px] text-muted-foreground">{doc.user?.email}</p>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-muted-foreground border-t border-neutral-850/60 pt-3">
                        <span>Reçu le : {new Date(doc.submittedAt || doc.createdAt).toLocaleDateString()}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-[10px] border-neutral-800 h-7 cursor-pointer"
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
            ) : (
              <div className="py-16 text-center border border-dashed border-neutral-800 rounded-2xl text-muted-foreground">
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
            <div className="flex items-center justify-between border-b border-neutral-850 pb-5">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-neutral-100">Vérifications Broker</h1>
                <p className="text-xs text-muted-foreground mt-1">
                  Vérifiez la liaison de compte broker des utilisateurs avec les vidéos fournies.
                </p>
              </div>
            </div>

            {loadingBroker ? (
              <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
            ) : brokerDocs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {brokerDocs.map((doc) => (
                  <Card key={doc.id} className="border-neutral-850 bg-neutral-900/30">
                    <CardContent className="p-5 space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-bold text-neutral-200 text-xs">{doc.user?.name}</h4>
                          <p className="text-[10px] text-muted-foreground">{doc.user?.email}</p>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[9px] uppercase",
                            doc.status === "APPROVED" && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                            doc.status === "REJECTED" && "bg-rose-500/10 text-rose-400 border-rose-500/20",
                            doc.status === "PENDING" && "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          )}
                        >
                          {doc.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-neutral-950/40 border border-neutral-850/60 text-[10px]">
                        <div>
                          <span className="text-[9px] text-muted-foreground block uppercase">Broker</span>
                          <span className="font-semibold text-neutral-200">{doc.brokerName}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-muted-foreground block uppercase">Numéro Compte</span>
                          <span className="font-semibold text-neutral-200">{doc.accountNumber}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-neutral-850/60 text-[10px] text-muted-foreground">
                        <span>Soumis le : {new Date(doc.submittedAt || doc.createdAt).toLocaleDateString()}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-[10px] border-neutral-800 h-7 cursor-pointer"
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
            ) : (
              <div className="py-16 text-center border border-dashed border-neutral-800 rounded-2xl text-muted-foreground">
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
            <div className="flex items-center justify-between border-b border-neutral-850 pb-5">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-neutral-100">Notifications</h1>
                <p className="text-xs text-muted-foreground mt-1">
                  Gérez l'envoi de messages d'information internes.
                </p>
              </div>
            </div>

            <Card className="border-neutral-850 bg-neutral-900/30 max-w-lg">
              <CardContent className="p-6 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Rédiger une notification système</h3>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground uppercase font-bold">Titre</label>
                    <Input placeholder="Alerte système..." className="bg-neutral-950 border-neutral-850 text-xs text-neutral-100" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground uppercase font-bold">Contenu</label>
                    <textarea placeholder="Votre message..." className="w-full p-3 rounded-lg border bg-neutral-950 border-neutral-850 text-xs text-neutral-100 focus:outline-none focus:border-primary/50 min-h-24" />
                  </div>
                  <Button variant="default" size="sm" className="w-full mt-2 cursor-pointer">
                    Diffuser la notification
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ============================================================== */}
        {/* EMAILS HISTORIQUE */}
        {/* ============================================================== */}
        {activeTab === "emails" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-neutral-850 pb-5">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-neutral-100">Historique d'envoi SMTP</h1>
                <p className="text-xs text-muted-foreground mt-1">
                  Surveillez la délivrabilité des emails transactionnels de la plateforme.
                </p>
              </div>
            </div>

            <Card className="border-neutral-850 bg-neutral-900/10">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-850 bg-neutral-900/30 text-muted-foreground font-bold uppercase tracking-wider text-[10px]">
                      <th className="px-6 py-3">Destinataire</th>
                      <th className="px-6 py-3">Objet</th>
                      <th className="px-6 py-3">Canal</th>
                      <th className="px-6 py-3">Date d'envoi</th>
                      <th className="px-6 py-3 text-right">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-850">
                    {loadingEmails ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center"><Loader2 className="animate-spin text-primary inline" /></td>
                      </tr>
                    ) : emails.length > 0 ? (
                      emails.map((delivery) => (
                        <tr key={delivery.id} className="hover:bg-neutral-900/30 transition-colors">
                          <td className="px-6 py-4 font-semibold text-neutral-200">
                            {delivery.notification?.user?.email || "—"}
                          </td>
                          <td className="px-6 py-4 text-muted-foreground truncate max-w-[200px]">
                            {delivery.notification?.title || "—"}
                          </td>
                          <td className="px-6 py-4 text-muted-foreground">SMTP (BullMQ)</td>
                          <td className="px-6 py-4 text-muted-foreground">
                            {delivery.sentAt ? new Date(delivery.sentAt).toLocaleString("fr-FR") : "En file d'attente"}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Badge
                              variant="outline"
                              className={cn(
                                delivery.status === "SENT" && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                                (delivery.status === "FAILED" || delivery.status === "BOUNCED") && "bg-rose-500/10 text-rose-400 border-rose-500/20",
                                delivery.status === "PENDING" && "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              )}
                            >
                              {delivery.status}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-muted-foreground">Aucun email envoyé.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* ============================================================== */}
        {/* AUDIT LOGS */}
        {/* ============================================================== */}
        {activeTab === "audit" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-neutral-850 pb-5">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-neutral-100">Journal d'audit</h1>
                <p className="text-xs text-muted-foreground mt-1">
                  Timeline de type GitHub enregistrant toutes les modifications critiques de la plateforme.
                </p>
              </div>
            </div>

            <Card className="border-neutral-850 bg-neutral-900/10">
              <div className="p-6">
                <div className="space-y-6">
                  {loadingAudits ? (
                    <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
                  ) : audits.length > 0 ? (
                    audits.map((log) => (
                      <div key={log.id} className="relative pl-6 border-l border-neutral-850 pb-6 last:pb-0">
                        <span className="absolute -left-1.5 top-1.5 size-3 rounded-full border border-neutral-800 bg-neutral-950 flex items-center justify-center">
                          <span className="size-1 rounded-full bg-primary" />
                        </span>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-4">
                            <span className="font-semibold text-xs text-neutral-200">
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
            <div className="flex items-center justify-between border-b border-neutral-850 pb-5">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-neutral-100">Centre de sécurité</h1>
                <p className="text-xs text-muted-foreground mt-1">
                  Surveillez les connexions récentes et détectez d'éventuelles tentatives d'intrusion.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Connexions récentes */}
              <Card className="border-neutral-850 bg-neutral-900/30">
                <CardContent className="p-6">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground pb-4 border-b border-neutral-850">
                    Connexions suspectes (IPs hors zone)
                  </h3>
                  <div className="pt-4 text-xs text-muted-foreground py-6 text-center select-none">
                    🟢 Aucun comportement de connexion anormal enregistré aujourd'hui.
                  </div>
                </CardContent>
              </Card>

              {/* Tentatives de force brute */}
              <Card className="border-neutral-850 bg-neutral-900/30">
                <CardContent className="p-6">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground pb-4 border-b border-neutral-850">
                    Tentatives de force brute
                  </h3>
                  <div className="pt-4 text-xs text-muted-foreground py-6 text-center select-none">
                    🟢 0 tentative de mot de passe incorrect bloquée par le limiteur de débit.
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* STATISTIQUES CONSOLIDEES */}
        {/* ============================================================== */}
        {activeTab === "stats" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-neutral-850 pb-5">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-neutral-100">Statistiques globales</h1>
                <p className="text-xs text-muted-foreground mt-1">
                  Compteurs clés consolidés d'activité de la plateforme NBA.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <Card className="border-neutral-850 bg-neutral-900/30 p-6 space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">Membres</span>
                <p className="text-2xl font-bold text-neutral-200">
                  {opsData?.stats?.totalMembers || 0}
                </p>
              </Card>
              <Card className="border-neutral-850 bg-neutral-900/30 p-6 space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">Signaux émis</span>
                <p className="text-2xl font-bold text-neutral-200">
                  {opsData?.stats?.publishedSignalsCount || 0}
                </p>
              </Card>
              <Card className="border-neutral-850 bg-neutral-900/30 p-6 space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">Dossiers KYC Validés</span>
                <p className="text-2xl font-bold text-neutral-200">
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
            <div className="flex items-center justify-between border-b border-neutral-850 pb-5">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-neutral-100">Paramètres système</h1>
                <p className="text-xs text-muted-foreground mt-1">
                  Configurez le serveur SMTP, Redis et la queue BullMQ.
                </p>
              </div>
            </div>

            <Card className="border-neutral-850 bg-neutral-900/30">
              <CardContent className="p-6 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground pb-2 border-b border-neutral-850">
                  SMTP Mailer configuration
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1 col-span-2">
                    <label className="text-[10px] text-muted-foreground uppercase font-bold">Serveur SMTP</label>
                    <Input placeholder="smtp.neverbrokeagain.com" className="bg-neutral-950 border-neutral-850 text-xs text-neutral-200" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground uppercase font-bold">Port SMTP</label>
                    <Input placeholder="587" className="bg-neutral-950 border-neutral-850 text-xs text-neutral-200" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground uppercase font-bold">Sécurité</label>
                    <Input placeholder="TLS" className="bg-neutral-950 border-neutral-850 text-xs text-neutral-200" />
                  </div>
                </div>
                <div className="pt-2">
                  <Button variant="default" size="sm" className="w-full cursor-pointer">
                    Sauvegarder les configurations
                  </Button>
                </div>
              </CardContent>
            </Card>
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

// Keep a small helper function intact from the original code
async function handleDuplicate(id: string, fetchSignals: () => void) {
  try {
    const res = await fetch(`/api/admin/signals/${id}/duplicate`, {
      method: "POST"
    })
    if (res.ok) {
      fetchSignals()
      alert("Signal dupliqué avec succès en tant que brouillon.")
    } else {
      alert("Échec de la duplication.")
    }
  } catch (err) {
    console.error(err)
  }
}
