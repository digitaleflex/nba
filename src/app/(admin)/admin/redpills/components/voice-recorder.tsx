"use client"

import { useEffect, useRef, useState } from "react"
import { Mic, Square, Loader2 } from "lucide-react"
import { Button } from "@nba/design-system"

const CANDIDATE_MIMES = ["audio/webm", "audio/mp4", "audio/ogg"]

function pickMime(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined
  for (const m of CANDIDATE_MIMES) {
    try {
      if (MediaRecorder.isTypeSupported(m)) return m
    } catch {
      // ignore
    }
  }
  return undefined
}

function formatTime(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, "0")}`
}

interface VoiceRecorderProps {
  onDone: (blob: Blob) => void
  onCancel: () => void
}

// Enregistrement note vocale au micro (MediaRecorder), direct depuis l'app.
export function VoiceRecorder({ onDone, onCancel }: VoiceRecorderProps) {
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [starting, setStarting] = useState(false)
  const recRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    start()
    return () => stopAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function stopAll() {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = null
    try {
      recRef.current?.stream.getTracks().forEach((t) => t.stop())
    } catch {
      // ignore
    }
    try {
      streamRef.current?.getTracks().forEach((t) => t.stop())
    } catch {
      // ignore
    }
    recRef.current = null
    streamRef.current = null
  }

  async function start() {
    setError(null)
    setStarting(true)
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Micro non supporté par ce navigateur.")
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const mime = pickMime()
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
      chunksRef.current = []
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      rec.onstop = () => {
        const mime = rec.mimeType?.split(";")[0]?.trim().toLowerCase() || "audio/webm"
        const blob = new Blob(chunksRef.current, { type: mime })
        stopAll()
        setRecording(false)
        if (blob.size > 0) onDone(blob)
        else setError("Enregistrement vide, réessaie.")
      }
      recRef.current = rec
      rec.start()
      setRecording(true)
      setSeconds(0)
      timerRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s + 1 >= 600) {
            rec.stop()
            return s
          }
          return s + 1
        })
      }, 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Micro inaccessible. Autorise l'accès au micro.")
    } finally {
      setStarting(false)
    }
  }

  function stop() {
    try {
      recRef.current?.stop()
    } catch {
      stopAll()
      onCancel()
    }
  }

  return (
    <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-3 space-y-2">
      {error ? (
        <div className="space-y-2">
          <p role="alert" className="text-xs text-destructive">{error}</p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={start} disabled={starting}>
              {starting ? <Loader2 className="size-3.5 animate-spin mr-1" /> : <Mic className="size-3.5 mr-1" />}
              Réessayer
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { stopAll(); onCancel() }}>
              Annuler
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <span className="relative flex size-3 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-500 opacity-75" />
            <span className="relative inline-flex size-3 rounded-full bg-rose-500" />
          </span>
          <span className="text-sm font-mono font-bold tabular-nums">{formatTime(seconds)}</span>
          <span className="text-[11px] text-muted-foreground flex-1">Enregistrement en cours… parle maintenant</span>
          <Button size="sm" onClick={stop} disabled={!recording}>
            <Square className="size-3.5 mr-1" />
            Stopper
          </Button>
        </div>
      )}
    </div>
  )
}
