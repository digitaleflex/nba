"use client"

import { useEffect, useState } from "react"
import { driver } from "driver.js"
import "driver.js/dist/driver.css"
import { AnalyticsEvents } from "@nba/lib/analytics"
import { createGuideConfig } from "@nba/lib/guide-config"

export function ReflectionGuide() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const seen = localStorage.getItem("nba:reflection-guide")
    if (seen === "true") return
    AnalyticsEvents.reflectionGuideSeen()
    const timer = setTimeout(() => setReady(true), 500)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!ready) return

    const form = document.getElementById("reflection-form")
    if (!form) return

    const guide = driver(
      createGuideConfig([
        {
          element: "#reflection-form",
          popover: {
            title: "Ton journal de réflexion",
            description:
              "Note chaque jour ta journée de trading : ta note sur 10, ton émotion dominante et une pensée libre. Ces repères aident à repérer tes biais et progresser.",
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
