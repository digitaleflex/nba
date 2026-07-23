"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import SwaggerUI from "swagger-ui-react"
import "swagger-ui-react/swagger-ui.css"

export default function ApiDocsPage() {
  const router = useRouter()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [spec, setSpec] = useState<any>(null)
  const [unauthorized, setUnauthorized] = useState(false)

  useEffect(() => {
    fetch("/api/docs/openapi.json")
      .then(r => {
        if (r.status === 401 || r.status === 403) { setUnauthorized(true); return null }
        return r.json()
      })
      .then(data => { if (data) setSpec(data) })
      .catch(() => {})
  }, [])

  if (unauthorized) {
    router.replace("/dashboard")
    return null
  }

  if (!spec) return <div className="flex items-center justify-center min-h-screen"><p className="text-muted-foreground">Chargement...</p></div>

  return (
    <div className="min-h-screen bg-background">
      <SwaggerUI spec={spec} />
    </div>
  )
}
