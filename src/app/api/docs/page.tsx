"use client"

import { useEffect, useState } from "react"
import SwaggerUI from "swagger-ui-react"
import "swagger-ui-react/swagger-ui.css"

export default function ApiDocsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [spec, setSpec] = useState<any>(null)

  useEffect(() => {
    fetch("/api/docs/openapi.json")
      .then(r => r.json())
      .then(setSpec)
      .catch(() => {})
  }, [])

  if (!spec) return <div className="flex items-center justify-center min-h-screen"><p className="text-muted-foreground">Chargement...</p></div>

  return (
    <div className="min-h-screen bg-background">
      <SwaggerUI spec={spec} />
    </div>
  )
}
