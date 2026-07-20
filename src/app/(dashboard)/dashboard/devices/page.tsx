"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, Button, Input, Badge } from "@nba/design-system"
import { useConfirm } from "@nba/components/confirm-dialog"
import { toast } from "sonner"
import {
  MonitorSmartphone,
  Loader2,
  Trash2,
  Pencil,
  Check,
  X,
  ShieldCheck,
  ShieldOff,
  KeyRound,
} from "lucide-react"

interface Device {
  id: string
  name: string | null
  fingerprint: string
  ipAddress: string | null
  userAgent: string | null
  lastSeenAt: string
  trusted: boolean
  createdAt: string
  updatedAt: string
}

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [busy, setBusy] = useState(false)
  const { confirm, node } = useConfirm()

  const fetchDevices = async () => {
    try {
      const res = await fetch("/api/dashboard/devices")
      if (!res.ok) throw new Error("Erreur")
      const data = await res.json()
      setDevices(Array.isArray(data) ? data : [])
    } catch {
      toast.error("Impossible de charger les appareils")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDevices()
  }, [])

  const startRename = (device: Device) => {
    setEditingId(device.id)
    setEditName(device.name ?? "")
  }

  const cancelRename = () => {
    setEditingId(null)
    setEditName("")
  }

  const saveRename = async (deviceId: string) => {
    setBusy(true)
    try {
      const res = await fetch("/api/dashboard/devices", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId, name: editName }),
      })
      if (!res.ok) throw new Error("Erreur")
      toast.success("Appareil renommé")
      cancelRename()
      await fetchDevices()
    } catch {
      toast.error("Échec du renommage")
    } finally {
      setBusy(false)
    }
  }

  const revoke = (deviceId: string) => {
    confirm({
      title: "Révoquer cet appareil ?",
      description: "Il sera déconnecté immédiatement.",
      confirmLabel: "Révoquer",
      onConfirm: async () => {
        setBusy(true)
        try {
          const res = await fetch("/api/dashboard/devices", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ deviceId }),
          })
          if (!res.ok) throw new Error("Erreur")
          toast.success("Appareil révoqué")
          await fetchDevices()
        } catch {
          toast.error("Échec de la révocation")
        } finally {
          setBusy(false)
        }
      },
    })
  }

  const revokeOthers = () => {
    confirm({
      title: "Révoquer TOUS les autres appareils ?",
      description: "Cette action est irréversible.",
      confirmLabel: "Tout révoquer",
      onConfirm: async () => {
        setBusy(true)
        try {
          const res = await fetch("/api/dashboard/devices", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ revokeOthers: true }),
          })
          if (!res.ok) throw new Error("Erreur")
          toast.success("Les autres appareils ont été révoqués")
          await fetchDevices()
        } catch {
          toast.error("Échec de la révocation")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <MonitorSmartphone className="size-6 text-primary" />
            Mes appareils
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gérez les appareils connectés à votre compte.
          </p>
        </div>
        {devices.length > 1 && (
          <Button
            variant="outline"
            size="sm"
            onClick={revokeOthers}
            disabled={busy}
            className="text-destructive hover:text-destructive"
          >
            <ShieldOff className="size-4" />
            Révoquer tous les autres appareils
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-2 rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span>
          Un nouvel appareil ? Saisissez le code de vérification reçu par email.
        </span>
        <Button
          variant="secondary"
          size="sm"
          render={<Link href="/dashboard/verify-device" />}
        >
          <KeyRound className="size-4" />
          Saisir un code de vérification d&apos;appareil
        </Button>
      </div>

      {loading ? (
        <div
          className="flex h-[40vh] items-center justify-center"
          role="status"
          aria-label="Chargement en cours"
        >
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : devices.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <MonitorSmartphone className="size-10 text-muted-foreground/60" />
            <p className="font-semibold text-foreground">
              Aucun appareil enregistré
            </p>
            <p className="text-sm text-muted-foreground">
              Vos appareils apparaîtront ici une fois vérifiés.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {devices.map((device) => (
            <Card key={device.id}>
              <CardContent className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1 space-y-1.5">
                  {editingId === device.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Nom de l'appareil"
                        className="max-w-xs"
                        autoFocus
                      />
                      <Button
                        size="icon-sm"
                        onClick={() => saveRename(device.id)}
                        disabled={busy}
                        aria-label="Enregistrer"
                      >
                        <Check className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={cancelRename}
                        disabled={busy}
                        aria-label="Annuler"
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground truncate">
                        {device.name || "Appareil"}
                      </span>
                      {device.trusted ? (
                        <Badge variant="default" className="bg-emerald-600 text-white">
                          <ShieldCheck className="size-3" />
                          De confiance
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Non approuvé</Badge>
                      )}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground truncate">
                    {device.userAgent || "Agent inconnu"}
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>IP : {device.ipAddress || "inconnue"}</span>
                    <span>
                      Vu le{" "}
                      {new Date(device.lastSeenAt).toLocaleString("fr-FR")}
                    </span>
                  </div>
                </div>

                {editingId !== device.id && (
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startRename(device)}
                      disabled={busy}
                    >
                      <Pencil className="size-4" />
                      Renommer
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => revoke(device.id)}
                      disabled={busy}
                    >
                      <Trash2 className="size-4" />
                      Révoquer
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {node}
    </div>
  )
}
