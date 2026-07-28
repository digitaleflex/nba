"use client"

import { MessageSquare } from "lucide-react"
import Link from "next/link"
import { motion, useReducedMotion } from "motion/react"
import { useMessagingUnread } from "@nba/lib/messaging-unread"

export function MessageBadge() {
  const { unreadTotal } = useMessagingUnread()
  const reduce = useReducedMotion()

  return (
    <Link
      href="/dashboard/messages"
      className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
      title="Messages"
      aria-label={`Messages${unreadTotal > 0 ? ` (${unreadTotal} non lus)` : ""}`}
    >
      <MessageSquare className="size-4" />
      {unreadTotal > 0 && (
        <motion.span
          key={unreadTotal}
          initial={{ scale: reduce ? 1 : 1.5 }}
          animate={{ scale: 1 }}
          transition={reduce ? { duration: 0.001 } : { type: "spring", stiffness: 300, damping: 12 }}
          className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground leading-none"
        >
          {unreadTotal > 9 ? "9+" : unreadTotal}
        </motion.span>
      )}
    </Link>
  )
}
