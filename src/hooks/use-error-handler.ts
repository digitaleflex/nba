"use client"

import { useCallback } from "react"
import { toast } from "sonner"

const DEFAULT_MESSAGE = "Une erreur est survenue. Veuillez réessayer."

/**
 * Hook centralisé de gestion d'erreurs.
 * Affiche un toast d'erreur standardisé pour éviter les `catch {}` silencieux
 * et les messages d'erreur inconsistants à travers l'application.
 */
export function useErrorHandler(defaultMessage: string = DEFAULT_MESSAGE) {
  return useCallback(
    (error: unknown, message: string = defaultMessage) => {
      // Log structuré en dev pour le debugging (les console.error sont déjà
      // gardés en développement via le pattern QW-2).
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.error("[useErrorHandler]", error)
      }
      const text = error instanceof Error && error.message ? message : message
      toast.error(text)
    },
    [defaultMessage]
  )
}

export { DEFAULT_MESSAGE as DEFAULT_ERROR_MESSAGE }
