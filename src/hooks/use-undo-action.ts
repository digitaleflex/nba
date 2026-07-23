"use client"

import { useCallback, useRef } from "react"
import { toast } from "sonner"

interface UndoAction {
  id: string
  label: string
  undoLabel?: string
}

export function useUndoAction() {
  const timers = useRef<Map<string, NodeJS.Timeout>>(new Map())

  const execute = useCallback((action: UndoAction, fn: () => Promise<void>) => {
    toast.promise(fn(), {
      loading: `${action.label}...`,
      success: () => {
        toast(`${action.label} effectué`, {
          action: {
            label: action.undoLabel ?? "Annuler",
            onClick: () => {
              const t = timers.current.get(action.id)
              if (t) {
                clearTimeout(t)
                timers.current.delete(action.id)
                toast.success(`${action.label} annulé`)
              }
            },
          },
          duration: 8000,
        })

        const t = setTimeout(() => {
          timers.current.delete(action.id)
        }, 8000)
        timers.current.set(action.id, t)

        return `${action.label} effectué`
      },
      error: (err) => `Erreur : ${err?.message || "inconnue"}`,
    })
  }, [])

  const confirm = useCallback((action: UndoAction, fn: () => Promise<void>) => {
    execute(action, fn)
  }, [execute])

  return { execute, confirm }
}
