"use client"

import { useEffect } from "react"
import { driver } from "driver.js"
import "driver.js/dist/driver.css"

export function WelcomeGuide() {
  useEffect(() => {
    const seen = localStorage.getItem("nba:welcome-guide")
    if (seen === "true") return

    const guide = driver({
      showButtons: ["next", "previous", "close"],
      steps: [
        {
          element: "#signals",
          popover: {
            title: "Signaux en direct",
            description:
              "Recevez en temps réel les signaux de trading de vos groupes. Chaque signal est analysé et noté par la communauté.",
            side: "right",
            align: "start",
          },
        },
        {
          element: "#journal",
          popover: {
            title: "Journal de trading",
            description:
              "Enregistrez chaque trade, suivez vos performances et analysez vos décisions pour progresser.",
            side: "right",
            align: "start",
          },
        },
        {
          element: "#support",
          popover: {
            title: "Support & Messages",
            description:
              "Contactez notre équipe support et suivez l'état de vos demandes.",
            side: "right",
            align: "start",
          },
        },
        {
          element: "#profile-nav",
          popover: {
            title: "Votre profil",
            description:
              "Personnalisez votre profil, gérez votre abonnement et suivez votre progression.",
            side: "bottom",
            align: "start",
          },
        },
      ],
      onDestroyed: () => {
        localStorage.setItem("nba:welcome-guide", "true")
      },
    })

    const timer = setTimeout(() => guide.drive(), 800)
    return () => clearTimeout(timer)
  }, [])

  return null
}
