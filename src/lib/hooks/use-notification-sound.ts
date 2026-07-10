"use client"

import { useCallback, useEffect, useRef } from "react"
import { Howl } from "howler"

const VOLUME_KEY = "nba-notification-volume"

export function useNotificationSound() {
  const soundRef = useRef("default")
  const volumeRef = useRef(0.5)
  const howlRef = useRef<Howl | null>(null)

  useEffect(() => {
    const v = localStorage.getItem(VOLUME_KEY)
    if (v) volumeRef.current = parseFloat(v)

    fetch("/api/dashboard/notification-preferences")
      .then((r) => r.json())
      .then((data) => {
        if (data.sound) soundRef.current = data.sound
      })
      .catch(() => {})

    return () => {
      if (howlRef.current) howlRef.current.unload()
    }
  }, [])

  const play = useCallback((soundId?: string) => {
    const id = soundId ?? soundRef.current
    if (howlRef.current) howlRef.current.unload()
    howlRef.current = new Howl({
      src: [`/sounds/${id}.wav`],
      volume: volumeRef.current,
    })
    howlRef.current.play()
  }, [])

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

  return { play, changeVolume, changeSound, volume: volumeRef.current }
}
