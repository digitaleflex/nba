"use client"

import { useEffect } from "react"
import { driver } from "driver.js"
import "driver.js/dist/driver.css"

export function StatsGuide() {
  useEffect(() => {
    const seen = localStorage.getItem("nba:stats-guide")
    if (seen === "true") return

    const statsTab = document.querySelector('[role="tablist"] button:nth-child(2)')
    if (!statsTab) return

    const guide = driver({
      showButtons: ["next", "previous", "close"],
      steps: [
        {
          element: statsTab as HTMLElement,
          popover: {
            title: "Statistiques de trading",
            description:
              "L'onglet Stats affiche ton ratio winrate, R:R moyen, PnL cumulé, et l'évolution de ta performance dans le temps.",
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
