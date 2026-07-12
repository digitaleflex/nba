"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Users, Radio, History, ListTodo, ShieldCheck, MessageCircle, MessageSquare } from "lucide-react"
import { cn } from "@nba/design-system"

const NAV_ITEMS = [
  { href: "/admin", label: "Demandes d'accès", icon: ListTodo, matchExact: true },
  { href: "/admin/members", label: "Membres", icon: Users, matchExact: false },
  { href: "/admin/messages", label: "Messages", icon: MessageSquare, matchExact: false },
  { href: "/admin/support", label: "Support", icon: MessageCircle, matchExact: false },
  { href: "/admin/audit", label: "Journal d'audit", icon: ShieldCheck, matchExact: false },
]

export function AdminSidebar() {
  const pathname = usePathname()

  function isActive(item: typeof NAV_ITEMS[number]) {
    return item.matchExact ? pathname === item.href : pathname.startsWith(item.href)
  }

  return (
    <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-border/40 bg-muted/10">
      <nav className="flex flex-col gap-1 p-3">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              isActive(item)
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
