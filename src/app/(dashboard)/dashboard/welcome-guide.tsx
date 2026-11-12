"use client"

import { useEffect, useState } from "react"
import { driver } from "driver.js"
import "driver.js/dist/driver.css"
import { AnalyticsEvents } from "@nba/lib/analytics"
import { createGuideConfig } from "@nba/lib/guide-config"

export function WelcomeGuide() {
  const [seen] = useState(() => {
    if (typeof window === "undefined") return false
    return localStorage.getItem("nba:welcome-guide") === "true"
  })

  useEffect(() => {
    if (seen) return
    AnalyticsEvents.welcomeGuideSeen()

    const guide = driver(
      createGuideConfig(
        [
          {
            element: "#signals",
            popover: {
              title: "Signaux en direct",
              description:
                "Reçois en temps réel les signaux de trading de tes groupes. Chaque signal est analysé et publié par l'équipe et suivi en temps réel.",
              side: "right",
              align: "start",
            },
          },
          {
            element: "#journal",
            popover: {
              title: "Journal de trading",
              description:
                "Enregistre chaque trade, suis tes performances et analyse tes décisions pour progresser.",
              side: "right",
              align: "start",
            },
          },
          {
            element: "#support",
            popover: {
              title: "Support & Messages",
              description:
                "Contacte notre équipe support et suis l'état de tes demandes.",
              side: "right",
              align: "start",
            },
          },
          {
            element: "#profile-nav",
            popover: {
              title: "Ton profil",
              description:
                "Personnalise ton profil, gère ton abonnement et suis ta progression.",
              side: "bottom",
              align: "start",
            },
          },
        ],
        {
          onDestroyed: () => {
            localStorage.setItem("nba:welcome-guide", "true")
          },
        },
      ),
    )

    const timer = setTimeout(() => guide.drive(), 800)
    return () => {
      clearTimeout(timer)
      guide.destroy()
    }
  }, [seen])

  if (seen) return null
  return null
}