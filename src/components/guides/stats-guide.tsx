"use client"

import { useEffect } from "react"
import { driver } from "driver.js"
import "driver.js/dist/driver.css"
import { AnalyticsEvents } from "@nba/lib/analytics"

export function StatsGuide() {
  useEffect(() => {
    const seen = localStorage.getItem("nba:stats-guide")
    if (seen === "true") return

    // Ne déclencher que si l'utilisateur a déjà suffisamment de trades (5+)
    const minTrades = 5
    const count = parseInt(localStorage.getItem("nba:trade-count") || "0", 10)
    if (count < minTrades) return

    AnalyticsEvents.statsGuideSeen()

    // L'onglet Stats est le 2ème bouton de la barre d'onglets du journal
    const statsTab = document.querySelector('button:has([data-tab="stats"])') as HTMLElement | null
      || Array.from(document.querySelectorAll("button")).find((b) => b.textContent?.trim() === "Stats") as HTMLElement | null
    if (!statsTab) return

    const guide = driver({
      showButtons: ["next", "previous", "close"],
      steps: [
        {
          element: statsTab as HTMLElement,
          popover: {
            title: "Statistiques de trading",
            description:
              "Cet onglet affiche ton winrate, ton R:R moyen, ton PnL cumulé et l'évolution de ta performance dans le temps. Clique dessus pour explorer tes progrès.",
            side: "bottom",
            align: "start",
          },
        },
      ],
      onDestroyed: () => {
        localStorage.setItem("nba:stats-guide", "true")
      },
    })

    const timer = setTimeout(() => guide.drive(), 300)
    return () => clearTimeout(timer)
  }, [])

  return null
}
