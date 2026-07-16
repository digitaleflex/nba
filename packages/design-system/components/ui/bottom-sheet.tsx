"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { X } from "lucide-react"

import { cn } from "../../lib/utils"
import { useIsMobile } from "../../hooks/use-is-mobile"
import { Button } from "./button"

/**
 * BottomSheet — modal tactile-first qui s'affiche :
 *  - Mobile : plein écran avec un drag handle et animation slide-up
 *  - Desktop : centré avec animation zoom-in (fallback Dialog classique)
 */
function BottomSheet({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="bottom-sheet" {...props} />
}

function BottomSheetTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="bottom-sheet-trigger" {...props} />
}

function BottomSheetClose({ ...props }: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="bottom-sheet-close" {...props} />
}

function BottomSheetPortal({ ...props }: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal data-slot="bottom-sheet-portal" {...props} />
}

function BottomSheetOverlay({
  className,
  ...props
}: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="bottom-sheet-overlay"
      className={cn(
        "fixed inset-0 isolate z-50 bg-black/40 supports-backdrop-filter:backdrop-blur-xs",
        "data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className
      )}
      {...props}
    />
  )
}

interface BottomSheetContentProps extends DialogPrimitive.Popup.Props {
  /** Titre affiché en haut (rendu avant children) */
  title?: string
  /** Description affichée sous le titre */
  description?: string
  /** Afficher le bouton de fermeture X */
  showCloseButton?: boolean
  /** Hauteur max en mobile (CSS, ex: "90dvh") */
  maxHeight?: string
  /** Hauteur initiale en mobile (CSS, ex: "60dvh") */
  defaultHeight?: string
}

function BottomSheetContent({
  className,
  children,
  title,
  description,
  showCloseButton = true,
  maxHeight = "92dvh",
  defaultHeight = "auto",
  ...props
}: BottomSheetContentProps) {
  const isMobile = useIsMobile()
  const [dragStart, setDragStart] = React.useState<number | null>(null)
  const [dragOffset, setDragOffset] = React.useState(0)
  const sheetRef = React.useRef<HTMLDivElement>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobile) return
    setDragStart(e.touches[0].clientY)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isMobile || dragStart === null) return
    const offset = Math.max(0, e.touches[0].clientY - dragStart)
    setDragOffset(offset)
  }

  const handleTouchEnd = () => {
    if (!isMobile) return
    if (dragOffset > 120) {
      // Dismiss si on a dragué de plus de 120px
      const closeBtn = sheetRef.current?.querySelector<HTMLElement>('[data-slot="bottom-sheet-close"]')
      closeBtn?.click()
    }
    setDragStart(null)
    setDragOffset(0)
  }

  return (
    <BottomSheetPortal>
      <BottomSheetOverlay />
      <DialogPrimitive.Popup
        ref={sheetRef}
        data-slot="bottom-sheet-content"
        className={cn(
          // Mobile : bas de l'écran, slide-up, plein largeur, max-height
          "fixed inset-x-0 bottom-0 z-50 flex flex-col bg-popover text-popover-foreground shadow-2xl",
          "rounded-t-2xl border-t outline-none",
          "data-open:animate-in data-open:slide-in-from-bottom-full data-open:fade-in-0",
          "data-closed:animate-out data-closed:slide-out-to-bottom-full data-closed:fade-out-0",
          // Desktop : centré
          "md:inset-auto md:left-1/2 md:top-1/2 md:bottom-auto md:right-auto md:max-w-md md:-translate-x-1/2 md:-translate-y-1/2",
          "md:rounded-xl md:border md:p-0 md:max-h-[85vh]",
          "md:data-open:slide-in-from-bottom-0 md:data-open:zoom-in-95",
          "md:data-closed:slide-out-to-bottom-0 md:data-closed:zoom-out-95",
          className
        )}
        style={
          isMobile
            ? {
                maxHeight,
                ...(defaultHeight !== "auto" ? { height: defaultHeight } : {}),
                ...(dragOffset > 0
                  ? { transform: `translateY(${dragOffset}px)`, transition: dragStart === null ? "transform 200ms" : "none" }
                  : {}),
              }
            : undefined
        }
        {...props}
      >
        {isMobile && (
          <div
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="mx-auto mt-2 mb-1 h-1.5 w-12 shrink-0 rounded-full bg-muted-foreground/30"
            aria-hidden
          />
        )}
        {(title || showCloseButton) && (
          <div className={cn(
            "flex items-start justify-between gap-3 p-4 border-b",
            !title && "justify-end"
          )}>
            {title && (
              <div className="flex-1 min-w-0">
                <DialogPrimitive.Title className="text-base font-semibold leading-tight">
                  {title}
                </DialogPrimitive.Title>
                {description && (
                  <DialogPrimitive.Description className="text-xs text-muted-foreground mt-0.5">
                    {description}
                  </DialogPrimitive.Description>
                )}
              </div>
            )}
            {showCloseButton && (
              <DialogPrimitive.Close
                data-slot="bottom-sheet-close"
                render={
                  <Button
                    variant="ghost"
                    className="size-9 -mr-1 -mt-1"
                    size="icon-sm"
                  />
                }
              >
                <X className="size-4" />
                <span className="sr-only">Fermer</span>
              </DialogPrimitive.Close>
            )}
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-4">
          {children}
        </div>
      </DialogPrimitive.Popup>
    </BottomSheetPortal>
  )
}

export {
  BottomSheet,
  BottomSheetTrigger,
  BottomSheetClose,
  BottomSheetContent,
  BottomSheetPortal,
  BottomSheetOverlay,
}
