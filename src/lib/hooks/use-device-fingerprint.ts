"use client"

import { useEffect, useRef } from "react"
import FingerprintJS from "@fingerprintjs/fingerprintjs"

/**
 * Hook qui initialise FingerprintJS et renvoie le visitor ID.
 * Le résultat est stocké dans un cookie lisible côté serveur.
 */
export function useDeviceFingerprint() {
  const fpRef = useRef<Promise<string> | null>(null)

  useEffect(() => {
    if (fpRef.current) return
    fpRef.current = FingerprintJS.load()
      .then((fp) => fp.get())
      .then((result) => {
        const visitorId = result.visitorId
        // Stocker dans un cookie accessible au serveur
        document.cookie =
          `nba_fp=${visitorId}; path=/; max-age=${7 * 86400}; SameSite=Lax`
        return visitorId
      })
      .catch(() => null as unknown as string)
  }, [])
}

/**
 * Place ce composant dans le layout racine pour initialiser
 * le fingerprint dès le chargement de l'application.
 */
export function DeviceFingerprintInit() {
  useDeviceFingerprint()
  return null
}
