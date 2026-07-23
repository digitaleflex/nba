"use client"

import { useEffect, useState, useRef } from "react"
import { X, ExternalLink, ChevronLeft } from "lucide-react"
import { cn } from "@nba/design-system"
import { UserPanelContent } from "./user-panel-content"
import { KycPanelContent } from "./kyc-panel-content"
import { BrokerPanelContent } from "./broker-panel-content"
import { SignalPanelContent } from "./signal-panel-content"
import { useResponsivePanel } from "../hooks/use-responsive-panel"

interface AdminContextPanelProps {
  isOpen: boolean
  onClose: () => void
  title: string
  type: "user" | "kyc" | "broker" | "signal" | null
  data: any
  /** Libellé du contexte parent pour le breadcrumb mobile (ex: "Membres"). */
  breadcrumb?: string
  onAction?: (actionType: string, extraData?: any) => Promise<void>
}

export function AdminContextPanel({
  isOpen,
  onClose,
  title,
  type,
  data,
  breadcrumb,
  onAction,
}: AdminContextPanelProps) {
  const [zoomedImage, setZoomedImage] = useState<string | null>(null)
  const variant = useResponsivePanel()
  const isFullscreen = variant === "fullscreen"
  const panelRef = useRef<HTMLDivElement>(null)
  const previousFocus = useRef<HTMLElement | null>(null)

  // Verrouiller le scroll de la page quand ouvert — uniquement desktop
  // (sur mobile le push plein écran gère nativement le scroll)
  useEffect(() => {
    if (isOpen && !isFullscreen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen, isFullscreen])

  // Gérer la touche Escape pour fermer
  useEffect(() => {
    if (!isOpen) return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [isOpen, onClose])

  // Focus management : capture le focus précédent, place le focus initial dans
  // le panneau à l'ouverture, piège Tab dans le panneau, et le restaure à la fermeture.
  useEffect(() => {
    if (!isOpen) return
    previousFocus.current = document.activeElement as HTMLElement | null
    const panel = panelRef.current
    const focusable = () =>
      panel
        ? Array.from(
            panel.querySelectorAll<HTMLElement>(
              'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
            ),
          ).filter((el) => el.offsetParent !== null)
        : []
    // focus initial sur le premier élément focusable (ou le panneau lui-même)
    const first = focusable()[0]
    ;(first ?? panel)?.focus()

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return
      const items = focusable()
      if (items.length === 0) {
        e.preventDefault()
        panel?.focus()
        return
      }
      const firstEl = items[0]
      const lastEl = items[items.length - 1]
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault()
        lastEl.focus()
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault()
        firstEl.focus()
      }
    }
    document.addEventListener("keydown", handleTab)
    return () => {
      document.removeEventListener("keydown", handleTab)
      previousFocus.current?.focus?.()
    }
  }, [isOpen])

  if (!isOpen || !type || !data) return null

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex justify-end select-none",
        isFullscreen
          ? "bg-neutral-950/60 backdrop-blur-none"
          : "bg-neutral-950/20 dark:bg-neutral-950/40 backdrop-blur-xs"
      )}
    >
      {/* Overlay invisible pour fermer (desktop uniquement) */}
      {!isFullscreen && <div className="flex-1" onClick={onClose} />}

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={cn(
          "h-full bg-card text-card-foreground border-l border-neutral-200/60 dark:border-neutral-800/60 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200",
          isFullscreen ? "w-full max-w-full" : "w-full max-w-md"
        )}
      >
        {/* Header */}
        <div
          className={cn(
            "border-b border-neutral-200/60 dark:border-neutral-800/60 flex items-center justify-between",
            isFullscreen ? "px-4 py-3" : "px-6 py-4"
          )}
        >
          <div className="space-y-0.5 min-w-0">
            {isFullscreen && breadcrumb && (
              <button
                onClick={onClose}
                className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer mb-0.5"
              >
                <ChevronLeft className="size-3.5" />
                {breadcrumb}
              </button>
            )}
            <h3 className={cn("font-bold text-foreground truncate", isFullscreen ? "text-base" : "text-sm")}>
              {title}
            </h3>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{type}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors cursor-pointer shrink-0"
            aria-label="Fermer le panneau"
          >
            <X className="size-4.5" />
          </button>
        </div>

        {/* Content Area */}
        <div className={cn("flex-1 overflow-y-auto space-y-6 text-xs", isFullscreen ? "p-4" : "p-6")}>
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
              aria-label="Fermer"
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
