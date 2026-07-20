"use client"

import { useEffect, useState } from "react"
import { driver } from "driver.js"
import "driver.js/dist/driver.css"
import { AnalyticsEvents } from "@nba/lib/analytics"
import { createGuideConfig } from "@nba/lib/guide-config"

export function FirstTradeGuide() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const seen = localStorage.getItem("nba:first-trade-guide")
    if (seen === "true") return
    AnalyticsEvents.firstTradeGuideSeen()
    const timer = setTimeout(() => setReady(true), 500)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!ready) return

    const newTradeBtn = document.getElementById("new-trade-btn")
    if (!newTradeBtn) return

    const guide = driver(
      createGuideConfig([
        {
          element: "#new-trade-btn",
          popover: {
            title: "Créer ton premier trade",
            description:
              "Clique ici pour ouvrir le formulaire et enregistrer ton premier trade. Note la paire, la direction, et les prix.",
            side: "bottom",
            align: "start",
          },
        },
      ]),
    )

    const timer = setTimeout(() => guide.drive(), 300)
    return () => {
      clearTimeout(timer)
      guide.destroy()
    }
  }, [ready])

  return null
}
