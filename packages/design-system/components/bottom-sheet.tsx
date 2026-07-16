"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { XIcon } from "lucide-react"

import { cn } from "../lib/utils"

function BottomSheet({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="bottom-sheet" {...props} />
}

function BottomSheetTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="bottom-sheet-trigger" {...props} />
}

function BottomSheetClose({ ...props }: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="bottom-sheet-close" {...props} />
}

function BottomSheetOverlay({
  className,
  ...props
}: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="bottom-sheet-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/40 duration-200 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className
      )}
      {...props}
    />
  )
}

function BottomSheetContent({
  className,
  children,
  ...props
}: DialogPrimitive.Popup.Props) {
  return (
    <DialogPrimitive.Portal>
      <BottomSheetOverlay />
      <DialogPrimitive.Popup
        data-slot="bottom-sheet-content"
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 flex max-h-[90dvh] flex-col rounded-t-2xl border-t border-border bg-card text-card-foreground shadow-2xl",
          "duration-300 ease-out data-open:animate-in data-open:slide-in-from-bottom data-closed:animate-out data-closed:slide-out-to-bottom",
          className
        )}
        {...props}
      >
        <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-muted-foreground/30" />
        <div className="overflow-y-auto px-4 pb-[max(env(safe-area-inset-bottom),1rem)] pt-2">
          {children}
        </div>
      </DialogPrimitive.Popup>
    </DialogPrimitive.Portal>
  )
}

function BottomSheetHeader({
  className,
  title,
  onClose,
  children,
}: {
  className?: string
  title: string
  onClose?: () => void
  children?: React.ReactNode
}) {
  return (
    <div className={cn("flex items-center justify-between pb-2", className)}>
      <h3 className="text-sm font-semibold tracking-tight text-foreground">{title}</h3>
      <div className="flex items-center gap-1">
        {children}
        {onClose && (
          <button
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            aria-label="Fermer"
          >
            <XIcon className="size-4" />
          </button>
        )}
      </div>
    </div>
  )
}

export {
  BottomSheet,
  BottomSheetTrigger,
  BottomSheetClose,
  BottomSheetOverlay,
  BottomSheetContent,
  BottomSheetHeader,
}
