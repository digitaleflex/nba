"use client"

import { useEffect, useState } from "react"
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import type L from "leaflet"

interface GeoEvent {
  id: string
  type: string
  severity: string
  latitude: number
  longitude: number
  country: string | null
  city: string | null
  ipAddress: string | null
  createdAt: string
  user: { email: string } | null
}

interface FraudMapInnerProps {
  events: GeoEvent[]
}

const dotColors: Record<string, string> = {
  CRITICAL: "#ef4444",
  HIGH: "#f97316",
  MEDIUM: "#f59e0b",
  LOW: "#10b981",
}

export default function FraudMapInner({ events }: FraudMapInnerProps) {
  const [leaflet, setLeaflet] = useState<typeof L | null>(null)

  useEffect(() => {
    import("leaflet").then((m) => setLeaflet(m.default ?? m))
  }, [])

  if (!leaflet) return <div className="flex items-center justify-center h-full"><span className="text-xs text-muted-foreground">Chargement de la carte...</span></div>

  return (
    <MapContainer center={[20, 0]} zoom={2} scrollWheelZoom={false} className="h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://openstreetmap.org/copyright">OSM</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {events.map((e) => (
        <Marker
          key={e.id}
          position={[e.latitude, e.longitude]}
          icon={leaflet.divIcon({
            className: "bg-transparent",
            html: `<div style="width:12px;height:12px;border-radius:50%;background:${dotColors[e.severity] ?? "#6b7280"};border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.3)"></div>`,
            iconSize: [12, 12],
            iconAnchor: [6, 6],
          })}
        >
          <Popup>
            <div className="text-xs font-sans min-w-[140px]">
              <p className="font-bold mb-1">{e.type}</p>
              <p className="mb-0.5">{e.severity} &mdash; {e.country ?? "?"}{e.city ? `, ${e.city}` : ""}</p>
              <p className="text-gray-500 mb-0.5">{e.ipAddress}</p>
              {e.user && <p className="text-gray-500">{e.user.email}</p>}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
