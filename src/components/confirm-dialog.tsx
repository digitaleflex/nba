"use client"

import { useState, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, Button } from "@nba/design-system"
import { AlertTriangle } from "lucide-react"

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  onConfirm: () => void
  onOpenChange: (open: boolean) => void
}

/**
 * Boîte de dialogue de confirmation stylée (remplace les confirm()/alert()
 * natifs du navigateur, incohérents avec le design system).
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  destructive = true,
  onConfirm,
  onOpenChange,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {destructive && <AlertTriangle className="size-4 text-destructive" />}
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? "destructive" : "default"}
            onClick={() => {
              onOpenChange(false)
              onConfirm()
            }}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Hook pour piloter une ConfirmDialog depuis n'importe quel composant.
 *
 * @example
 *   const confirm = useConfirm()
 *   <Button onClick={() => confirm({ title, description, onConfirm })} />
 *   {confirm.node}
 */
export function useConfirm() {
  const [state, setState] = useState<{
    open: boolean
    title: string
    description: string
    confirmLabel?: string
    onConfirm?: () => void
  }>({ open: false, title: "", description: "" })

  const confirm = useCallback((opts: {
    title: string
    description: string
    confirmLabel?: string
    onConfirm: () => void
  }) => {
    setState({ open: true, ...opts })
  }, [])

  const node = (
    <ConfirmDialog
      open={state.open}
      title={state.title}
      description={state.description}
      confirmLabel={state.confirmLabel}
      onConfirm={() => state.onConfirm?.()}
      onOpenChange={(open) => setState((s) => ({ ...s, open }))}
    />
  )

  return { confirm, node }
}
