"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Bell, Loader2, CheckCheck, Clock } from "lucide-react";
import Link from "next/link";

interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  readAt: string | null;
  data: { linkUrl?: string } | null;
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

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState<
    Notification[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/notifications?limit=5");
      if (!res.ok) throw new Error("Erreur");
      const data = await res.json();
      setRecentNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {
      // silencieux
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

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
        title="Notifications"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} non lues)` : ""}`}
      >
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border bg-popover text-popover-foreground shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <span className="text-sm font-semibold">Notifications</span>
            <Link
              href="/dashboard/notifications"
              onClick={() => setOpen(false)}
              className="text-xs text-primary hover:underline"
            >
              Voir tout
            </Link>
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
              recentNotifications.map((n) => (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/30 ${
                    !n.readAt ? "bg-primary/[0.02]" : ""
                  }`}
                >
                  {!n.readAt && (
                    <span className="size-2 rounded-full bg-primary shrink-0 mt-1.5" />
                  )}
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
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
