"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Bell, Loader2, CheckCheck, Clock, Wifi, WifiOff } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useSocket } from "@nba/lib/hooks/use-socket";
import { useNotificationSound } from "@nba/lib/hooks/use-notification-sound";

interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  readAt: string | null;
  data: {
    linkUrl?: string;
    signalId?: string;
    imageUrl?: string | null;
    imageUrls?: string[] | null;
  } | null;
  createdAt: string;
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days}j`;
}

function getThumbnail(notif: Notification): string | null {
  if (!notif.data) return null
  if (notif.data.imageUrl) return `/api/files/${notif.data.imageUrl}`
  if (Array.isArray(notif.data.imageUrls) && notif.data.imageUrls.length > 0) {
    return `/api/files/${notif.data.imageUrls[0]}`
  }
  return null
}

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState<
    Notification[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const lastTopIdRef = useRef<string | null>(null);
  const wsActiveRef = useRef(false);
  const cacheRef = useRef<{ time: number; data: { notifications: Notification[]; unreadCount: number } } | null>(null);

  const { play: playSound, changeSound } = useNotificationSound()

  // ── WebSocket : notifs temps réel ──
  const { status: wsStatus } = useSocket({
    onNotification: (raw) => {
      const n = raw as Notification
      wsActiveRef.current = true
      // Vérifier qu'on n'a pas déjà cette notif
      if (lastTopIdRef.current && lastTopIdRef.current === n.id) return
      lastTopIdRef.current = n.id

      setRecentNotifications((prev) => {
        if (prev.some((p) => p.id === n.id)) return prev
        return [n, ...prev].slice(0, 5)
      })
      if (cacheRef.current) cacheRef.current = null
      setUnreadCount((c) => c + 1)
      playSound()
      toast(n.title, {
        description: n.body,
        duration: 5000,
        action: n.data?.linkUrl
          ? { label: "Voir", onClick: () => window.open(n.data!.linkUrl, "_blank") }
          : undefined,
      })
    },
    onDisconnect: () => {
      wsActiveRef.current = false
    },
  })

  // ── Fetch initial + fallback polling si WS déconnecté ──
  const fetchData = useCallback(async (silent = false) => {
    const now = Date.now()
    if (cacheRef.current && now - cacheRef.current.time < 5000) {
      const cached = cacheRef.current.data
      setRecentNotifications(cached.notifications)
      setUnreadCount(cached.unreadCount)
      setLoading(false)
      return
    }
    try {
      const res = await fetch("/api/dashboard/notifications?limit=5");
      if (!res.ok) throw new Error("Erreur");
      const data = await res.json();
      cacheRef.current = { time: now, data: { notifications: data.notifications, unreadCount: data.unreadCount } }
      const prevTop = lastTopIdRef.current
      const topId = data.notifications[0]?.id ?? null
      if (topId) lastTopIdRef.current = topId

      setRecentNotifications(data.notifications);

      if (
        !silent &&
        !wsActiveRef.current &&
        data.unreadCount > unreadCount &&
        prevTop &&
        topId !== prevTop
      ) {
        playSound()
        const newNotif = data.notifications[0]
        if (newNotif) {
          toast(newNotif.title, {
            description: newNotif.body,
            duration: 5000,
            action: newNotif.data?.linkUrl
              ? { label: "Voir", onClick: () => window.open(newNotif.data!.linkUrl, "_blank") }
              : undefined,
          })
        }
      }
      setUnreadCount(data.unreadCount);
    } catch {
      // silencieux
    } finally {
      setLoading(false);
    }
  }, [unreadCount]);

  // Fetch initial au mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData()
  }, [fetchData])

  // Polling fallback UNIQUEMENT si WebSocket déconnecté
  useEffect(() => {
    if (wsStatus === "connected") return
    const interval = setInterval(() => fetchData(true), 30000)
    return () => clearInterval(interval)
  }, [wsStatus, fetchData])

  // Click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function markAsRead(id: string) {
    try {
      await fetch(`/api/dashboard/notifications/${id}`, { method: "PUT" });
      setRecentNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, readAt: new Date().toISOString() } : n,
        ),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {}
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
        title={
          wsStatus === "connected"
            ? "Notifications (temps réel actif)"
            : "Notifications (polling de secours)"
        }
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} non lues)` : ""}`}
      >
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
        {/* Indicateur de connexion WS (dot dans le coin) */}
        {wsStatus === "connected" ? (
          <span
            className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full bg-emerald-500 ring-2 ring-background"
            aria-hidden="true"
          />
        ) : wsStatus === "connecting" ? (
          <span
            className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full bg-amber-500 ring-2 ring-background animate-pulse"
            aria-hidden="true"
          />
        ) : (
          <span
            className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full bg-muted ring-2 ring-background"
            aria-hidden="true"
          />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border bg-popover text-popover-foreground shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <span className="text-sm font-semibold">Notifications</span>
            <div className="flex items-center gap-3">
              {wsStatus === "connected" ? (
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1" title="Notifications en temps réel">
                  <Wifi className="size-3" />
                  live
                </span>
              ) : (
                <span className="text-[10px] text-muted-foreground flex items-center gap-1" title="Fallback polling 30s">
                  <WifiOff className="size-3" />
                  polling
                </span>
              )}
              <Link
                href="/dashboard/notifications"
                onClick={() => setOpen(false)}
                className="text-xs text-primary hover:underline"
              >
                Voir tout
              </Link>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : recentNotifications.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Aucune notification
              </div>
            ) : (
              recentNotifications.map((n) => {
                const thumb = getThumbnail(n)
                return (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/30 ${
                      !n.readAt ? "bg-primary/[0.02]" : ""
                    }`}
                  >
                    {!n.readAt && (
                      <span className="size-2 rounded-full bg-primary shrink-0 mt-1.5" />
                    )}
                    {thumb ? (
                      <div className="relative w-12 h-12 rounded-md overflow-hidden border border-border/60 bg-muted shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={thumb}
                          alt=""
                          loading="lazy"
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      </div>
                    ) : null}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p
                          className={`text-sm font-medium truncate ${
                            !n.readAt
                              ? "text-foreground"
                              : "text-muted-foreground"
                          }`}
                        >
                          {n.title}
                        </p>
                        <span className="text-xs text-muted-foreground shrink-0 flex items-center gap-1">
                          <Clock className="size-3" />
                          {formatTimeAgo(n.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {n.body}
                      </p>
                      {!n.readAt && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(n.id);
                          }}
                          className="text-xs text-primary hover:underline mt-1 inline-flex items-center gap-1"
                        >
                          <CheckCheck className="size-3" />
                          Marquer comme lue
                        </button>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
