"use client"

import { useEffect, useState } from "react"
import { WifiOff, Wifi } from "lucide-react"

export function OfflineBanner() {
  const [online, setOnline] = useState(true)
  const [show, setShow] = useState(false)

  useEffect(() => {
    const onOnline = () => {
      setOnline(true)
      setShow(true)
      setTimeout(() => setShow(false), 4000)
    }
    const onOffline = () => {
      setOnline(false)
      setShow(true)
    }
    window.addEventListener("online", onOnline)
    window.addEventListener("offline", onOffline)
    return () => {
      window.removeEventListener("online", onOnline)
      window.removeEventListener("offline", onOffline)
    }
  }, [])

  if (!show) return null

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[60] px-4 py-2 text-center text-sm font-medium transition-all duration-300 ${
        online
          ? "bg-green-500/10 text-green-600 dark:text-green-400"
          : "bg-destructive/10 text-destructive"
      }`}
      role="alert"
    >
      <span className="inline-flex items-center gap-2">
        {online ? <Wifi className="size-4" /> : <WifiOff className="size-4" />}
        {online ? "Connexion rétablie" : "Vous êtes hors ligne — certaines fonctionnalités peuvent être limitées"}
      </span>
    </div>
  )
}
