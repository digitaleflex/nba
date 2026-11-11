"use client"

import { useEffect, useRef, useState } from "react"
import { Video, Square, Loader2 } from "lucide-react"
import { Button } from "@nba/design-system"

const CANDIDATE_MIMES = ["video/webm", "video/mp4"]

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

interface VideoRecorderProps {
  onDone: (blob: Blob) => void
  onCancel: () => void
}

// Enregistrement vidéo (caméra + micro) direct depuis l'app.
export function VideoRecorder({ onDone, onCancel }: VideoRecorderProps) {
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [starting, setStarting] = useState(true)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const recRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    init()
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

  async function init() {
    setError(null)
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Caméra non supportée par ce navigateur.")
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play().catch(() => {})
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Caméra inaccessible. Autorise l'accès.")
    } finally {
      setStarting(false)
    }
  }

  function startRec() {
    const stream = streamRef.current
    if (!stream) return
    try {
      const mime = pickMime()
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: 2_500_000 } : undefined)
      chunksRef.current = []
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      rec.onstop = () => {
        const mime = rec.mimeType?.split(";")[0]?.trim().toLowerCase() || "video/webm"
        const blob = new Blob(chunksRef.current, { type: mime })
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
      setError(err instanceof Error ? err.message : "Enregistrement impossible.")
    }
  }

  function stopRec() {
    try {
      recRef.current?.stop()
    } catch {
      setRecording(false)
    }
  }

  return (
    <div className="rounded-lg border border-violet-500/30 bg-violet-500/5 p-3 space-y-2">
      {error ? (
        <div className="space-y-2">
          <p role="alert" className="text-xs text-destructive">{error}</p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => { stopAll(); init() }}>
              Réessayer
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { stopAll(); onCancel() }}>
              Annuler
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="relative overflow-hidden rounded-lg bg-black aspect-video">
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video ref={videoRef} muted playsInline className="absolute inset-0 h-full w-full object-cover" />
            {recording && (
              <div className="absolute top-2 left-2 flex items-center gap-1.5 rounded-full bg-black/60 px-2 py-1">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-500 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-rose-500" />
                </span>
                <span className="text-[11px] font-mono font-bold text-white tabular-nums">{formatTime(seconds)}</span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            {!recording ? (
              <Button size="sm" onClick={startRec} disabled={starting}>
                {starting ? <Loader2 className="size-3.5 animate-spin mr-1" /> : <Video className="size-3.5 mr-1" />}
                {starting ? "Caméra…" : "Enregistrer"}
              </Button>
            ) : (
              <Button size="sm" onClick={stopRec}>
                <Square className="size-3.5 mr-1" />
                Stopper ({formatTime(seconds)})
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={() => { stopAll(); onCancel() }}>
              Annuler
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
