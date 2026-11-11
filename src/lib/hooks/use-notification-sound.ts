"use client"

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
  window.addEventListener("keydown", unlockOnce)
}

function inQuietHours(qh: { start: string; end: string } | null | undefined): boolean {
  if (!qh?.start || !qh?.end) return false
  const now = new Date()
  const cur = now.getHours() * 60 + now.getMinutes()
  const [sh, sm] = qh.start.split(":").map(Number)
  const [eh, em] = qh.end.split(":").map(Number)
  if (Number.isNaN(sh) || Number.isNaN(eh)) return false
  const start = sh * 60 + (sm || 0)
  const end = eh * 60 + (em || 0)
  if (start <= end) return cur >= start && cur < end
  return cur >= start || cur < end
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

    fetch("/api/dashboard/notification-preferences")
      .then((r) => r.json())
      .then((data) => {
        if (data.sound) soundRef.current = data.sound
        if (data.soundsByType) soundsByTypeRef.current = data.soundsByType
        if (data.quietHours) quietHoursRef.current = data.quietHours
      })
      .catch(() => {})

    return () => {
      if (howlRef.current) howlRef.current.unload()
    }
  }, [])

  const shouldRing = useCallback(() => {
    if (volumeRef.current <= 0) return false
    if (inQuietHours(quietHoursRef.current)) return false
    return true
  }, [])

  const play = useCallback((soundId?: string) => {
    unlockAudio()
    if (!shouldRing()) return
    const id = soundId ?? soundRef.current
    try {
      if (howlRef.current) howlRef.current.unload()
      howlRef.current = new Howl({
        src: [`/sounds/${id}.wav`],
        volume: volumeRef.current,
        html5: false,
      })
      howlRef.current.play()
    } catch {
      // silencieux
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
    howlRef.current = new Howl({
      src: [`/sounds/${sound}.wav`],
      volume: volumeRef.current,
    })
  }, [])

  const changeSoundForType = useCallback((type: string, sound: string) => {
    soundsByTypeRef.current = { ...soundsByTypeRef.current, [type]: sound }
  }, [])

  return { play, playForType, changeVolume, changeSound, changeSoundForType, volume: volumeRef.current }
}
