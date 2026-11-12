"use client"

import { useEffect, useState } from "react"
import { Page, PageHeader, Card, CardContent, Button } from "@nba/design-system"
import { Smartphone, Trash2, Send, Loader2 } from "lucide-react"
import { PushAlertsCard } from "@nba/components/push-alerts-card"

interface Device {
  id: string
  endpoint: string
  userAgent: string | null
  createdAt: string
}

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/push/devices")
      if (res.ok) {
        const data = await res.json()
        setDevices(data.devices ?? [])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  const remove = async (id: string) => {
    await fetch(`/api/push/devices?id=${id}`, { method: "DELETE" })
    setDevices((d) => d.filter((x) => x.id !== id))
  }

  const test = async () => {
    await fetch("/api/push/test", { method: "POST" })
  }

  return (
    <Page>
      <PageHeader title="Mes appareils d'alerte" description="Appareils abonnés aux notifications push." />
      <PushAlertsCard variant="full" />
      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="size-6 animate-spin" /></div>
      ) : devices.length === 0 ? (
        <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">Aucun appareil enregistré.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {devices.map((d) => (
            <Card key={d.id}>
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Smartphone className="size-5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{d.userAgent || "Appareil"}</p>
                    <p className="text-xs text-muted-foreground">Ajouté le {new Date(d.createdAt).toLocaleDateString("fr-FR")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => void test()}>
                    <Send className="size-3.5 mr-1.5" /> Tester
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => void remove(d.id)}>
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </Page>
  )
}
