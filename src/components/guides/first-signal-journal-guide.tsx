"use client"

import { useEffect, useState } from "react"
import { driver } from "driver.js"
import "driver.js/dist/driver.css"
import { AnalyticsEvents } from "@nba/lib/analytics"
import { createGuideConfig } from "@nba/lib/guide-config"

export function FirstSignalJournalGuide() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const seen = localStorage.getItem("nba:first-signal-guide")
    if (seen === "true") return

    localStorage.setItem("nba:first-signal-guide", "true")
    AnalyticsEvents.firstTradeGuideSeen()
    const timer = setTimeout(() => setReady(true), 800)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!ready) return

    const button = document.getElementById("journal-from-signal-btn")
    if (!button) return

    const guide = driver(
      createGuideConfig([
        {
          element: "#journal-from-signal-btn",
          popover: {
            title: "Tu as tradé ce signal ?",
            description:
              "Clique ici pour enregistrer ton trade dans le journal. Note tes résultats, ton état d'esprit, et suis ta progression au fil du temps. Les traders qui tiennent un journal progressent 2x plus vite.",
            side: "bottom",
            align: "start",
          },
        },
      ]),
    )

    const timer = setTimeout(() => guide.drive(), 500)
    return () => {
      clearTimeout(timer)
      guide.destroy()
    }
  }, [ready])

  return null
}
