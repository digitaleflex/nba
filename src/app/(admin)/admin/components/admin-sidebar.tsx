"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  LayoutDashboard, Users, FileText, Shield, Fingerprint, MessageCircle,
  Mail, Bell, Settings, BarChart3, Activity, Gavel, Radio, ShieldCheck,
  LucideIcon, AlertTriangle, Bot, Clock, Database, Smartphone, BookOpen,
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

  const groups: NavGroup[] = [
    {
      label: "Surveiller", icon: Activity,
      items: [
        { tab: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
        { tab: "stats", label: "Statistiques", icon: BarChart3 },
        { tab: "analytics", label: "Analytics", icon: Activity },
        { tab: "devices", label: "Appareils", icon: Smartphone },
        { tab: "crons", label: "Cron Jobs", icon: Clock },
      ],
    },
    {
      label: "Membres", icon: Users,
      items: [
        { tab: "requests", label: "Demandes", icon: FileText },
        { tab: "membres", label: "Membres", icon: Users },
        { tab: "users", label: "Utilisateurs", icon: Users },
        { tab: "kyc", label: "KYC", icon: Fingerprint },
        { tab: "broker", label: "Broker", icon: Shield },
      ],
    },
    {
      label: "Communication", icon: Radio,
      items: [
        { tab: "signals", label: "Signaux", icon: Bot },
        { tab: "emails", label: "E-mails", icon: Mail },
        { tab: "notifications", label: "Notifications", icon: Bell },
      ],
    },
    {
      label: "Sécurité", icon: ShieldCheck,
      items: [
        { tab: "security", label: "Centre sécurité", icon: ShieldCheck, badge: securityAlerts > 0 ? "security" : undefined },
        { tab: "fraud", label: "Anti-Fraude", icon: AlertTriangle, badge: securityAlerts > 0 ? "security" : undefined },
        { tab: "moderation", label: "Modération", icon: Gavel },
        { tab: "audit", label: "Audit", icon: Database },
      ],
    },
    {
      label: "Support", icon: MessageCircle,
      items: [
        { tab: "support", label: "Tickets", icon: MessageCircle, badge: supportCount > 0 ? "support" : undefined },
        { tab: "formation", label: "Formation", icon: FileText },
        { tab: "coaching", label: "Coaching", icon: BookOpen, href: "/admin/coaching" },
      ],
    },
    {
      label: "Administration", icon: Settings,
      items: [
        { tab: "settings", label: "Paramètres", icon: Settings },
      ],
    },
  ]

  return (
    <aside className="hidden md:flex flex-col w-56 min-h-screen bg-card border-r border-border shrink-0">
      <div className="p-4 border-b border-border">
        <a href="/admin" className="flex items-center gap-2">
          <div className="size-7 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-xs font-black">NBA</span>
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold text-foreground">Admin</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">NeverBrokeAgain</p>
          </div>
        </a>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-4">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-2 pb-1 flex items-center gap-1.5">
              <group.icon className="size-3" />
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = activeTab === item.tab
                const Icon = item.icon
                return (
                  <button
                    key={item.tab}
                    onClick={() => router.push(item.href ?? `/admin?tab=${item.tab}`)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors text-left cursor-pointer",
                      isActive
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                    {item.badge === "support" && (
                      <span className="ml-auto size-4 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center">
                        {supportCount > 9 ? "9+" : supportCount}
                      </span>
                    )}
                    {item.badge === "security" && (
                      <span className={cn(
                        "ml-auto size-5 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center",
                        pulse && "animate-pulse",
                      )}>
                        {securityAlerts > 9 ? "9+" : securityAlerts}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  )
}
