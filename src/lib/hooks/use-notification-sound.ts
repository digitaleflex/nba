"use client"

import { isInQuietHours } from "@nba/lib/quiet-hours"
import { useCallback, useEffect, useRef } from "react"
import { Howl } from "howler"

const VOLUME_KEY = "nba-notification-volume"

// Débloque l'audio sur iOS / navigateurs mobiles : le premier geste
// utilisateur autorise ensuite la lecture programmatique (Howler/WebAudio).
// Ne crée de AudioContext que lors d'un geste utilisateur pour éviter
// l'avertissement "AudioContext was not allowed to start".
let unlocked = false
function unlockAudio(fromGesture = false) {
  if (unlocked || typeof window === "undefined") return
  try {
    // Howler peut déjà avoir un contexte (créé après geste) : on le reprend.
    const existing = (Howler as unknown as { ctx?: AudioContext }).ctx
    if (existing) {
      if (existing.state === "suspended") void existing.resume()
      unlocked = true
      return
    }
    // Ne pas instancier de AudioContext hors geste utilisateur.
    if (!fromGesture) return
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (Ctx) {
      const ctx = new Ctx()
      if (ctx.state === "suspended") void ctx.resume()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      gain.gain.value = 0.0001
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.05)
      unlocked = true
    }
  } catch {
    // silencieux : le son restera simplement inactif
  }
}

if (typeof window !== "undefined") {
  const unlockOnce = () => {
    unlockAudio(true)
    window.removeEventListener("pointerdown", unlockOnce)
    window.removeEventListener("keydown", unlockOnce)
  }
  window.addEventListener("pointerdown", unlockOnce, { passive: true })
  window.addEventListener("touchend", unlockOnce, { passive: true })
  window.addEventListener("keydown", unlockOnce)
}


export type AlertType = "signal" | "redpill" | "message" | "system" | string

export function useNotificationSound() {
  const soundRef = useRef("default")
  const soundsByTypeRef = useRef<Record<string, string>>({})
  const quietHoursRef = useRef<{ start: string; end: string } | null>(null)
  const volumeRef = useRef(0.5)
  const howlRef = useRef<Howl | null>(null)

  useEffect(() => {
    const v = localStorage.getItem(VOLUME_KEY)
    if (v) volumeRef.current = parseFloat(v)

    const reloadPrefs = () => {
      fetch("/api/dashboard/notification-preferences")
        .then((r) => r.json())
        .then((data) => {
          if (data.sound) soundRef.current = data.sound
          if (data.soundsByType) soundsByTypeRef.current = data.soundsByType
          if (data.quietHours) quietHoursRef.current = data.quietHours
        })
        .catch(() => {})
    }
    reloadPrefs()

    const onSoundChanged = () => reloadPrefs()
    const onStorage = (e: StorageEvent) => {
      if (e.key === "nba-sound-changed" || e.key === VOLUME_KEY) reloadPrefs()
    }
    window.addEventListener("nba:sound-changed", onSoundChanged)
    window.addEventListener("storage", onStorage)

    return () => {
      if (howlRef.current) howlRef.current.unload()
      window.removeEventListener("nba:sound-changed", onSoundChanged)
      window.removeEventListener("storage", onStorage)
    }


  }, [])

  const shouldRing = useCallback(() => {
    if (volumeRef.current <= 0) return false
    if (isInQuietHours(quietHoursRef.current)) return false
    return true
  }, [])

  const play = useCallback((soundId?: string, attemptedDefault = false) => {
    unlockAudio()
    if (!shouldRing()) return
    const id = soundId ?? soundRef.current
    try {
      if (howlRef.current) howlRef.current.unload()
      const howl = new Howl({
        src: [`/sounds/${id}.mp3`],
        volume: volumeRef.current,
        html5: false,
        onloaderror: () => {
          // Repli sur "default" si le fichier est absent/corrompu.
          if (id !== "default" && !attemptedDefault) {
            play("default", true)
          }
        },
      })
      howlRef.current = howl
      howl.play()
    } catch {
      if (id !== "default" && !attemptedDefault) play("default", true)
    }
  }, [shouldRing])

  // Joue le son personnalisé du type d'alerte (signal, redpill...),
  // avec repli sur le son global de l'utilisateur.
  const playForType = useCallback((type: AlertType, fallback?: string) => {
    const mapped = soundsByTypeRef.current[type]
    play(mapped ?? fallback ?? undefined)
  }, [play])

  const changeVolume = useCallback((v: number) => {
    volumeRef.current = v
    localStorage.setItem(VOLUME_KEY, String(v))
    if (howlRef.current) howlRef.current.volume(v)
  }, [])

  const changeSound = useCallback((sound: string) => {
    soundRef.current = sound
    if (howlRef.current) howlRef.current.unload()
    howlRef.current = null
    // Propage aux autres instances (cloche, réglages) sans reload.
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("nba:sound-changed"))
      try { localStorage.setItem("nba-sound-changed", String(Date.now())) } catch {}
    }
  }, [])

  const changeSoundForType = useCallback((type: string, sound: string) => {
    soundsByTypeRef.current = { ...soundsByTypeRef.current, [type]: sound }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("nba:sound-changed"))
      try { localStorage.setItem("nba-sound-changed", String(Date.now())) } catch {}
    }
  }, [])

  return { play, playForType, changeVolume, changeSound, changeSoundForType, volume: volumeRef.current }
}
