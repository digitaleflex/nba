"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  LayoutDashboard, Users, FileText, Shield, Fingerprint, MessageCircle,
  Mail, Bell, Settings, BarChart3, Activity, Gavel, Radio, ShieldCheck,
  LucideIcon, AlertTriangle, Bot, Clock, Database, Smartphone, BookOpen, FileJson, Code2, Terminal, Eye, ListChecks, MessagesSquare, Search, ChevronDown, DollarSign,
} from "lucide-react"
import { cn } from "@nba/design-system"

interface NavItem {
  tab: string
  label: string
  icon: LucideIcon
  badge?: "support" | "security"
  href?: string
}

interface NavGroup {
  label: string
  icon: LucideIcon
  items: NavItem[]
}

export function AdminSidebar({ activeTab, supportCount }: { activeTab: string; supportCount: number }) {
  const router = useRouter()
  const [securityAlerts, setSecurityAlerts] = useState(0)
  const [pulse, setPulse] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const prevRef = useRef(0)

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await fetch("/api/admin/security/alerts")
        if (res.ok) {
          const data = await res.json()
          setSecurityAlerts(data.alerts)
          if (data.alerts > prevRef.current && prevRef.current > 0) {
            setPulse(true)
            setTimeout(() => setPulse(false), 2000)
          }
          prevRef.current = data.alerts
        }
      } catch {}
    }
    fetchAlerts()
    const id = setInterval(fetchAlerts, 15000)
    return () => clearInterval(id)
  }, [])

  const surveillanceItems: NavItem[] = [
    { tab: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
    { tab: "stats", label: "Statistiques", icon: BarChart3 },
    { tab: "analytics", label: "Analytics", icon: Activity },
    { tab: "revenue", label: "Revenus", icon: DollarSign },
  ]

  const decisionItems: NavItem[] = [
    { tab: "requests", label: "Demandes d'accès", icon: FileText },
    { tab: "membres", label: "Membres", icon: Users },
    { tab: "users", label: "Utilisateurs", icon: Users },
    { tab: "kyc", label: "KYC", icon: Fingerprint },
    { tab: "broker", label: "Broker", icon: Shield },
  ]

  const communicationItems: NavItem[] = [
    { tab: "signals", label: "Signaux", icon: Bot },
    { tab: "emails", label: "E-mails", icon: Mail },
    { tab: "notifications", label: "Notifications", icon: Bell },
  ]

  const auditItems: NavItem[] = [
    { tab: "security", label: "Centre sécurité", icon: ShieldCheck, badge: securityAlerts > 0 ? "security" : undefined },
    { tab: "fraud", label: "Anti-Fraude", icon: AlertTriangle, badge: securityAlerts > 0 ? "security" : undefined },
    { tab: "moderation", label: "Modération", icon: Gavel },
    { tab: "audit", label: "Audit", icon: Database },
    { tab: "settings", label: "Paramètres", icon: Settings },
  ]

  const moreItems: NavItem[] = [
    { tab: "support", label: "Tickets support", icon: MessageCircle, badge: supportCount > 0 ? "support" : undefined },
    { tab: "formation", label: "Formation", icon: BookOpen },
    { tab: "coaching", label: "Coaching", icon: BookOpen, href: "/admin/coaching" },
    { tab: "devices", label: "Appareils", icon: Smartphone },
    { tab: "crons", label: "Cron Jobs", icon: Clock },
    { tab: "developer", label: "Console développeur", icon: Terminal, href: "/admin/developer" },
    { tab: "queues", label: "Files d'attente", icon: Clock, href: "/admin/queues" },
    { tab: "cache", label: "Cache", icon: Database, href: "/admin/cache" },
    { tab: "webhooks", label: "Webhooks DLQ", icon: Activity, href: "/admin/webhooks/dlq" },
  ]

  function renderNavItems(items: NavItem[], groupStart = false) {
    return items.map((item) => {
      const isActive = activeTab === item.tab
      const Icon = item.icon
      return (
        <button
          key={item.tab}
          onClick={() => router.push(item.href ?? `/admin?tab=${item.tab}`)}
          className={cn(
            "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs transition-all text-left cursor-pointer relative",
            isActive
              ? "bg-primary/10 text-primary font-semibold shadow-sm"
              : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
          )}
        >
          {isActive && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-primary" />
          )}
          <Icon className={cn("size-4 shrink-0", isActive && "text-primary")} />
          <span className="truncate">{item.label}</span>
          {item.badge === "support" && (
            <span className="ml-auto size-4 rounded-full bg-rose-500 text-[9px] font-bold text-white flex items-center justify-center ring-2 ring-card">
              {supportCount > 9 ? "9+" : supportCount}
            </span>
          )}
          {item.badge === "security" && (
            <span className={cn(
              "ml-auto size-5 rounded-full bg-rose-500 text-[9px] font-bold text-white flex items-center justify-center ring-2 ring-card",
              pulse && "animate-pulse",
            )}>
              {securityAlerts > 9 ? "9+" : securityAlerts}
            </span>
          )}
        </button>
      )
    })
  }

  function NavGroupSection({ label, icon: GroupIcon, children }: { label: string; icon: LucideIcon; children: React.ReactNode }) {
    return (
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 px-2.5 pb-1 flex items-center gap-1.5">
          <GroupIcon className="size-2.5" />
          {label}
        </p>
        <div className="space-y-0.5">{children}</div>
      </div>
    )
  }

  return (
    <aside className="hidden md:flex flex-col w-56 min-h-screen bg-card border-r border-border shrink-0">
      <div className="p-4 border-b border-border/60">
        <a href="/admin" className="flex items-center gap-2.5 group">
          <div className="size-8 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-sm shadow-primary/20 group-hover:shadow-md group-hover:shadow-primary/30 transition-shadow">
            <span className="text-primary-foreground text-sm font-black tracking-tight">NBA</span>
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold text-foreground">Admin</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-medium">NeverBrokeAgain</p>
          </div>
        </a>
      </div>

      <nav className="flex-1 overflow-y-auto p-2 space-y-3 scrollbar-thin">
        <NavGroupSection label="Surveiller" icon={Eye}>
          {renderNavItems(surveillanceItems)}
        </NavGroupSection>

        <NavGroupSection label="Décider" icon={ListChecks}>
          {renderNavItems(decisionItems)}
        </NavGroupSection>

        <NavGroupSection label="Communiquer" icon={MessagesSquare}>
          {renderNavItems(communicationItems)}
        </NavGroupSection>

        <NavGroupSection label="Auditer" icon={Search}>
          {renderNavItems(auditItems)}
        </NavGroupSection>

        <div>
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 hover:text-foreground transition-colors cursor-pointer"
          >
            <ChevronDown className={cn("size-3 transition-transform", moreOpen && "rotate-180")} />
            Plus ({moreItems.length})
          </button>
          {moreOpen && (
            <div className="space-y-0.5 mt-1">
              {renderNavItems(moreItems)}
            </div>
          )}
        </div>
      </nav>
    </aside>
  )
}
