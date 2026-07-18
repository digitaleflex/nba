"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import {
  LayoutDashboard,
  Gauge,
  Activity,
  Radio,
  Mail,
  Bell,
  ListTodo,
  Users,
  UserCheck,
  FileCheck,
  Link2,
  Shield,
  Ban,
  FileText,
  ShieldCheck,
  Settings,
  MessageSquare,
  CircleHelp,
  Database,
} from "lucide-react"
import { cn } from "@nba/design-system"

const GROUPS = [
  {
    label: "Supervision",
    items: [
      { href: "/admin", label: "Console", icon: LayoutDashboard, match: "/admin" },
      { href: "/admin/control-room", label: "Control Room", icon: Gauge, match: "/admin/control-room" },
      { href: "/admin/tracker", label: "Tracker", icon: Activity, match: "/admin/tracker" },
      { href: "/admin/cache", label: "Cache & Services", icon: Database, match: "/admin/cache" },
      { href: "/admin/queues", label: "Files BullMQ", icon: Activity, match: "/admin/queues" },
    ],
  },
  {
    label: "Communication",
    items: [
      { href: "/admin?tab=signals", label: "Signaux", icon: Radio, match: "?tab=signals" },
      { href: "/admin?tab=emails", label: "E-mails", icon: Mail, match: "?tab=emails" },
      { href: "/admin?tab=notifications", label: "Notifications", icon: Bell, match: "?tab=notifications" },
    ],
  },
  {
    label: "Membres",
    items: [
      { href: "/admin?tab=requests", label: "Demandes d'accès", icon: ListTodo, match: "?tab=requests" },
      { href: "/admin?tab=membres", label: "Membres", icon: Users, match: "?tab=membres" },
      { href: "/admin?tab=kyc", label: "KYC", icon: FileCheck, match: "?tab=kyc" },
      { href: "/admin?tab=broker", label: "Broker", icon: Link2, match: "?tab=broker" },
    ],
  },
  {
    label: "Système",
    items: [
      { href: "/admin?tab=moderation", label: "Modération", icon: Ban, match: "?tab=moderation" },
      { href: "/admin?tab=audit", label: "Audit", icon: FileText, match: "?tab=audit" },
      { href: "/admin?tab=security", label: "Sécurité", icon: ShieldCheck, match: "?tab=security" },
      { href: "/admin?tab=settings", label: "Paramètres", icon: Settings, match: "?tab=settings" },
    ],
  },
  {
    label: "Social",
    items: [
      { href: "/admin/messages", label: "Messages", icon: MessageSquare, match: "/admin/messages" },
      { href: "/admin/support", label: "Support", icon: CircleHelp, match: "/admin/support" },
    ],
  },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const tab = searchParams.get("tab") || "dashboard"

  const tabLinks = [
    { href: "/admin?tab=signals", label: "Signaux", icon: Radio, match: "signals" },
    { href: "/admin?tab=emails", label: "E-mails", icon: Mail, match: "emails" },
    { href: "/admin?tab=notifications", label: "Notifications", icon: Bell, match: "notifications" },
    { href: "/admin?tab=requests", label: "Demandes d'accès", icon: ListTodo, match: "requests" },
    { href: "/admin?tab=membres", label: "Membres", icon: Users, match: "membres" },
    { href: "/admin?tab=kyc", label: "KYC", icon: FileCheck, match: "kyc" },
    { href: "/admin?tab=broker", label: "Broker", icon: Link2, match: "broker" },
    { href: "/admin?tab=moderation", label: "Modération", icon: Ban, match: "moderation" },
    { href: "/admin?tab=audit", label: "Audit", icon: FileText, match: "audit" },
    { href: "/admin?tab=security", label: "Sécurité", icon: ShieldCheck, match: "security" },
    { href: "/admin?tab=settings", label: "Paramètres", icon: Settings, match: "settings" },
  ]

  function isTabActive(item: (typeof tabLinks)[number]) {
    return pathname === "/admin" && tab === item.match
  }

  function isPathActive(href: string) {
    if (href === "/admin") return pathname === "/admin" && tab === "dashboard"
    return pathname.startsWith(href)
  }

  return (
    <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-border/40 bg-muted/10">
      <nav className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Supervision */}
        <div>
          <p className="px-3 pb-1 text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wider select-none">
            Supervision
          </p>
          <div className="space-y-0.5">
            <Link href="/admin" className={cn("flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-[36px]",
              isPathActive("/admin") && tab !== "membres" && tab !== "requests" && tab !== "kyc" && tab !== "broker" && tab !== "moderation" && tab !== "audit" && tab !== "security" && tab !== "settings" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}>
              <LayoutDashboard className="size-4 shrink-0" /> Console
            </Link>
            <Link href="/admin/control-room" className={cn("flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-[36px]",
              isPathActive("/admin/control-room") ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}>
              <Gauge className="size-4 shrink-0" /> Control Room
            </Link>
            <Link href="/admin/tracker" className={cn("flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-[36px]",
               isPathActive("/admin/tracker") ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
             )}>
               <Activity className="size-4 shrink-0" /> Tracker
             </Link>
             <Link href="/admin/cache" className={cn("flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-[36px]",
                isPathActive("/admin/cache") ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}>
                <Database className="size-4 shrink-0" /> Cache & Services
              </Link>
             <Link href="/admin/queues" className={cn("flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-[36px]",
               isPathActive("/admin/queues") ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
             )}>
               <Activity className="size-4 shrink-0" /> Files BullMQ
             </Link>
           </div>
         </div>

        {/* Membres */}
        <div>
          <p className="px-3 pb-1 text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wider select-none">
            Membres
          </p>
          <div className="space-y-0.5">
            {tabLinks.filter(l => ["requests","membres","kyc","broker"].includes(l.match)).map((item) => (
              <Link key={item.href} href={item.href} className={cn("flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-[36px]",
                isTabActive(item) ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}>
                <item.icon className="size-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Communication */}
        <div>
          <p className="px-3 pb-1 text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wider select-none">
            Communication
          </p>
          <div className="space-y-0.5">
            {tabLinks.filter(l => ["signals","emails","notifications"].includes(l.match)).map((item) => (
              <Link key={item.href} href={item.href} className={cn("flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-[36px]",
                isTabActive(item) ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}>
                <item.icon className="size-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Système */}
        <div>
          <p className="px-3 pb-1 text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wider select-none">
            Système
          </p>
          <div className="space-y-0.5">
            {tabLinks.filter(l => ["moderation","audit","security","settings"].includes(l.match)).map((item) => (
              <Link key={item.href} href={item.href} className={cn("flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-[36px]",
                isTabActive(item) ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}>
                <item.icon className="size-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Social */}
        <div>
          <p className="px-3 pb-1 text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wider select-none">
            Social
          </p>
          <div className="space-y-0.5">
            <Link href="/admin/messages" className={cn("flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-[36px]",
              isPathActive("/admin/messages") ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}>
              <MessageSquare className="size-4 shrink-0" /> Messages
            </Link>
            <Link href="/admin/support" className={cn("flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-[36px]",
              isPathActive("/admin/support") ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}>
              <CircleHelp className="size-4 shrink-0" /> Support
            </Link>
          </div>
        </div>
      </nav>

      <div className="border-t border-border/30 p-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors border border-dashed border-border/50"
        >
          <LayoutDashboard className="size-4" />
          Retour au dashboard
        </Link>
      </div>
    </aside>
  )
}