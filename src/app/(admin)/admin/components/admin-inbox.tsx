"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { BellIcon, ChevronRightIcon, CheckIcon, XIcon, ClockIcon, SearchIcon } from "lucide-react"

import { cn } from "@nba/design-system/lib/utils"
import { Button, Tabs, TabsList, TabsTrigger } from "@nba/design-system"
import { useMediaQuery } from "@nba/design-system/hooks/use-media-query"
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetHeader,
} from "@nba/design-system/components/bottom-sheet"

import type { InboxCategory, InboxItem } from "@nba/lib/services/admin-inbox"

const ACTION_META: Record<InboxItem["actions"][number], { label: string; icon: React.ReactNode; variant?: string }> = {
  approve: { label: "Approuver", icon: <CheckIcon className="size-3.5" />, variant: "emerald" },
  reject: { label: "Rejeter", icon: <XIcon className="size-3.5" />, variant: "rose" },
  snooze: { label: "Snooze", icon: <ClockIcon className="size-3.5" /> },
  investigate: { label: "Investiguer", icon: <SearchIcon className="size-3.5" /> },
  dismiss: { label: "Ignorer", icon: <XIcon className="size-3.5" /> },
}

function ItemRow({ item, onAct }: { item: InboxItem; onAct: (item: InboxItem, action: InboxItem["actions"][number]) => void }) {
  const router = useRouter()
  const primary = item.actions.filter((a) => a !== "dismiss" && a !== "snooze")
  const secondary = item.actions.filter((a) => a === "snooze" || a === "dismiss")
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-background/40 p-3">
      <button
        onClick={() => {
          router.push(item.link)
        }}
        className="flex items-start justify-between gap-2 text-left cursor-pointer"
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
          <p className="truncate text-xs text-muted-foreground">{item.subtitle}</p>
        </div>
        <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
      </button>
      <div className="flex flex-wrap gap-1.5">
        {primary.map((a) => {
          const meta = ACTION_META[a]
          return (
            <Button
              key={a}
              size="sm"
              variant={meta.variant === "emerald" ? "default" : meta.variant === "rose" ? "destructive" : "outline"}
              className="h-7 gap-1 px-2 text-xs"
              onClick={() => onAct(item, a)}
            >
              {meta.icon}
              {meta.label}
            </Button>
          )
        })}
        {secondary.map((a) => {
          const meta = ACTION_META[a]
          return (
            <Button
              key={a}
              size="sm"
              variant="ghost"
              className="h-7 gap-1 px-2 text-xs text-muted-foreground"
              onClick={() => onAct(item, a)}
            >
              {meta.icon}
              {meta.label}
            </Button>
          )
        })}
      </div>
    </div>
  )
}

function InboxBody({ category, onChanged }: { category: string; onChanged: () => void }) {
  const [items, setItems] = React.useState<InboxItem[]>([])
  const [loading, setLoading] = React.useState(true)

  const load = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/inbox?category=${category}`, { cache: "no-store" })
      if (res.ok) {
        const data = await res.json()
        setItems(data.items ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [category])

  React.useEffect(() => {
    void load()
  }, [load])

  const onAct = async (item: InboxItem, action: InboxItem["actions"][number]) => {
    if (action === "approve" || action === "reject") {
      const [prefix, rawId] = item.id.split(":")
      const endpoint = prefix === "kyc" ? `/api/admin/kyc/${rawId}` : `/api/admin/broker/${rawId}`
      await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: action === "approve" ? "APPROVED" : "REJECTED", notes: "Depuis l'inbox admin" }),
      })
    } else if (action === "snooze") {
      await fetch(`/api/admin/inbox/${encodeURIComponent(item.id)}/snooze`, { method: "POST" })
    } else if (action === "dismiss") {
      await fetch(`/api/admin/inbox/${encodeURIComponent(item.id)}/dismiss`, { method: "POST" })
    }
    setItems((prev) => prev.filter((i) => i.id !== item.id))
    onChanged()
  }

  if (loading) {
    return <div className="py-10 text-center text-sm text-muted-foreground">Chargement…</div>
  }
  if (items.length === 0) {
    return <div className="py-10 text-center text-sm text-muted-foreground">Rien à traiter ici 🎉</div>
  }
  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => (
        <ItemRow key={item.id} item={item} onAct={onAct} />
      ))}
    </div>
  )
}

export function AdminInbox() {
  const isDesktop = useMediaQuery("(min-width: 768px)")
  const [open, setOpen] = React.useState(false)
  const [pending, setPending] = React.useState(0)
  const [category, setCategory] = React.useState<InboxCategory | "all">("all")
  const [pulse, setPulse] = React.useState(false)

  const refreshCount = React.useCallback(async () => {
    try {
      const res = await fetch("/api/admin/inbox?category=pending", { cache: "no-store" })
      if (res.ok) {
        const data = await res.json()
        const next = data.total ?? 0
        setPending(next)
        setPulse(next > pendingRef.current && pendingRef.current > 0)
        pendingRef.current = next
      }
    } catch {
      /* ignore */
    }
  }, [])

  const pendingRef = React.useRef(0)

  React.useEffect(() => {
    const init = setTimeout(() => void refreshCount(), 0)
    const t = setInterval(() => void refreshCount(), 15000)
    return () => {
      clearTimeout(init)
      clearInterval(t)
    }
  }, [refreshCount])

  React.useEffect(() => {
    if (!pulse) return
    const t = setTimeout(() => setPulse(false), 800)
    return () => clearTimeout(t)
  }, [pulse])

  const bell = (
    <button
      onClick={() => setOpen((v) => !v)}
      className={cn(
        "relative flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer",
        pulse && "animate-pulse text-emerald-500"
      )}
      aria-label="Inbox admin"
    >
      <BellIcon className="size-5" />
      {pending > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold leading-4 text-white">
          {pending > 99 ? "99+" : pending}
        </span>
      )}
    </button>
  )

  if (!isDesktop) {
    return (
      <>
        {bell}
        <BottomSheet open={open} onOpenChange={setOpen}>
          <BottomSheetContent className="max-h-[85dvh]">
            <BottomSheetHeader title="Inbox" onClose={() => setOpen(false)} />
            <Tabs value={category} onValueChange={(v: string) => setCategory(v as InboxCategory | "all")}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">Tout</TabsTrigger>
                <TabsTrigger value="pending">À valider</TabsTrigger>
                <TabsTrigger value="security">Sécurité</TabsTrigger>
                <TabsTrigger value="system">Système</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="mt-3">
              <InboxBody category={category} onChanged={refreshCount} />
            </div>
          </BottomSheetContent>
        </BottomSheet>
      </>
    )
  }

  return (
    <div className="relative">
      {bell}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-[360px] rounded-xl border border-border bg-card text-card-foreground shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-3 py-2">
              <span className="text-sm font-semibold text-foreground">Inbox</span>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground cursor-pointer" aria-label="Fermer">
                <XIcon className="size-4" />
              </button>
            </div>
            <div className="px-3 pt-2">
              <Tabs value={category} onValueChange={(v: string) => setCategory(v as InboxCategory | "all")}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="all">Tout</TabsTrigger>
                  <TabsTrigger value="pending">À valider</TabsTrigger>
                  <TabsTrigger value="security">Sécurité</TabsTrigger>
                  <TabsTrigger value="system">Système</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-3">
              <InboxBody category={category} onChanged={refreshCount} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
