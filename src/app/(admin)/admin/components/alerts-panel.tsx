"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  FileCheck,
  Link2,
  Webhook,
  MailX,
  ShieldAlert,
  AlertTriangle,
  Loader2,
  Inbox,
  BellRing,
} from "lucide-react"
import {
  Card,
  CardContent,
  Badge,
  cn,
  BottomSheet,
  BottomSheetContent,
  BottomSheetHeader,
  useMediaQuery,
} from "@nba/design-system"

interface AlertsData {
  dangerZone: { bannedCount: number; pendingRequests: number; pendingKyc: number }
  kpis: { bounced: number; complained: number; pendingKyc: number }
  webhookDlq?: number
  loginAnomalies?: number
  alerts: { level: "warn" | "danger"; message: string }[]
  _brokerPending?: number
}

const REFRESH_MS = 10_000

function AlertRow({
  icon,
  label,
  count,
  href,
  tone,
  onNavigate,
}: {
  icon: React.ReactNode
  label: string
  count: number
  href?: string
  tone: "amber" | "rose" | "blue"
  onNavigate: (href: string) => void
}) {
  const toneCls =
    tone === "rose"
      ? "text-rose-600 bg-rose-500/5 border-rose-500/20"
      : tone === "amber"
        ? "text-amber-600 bg-amber-500/5 border-amber-500/20"
        : "text-blue-600 bg-blue-500/5 border-blue-500/20"
  return (
    <button
      onClick={() => href && onNavigate(href)}
      className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border border-border bg-card/40 hover:bg-muted/40 transition-colors text-left cursor-pointer"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <span className={cn("size-7 rounded-lg flex items-center justify-center shrink-0 border", toneCls)}>
          {icon}
        </span>
        <span className="text-xs font-medium text-foreground truncate">{label}</span>
      </div>
      <span className={cn("shrink-0 text-sm font-bold tabular-nums", tone === "rose" ? "text-rose-600" : tone === "amber" ? "text-amber-600" : "text-blue-600")}>
        {count}
      </span>
    </button>
  )
}

function AlertsBody({ data, loading, stale, onNavigate }: { data: AlertsData | null; loading: boolean; stale?: boolean; onNavigate: (href: string) => void }) {
  if (loading && !data) {
    return (
      <div className="py-10 flex justify-center">
        <Loader2 className="size-5 animate-spin text-primary" />
      </div>
    )
  }
  if (!data) return null

  const kyc = data.dangerZone?.pendingKyc ?? 0
  const broker = data._brokerPending ?? 0
  const requests = data.dangerZone?.pendingRequests ?? 0
  const dlq = data.webhookDlq ?? 0
  const emailFailures = (data.kpis?.bounced ?? 0) + (data.kpis?.complained ?? 0)
  const loginAnomalies = data.loginAnomalies ?? 0

  const totalAlerts =
    kyc + broker + requests + dlq + emailFailures + loginAnomalies + (data.alerts?.length ?? 0)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Alertes & à traiter
        </h3>
        <span className="text-[10px] text-muted-foreground">MAJ auto 10s</span>
      </div>

      <div className="space-y-2">
        <AlertRow
          icon={<FileCheck className="size-4" />}
          label="KYC en attente"
          count={kyc}
          href="/admin?tab=kyc"
          tone="amber"
          onNavigate={onNavigate}
        />
        <AlertRow
          icon={<Link2 className="size-4" />}
          label="Broker en attente"
          count={broker}
          href="/admin?tab=broker"
          tone="amber"
          onNavigate={onNavigate}
        />
        <AlertRow
          icon={<Inbox className="size-4" />}
          label="Demandes d'accès"
          count={requests}
          href="/admin?tab=requests"
          tone="blue"
          onNavigate={onNavigate}
        />
        <AlertRow
          icon={<Webhook className="size-4" />}
          label="Webhook DLQ"
          count={dlq}
          href="/admin/webhooks/dlq"
          tone="rose"
          onNavigate={onNavigate}
        />
        <AlertRow
          icon={<MailX className="size-4" />}
          label="Échecs email 24h"
          count={emailFailures}
          tone="rose"
          onNavigate={onNavigate}
        />
        <AlertRow
          icon={<ShieldAlert className="size-4" />}
          label="Anomalies de connexion"
          count={loginAnomalies}
          tone="rose"
          onNavigate={onNavigate}
        />
      </div>

      {data.alerts && data.alerts.length > 0 && (
        <div className="pt-2 space-y-2">
          {data.alerts.map((a, i) => (
            <div
              key={i}
              className={cn(
                "flex items-center gap-2 text-xs px-3 py-2 rounded-xl border",
                a.level === "danger"
                  ? "border-rose-500/30 bg-rose-500/5 text-rose-700"
                  : "border-amber-500/30 bg-amber-500/5 text-amber-700",
              )}
            >
              <AlertTriangle className="size-3.5 shrink-0" />
              <span className="font-medium">{a.message}</span>
            </div>
          ))}
        </div>
      )}

      {totalAlerts === 0 && (
        <div className="py-6 text-center text-xs text-muted-foreground select-none">
          🟢 Aucune alerte active. Système nominal.
        </div>
      )}

      {stale && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-700">
          <AlertTriangle className="size-3.5 shrink-0" />
          <span>Données indisponibles — dernière lecture affichée (rappel dans 10s).</span>
        </div>
      )}
    </div>
  )
}

export function AlertsPanel() {
  const [data, setData] = useState<AlertsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [stale, setStale] = useState(false)
  const [open, setOpen] = useState(false)
  const isMobile = useMediaQuery("(max-width: 767px)")
  const router = useRouter()

  const fetchData = useCallback(async () => {
    try {
      const [crRes, brokerRes, dlqRes] = await Promise.all([
        fetch("/api/admin/control-room", { cache: "no-store" }),
        fetch("/api/admin/broker?status=PENDING", { cache: "no-store" }),
        fetch("/api/admin/webhooks/dlq", { cache: "no-store" }),
      ])
      const cr = crRes.ok ? ((await crRes.json()) as AlertsData) : ({} as AlertsData)
      let brokerPending = 0
      if (brokerRes.ok) {
        const b = await brokerRes.json()
        brokerPending = b?.pagination?.total ?? b?.total ?? (Array.isArray(b?.docs) ? b.docs.length : 0)
      }
      let dlq = 0
      if (dlqRes.ok) {
        const d = await dlqRes.json()
        dlq = d?.total ?? d?.count ?? (Array.isArray(d) ? d.length : 0)
      }
      setData({
        ...cr,
        dangerZone: {
          bannedCount: cr.dangerZone?.bannedCount ?? 0,
          pendingRequests: cr.dangerZone?.pendingRequests ?? 0,
          pendingKyc: cr.dangerZone?.pendingKyc ?? 0,
        },
        kpis: {
          bounced: cr.kpis?.bounced ?? 0,
          complained: cr.kpis?.complained ?? 0,
          pendingKyc: cr.kpis?.pendingKyc ?? 0,
        },
        alerts: cr.alerts ?? [],
        webhookDlq: dlq,
        loginAnomalies: cr.loginAnomalies ?? 0,
        _brokerPending: brokerPending,
      } as AlertsData & { _brokerPending?: number })
      setStale(false)
    } catch {
      // échec réseau — on garde la dernière donnée connue mais on marque stale
      setStale(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const id = setInterval(fetchData, REFRESH_MS)
    return () => clearInterval(id)
  }, [fetchData])

  const alertCount =
    (data?.dangerZone?.pendingKyc ?? 0) +
    (data?._brokerPending ?? 0) +
    (data?.dangerZone?.pendingRequests ?? 0) +
    (data?.webhookDlq ?? 0) +
    (data?.loginAnomalies ?? 0) +
    (data ? (data.kpis?.bounced ?? 0) + (data.kpis?.complained ?? 0) : 0) +
    (data?.alerts?.length ?? 0)

  if (isMobile) {
    return (
      <BottomSheet open={open} onOpenChange={setOpen}>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-medium text-foreground active:scale-95 transition-transform"
        >
          <BellRing className="size-4" />
          Alertes
          {alertCount > 0 && (
            <span className="ml-0.5 inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">
              {alertCount > 9 ? "9+" : alertCount}
            </span>
          )}
        </button>
        <BottomSheetContent>
          <BottomSheetHeader title={`Alertes (${alertCount})`} onClose={() => setOpen(false)} />
          <div className="pt-1">
            <AlertsBody data={data} loading={loading} stale={stale} onNavigate={(href) => router.push(href)} />
          </div>
        </BottomSheetContent>
      </BottomSheet>
    )
  }

  return (
    <Card className="border-border bg-card/30 h-fit">
      <CardContent className="p-4">
        <AlertsBody data={data} loading={loading} stale={stale} onNavigate={(href) => router.push(href)} />
      </CardContent>
    </Card>
  )
}
