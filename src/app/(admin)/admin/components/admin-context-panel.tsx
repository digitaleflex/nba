"use client"

import { useEffect, useState } from "react"
import { X, ExternalLink } from "lucide-react"
import { cn } from "@nba/design-system"
import { UserPanelContent } from "./user-panel-content"
import { KycPanelContent } from "./kyc-panel-content"
import { BrokerPanelContent } from "./broker-panel-content"
import { SignalPanelContent } from "./signal-panel-content"

interface AdminContextPanelProps {
  isOpen: boolean
  onClose: () => void
  title: string
  type: "user" | "kyc" | "broker" | "signal" | null
  data: any
  onAction?: (actionType: string, extraData?: any) => Promise<void>
}

export function AdminContextPanel({
  isOpen,
  onClose,
  title,
  type,
  data,
  onAction,
}: AdminContextPanelProps) {
  const [zoomedImage, setZoomedImage] = useState<string | null>(null)

  // Verrouiller le scroll de la page quand ouvert
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  // Gérer la touche Escape pour fermer
  useEffect(() => {
    if (!isOpen) return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [isOpen, onClose])

  if (!isOpen || !type || !data) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-neutral-950/20 dark:bg-neutral-950/40 backdrop-blur-xs select-none">
      {/* Overlay invisible pour fermer */}
      <div className="flex-1" onClick={onClose} />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "w-full max-w-md h-full bg-card text-card-foreground border-l border-neutral-200/60 dark:border-neutral-800/60 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200"
        )}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200/60 dark:border-neutral-800/60 flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-foreground">{title}</h3>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{type}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors cursor-pointer"
            aria-label="Fermer le panneau"
          >
            <X className="size-4.5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {type === "user" && (
            <UserPanelContent data={data} onAction={onAction} />
          )}

          {type === "kyc" && (
            <KycPanelContent data={data} onAction={onAction} onZoomImage={setZoomedImage} />
          )}

          {type === "broker" && (
            <BrokerPanelContent data={data} onAction={onAction} />
          )}

          {type === "signal" && (
            <SignalPanelContent data={data} onZoomImage={setZoomedImage} />
          )}
        </div>
      </div>

      {/* Visionneuse plein écran de photo zoomée */}
      {zoomedImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in duration-200 select-none"
          onClick={() => setZoomedImage(null)}
        >
          <div className="absolute top-4 right-4 flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
            <a
              href={zoomedImage}
              target="_blank"
              rel="noopener noreferrer"
              className="h-9 px-3 rounded-xl bg-neutral-900/80 border border-neutral-800 text-white flex items-center gap-1.5 text-xs font-bold hover:bg-neutral-850 transition-colors cursor-pointer"
            >
              <ExternalLink className="size-4" />
              Ouvrir dans un onglet
            </a>
            <button
              onClick={() => setZoomedImage(null)}
              className="size-9 rounded-xl bg-neutral-900/80 border border-neutral-800 text-white flex items-center justify-center hover:bg-neutral-850 transition-colors cursor-pointer"
            >
              <X className="size-5" />
            </button>
          </div>
          <div className="max-w-4xl max-h-[85vh] p-2" onClick={(e) => e.stopPropagation()}>
            <img 
              src={zoomedImage} 
              alt="Document KYC Zoom" 
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl border border-neutral-800 animate-in zoom-in-95 duration-200" 
            />
          </div>
        </div>
      )}
    </div>
  )
}
