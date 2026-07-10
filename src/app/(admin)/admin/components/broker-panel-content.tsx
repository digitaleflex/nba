"use client"

import { useState } from "react"
import { Check, Ban } from "lucide-react"
import { Button, Badge, cn } from "@nba/design-system"

interface BrokerPanelContentProps {
  data: any
  onAction?: (actionType: string, extraData?: any) => void
}

export function BrokerPanelContent({ data, onAction }: BrokerPanelContentProps) {
  const [notes, setNotes] = useState("")
  return (
    <div className="space-y-6 text-xs">
      <div className="space-y-2">
        <span className="text-[10px] text-muted-foreground uppercase">Utilisateur associé</span>
        <h4 className="text-sm font-bold text-foreground">{data.user?.name}</h4>
        <p className="text-muted-foreground">{data.user?.email}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 border-t border-b py-4">
        <div>
          <span className="text-[10px] text-muted-foreground uppercase">Broker</span>
          <p className="font-semibold text-foreground mt-0.5">{data.brokerName}</p>
        </div>
        <div>
          <span className="text-[10px] text-muted-foreground uppercase">Compte Broker</span>
          <p className="font-semibold text-foreground mt-0.5">{data.accountId}</p>
        </div>
        <div>
          <span className="text-[10px] text-muted-foreground uppercase">Statut</span>
          <div className="mt-0.5">
            <Badge
              variant="outline"
              className={cn(
                data.status === "APPROVED" && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                data.status === "REJECTED" && "bg-rose-500/10 text-rose-400 border-rose-500/20",
                data.status === "PENDING" && "bg-amber-500/10 text-amber-400 border-amber-500/20"
              )}
            >
              {data.status}
            </Badge>
          </div>
        </div>
        <div>
          <span className="text-[10px] text-muted-foreground uppercase">Soumis le</span>
          <p className="font-semibold text-foreground mt-0.5">
            {new Date(data.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Vidéo de preuve */}
      <div className="space-y-3">
        <h5 className="font-bold text-foreground">Vidéo justificative</h5>
        {data.videoUrl || data.videoFilePath ? (
          <div className="border rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center">
            <video src={data.videoUrl || data.videoFilePath} controls className="w-full h-full object-contain" />
          </div>
        ) : (
          <div className="py-6 text-center border border-dashed rounded-xl text-muted-foreground">
            Aucune vidéo de preuve disponible.
          </div>
        )}
      </div>

      {onAction && data.status === "PENDING" && (
        <div className="space-y-2 border-t pt-4">
          <span className="text-[10px] text-muted-foreground uppercase">Validation</span>
          <textarea
            placeholder="Justification (obligatoire pour un refus)..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
          <div className="flex gap-2">
            <Button
              variant="default"
              size="sm"
              className="w-full gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white border-0"
              onClick={() => onAction("broker_approve", { id: data.id, notes })}
            >
              <Check className="size-3.5" /> Valider le Broker
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="w-full gap-1.5"
              disabled={!notes.trim()}
              onClick={() => onAction("broker_reject", { id: data.id, notes: notes || "Refusé" })}
            >
              <Ban className="size-3.5" /> Refuser
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
