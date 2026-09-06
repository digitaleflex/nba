"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { RefreshCw, Mail, Clock, Sparkles, ArrowRight, Wrench } from "lucide-react"
import { SUPPORT_EMAIL } from "@nba/lib/constants"

const CHECK_URL = "/api/public/health"
const MAX_ATTEMPTS = 60

export default function MaintenancePage() {
  const [attempts, setAttempts] = useState(0)
  const [progress, setProgress] = useState(4)
  const [label, setLabel] = useState("Synchronisation")
  const [message, setMessage] = useState("Vérification en cours…")
  const [done, setDone] = useState(false)
  const attemptsRef = useRef(0)

  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout>

    function setProg(p: number) {
      if (cancelled) return
      setProgress(Math.max(0, Math.min(100, p)))
    }

    function scheduleNext() {
      attemptsRef.current += 1
      const a = attemptsRef.current
      setAttempts(a)
      if (a > MAX_ATTEMPTS) {
        setLabel("Patience")
        setMessage("Cela prend plus de temps que prévu. Réessayez dans quelques minutes.")
        setProg(100)
        return
      }
      const wait = a <= 10 ? 5 : 10
      setProg((a / MAX_ATTEMPTS) * 92)
      setLabel(a <= 10 ? "Synchronisation" : "Finalisation")
      setMessage(`Vérification automatique dans ${wait}s… (essai ${a}/${MAX_ATTEMPTS})`)
      timer = setTimeout(check, wait * 1000)
    }

    function check() {
      if (cancelled) return
      fetch(CHECK_URL, { signal: AbortSignal.timeout(5000), cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (cancelled) return
          if (data && data.status === "healthy") {
            setDone(true)
            setLabel("Prêt")
            setMessage("✓ La plateforme est prête. Redirection…")
            setProg(100)
            setTimeout(() => window.location.reload(), 900)
            return
          }
          scheduleNext()
        })
        .catch(() => {
          if (!cancelled) scheduleNext()
        })
    }

    timer = setTimeout(check, 3000)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [])

  const handleManualRetry = () => {
    setLabel("Vérification")
    setMessage("Vérification manuelle…")
    setProgress((p) => Math.min(96, p + 8))
    fetch(CHECK_URL, { cache: "no-store", signal: AbortSignal.timeout(4000) })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && d.status === "healthy") window.location.reload()
        else window.location.reload()
      })
      .catch(() => window.location.reload())
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#070B18] p-4 py-10 text-slate-100 antialiased selection:bg-blue-500/30">
      {/* ── Background ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(1200px 600px at 15% -10%, rgba(59,130,246,0.14), transparent 60%), radial-gradient(900px 500px at 85% 0%, rgba(99,102,241,0.12), transparent 55%), radial-gradient(800px 600px at 50% 120%, rgba(139,92,246,0.08), transparent 60%), linear-gradient(180deg, #070B18 0%, #0A0F1E 45%, #070B18 100%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            mask: "radial-gradient(ellipse 900px 600px at 50% 0%, black 30%, transparent 75%)",
            WebkitMask: "radial-gradient(ellipse 900px 600px at 50% 0%, black 30%, transparent 75%)",
          }}
        />
        {/* orbs */}
        <div className="animate-orb-drift-1 absolute -left-[10%] -top-[18%] h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(59,130,246,0.22),transparent_70%)] blur-[40px]" />
        <div className="animate-orb-drift-2 absolute -right-[18%] -top-[12%] h-[640px] w-[640px] rounded-full bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.16),transparent_70%)] blur-[40px]" />
        <div className="animate-orb-drift-3 absolute bottom-[-20%] left-[30%] h-[480px] w-[480px] rounded-full bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.10),transparent_70%)] blur-[40px]" />
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")",
          }}
        />
      </div>

      {/* ── Card ── */}
      <div className="relative z-10 w-full max-w-[460px]">
        <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07)_0%,rgba(255,255,255,0.035)_100%)] p-8 pb-7 shadow-[0_20px_80px_rgba(0,0,0,0.45),0_1px_0_rgba(255,255,255,0.06)_inset] backdrop-blur-[24px] backdrop-saturate-[1.3] max-[480px]:rounded-[20px] max-[480px]:p-6">
          {/* hairline */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.14)_20%,rgba(99,102,241,0.5)_50%,rgba(59,130,246,0.4)_80%,transparent)]" />
          <div className="pointer-events-none absolute inset-0 rounded-[24px] bg-[radial-gradient(600px_200px_at_50%_0%,rgba(255,255,255,0.06),transparent_70%)]" />

          {/* Badge */}
          <div className="animate-slide-up mb-5 inline-flex items-center gap-2 rounded-full border border-blue-500/15 bg-blue-500/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-blue-300">
            <span className="relative size-[7px] rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]">
              <span className="absolute inset-[-4px] animate-ping rounded-full border border-blue-500/40" />
            </span>
            Mise à jour en cours
          </div>

          {/* Icon */}
          <div className="animate-slide-up stagger-2 relative mx-auto mb-[22px] flex size-[72px] items-center justify-center">
            <div className="absolute inset-[-6px] animate-[spin_12s_linear_infinite] rounded-[22px] border border-indigo-500/15">
              <span className="absolute -top-[3px] left-[22%] size-1.5 rounded-full bg-blue-300 shadow-[0_0_8px_#3B82F6]" />
            </div>
            <div className="absolute inset-0 rounded-[20px] bg-[linear-gradient(135deg,#2563EB_0%,#6366F1_55%,#8B5CF6_100%)] shadow-[0_8px_32px_rgba(59,130,246,0.35),0_2px_8px_rgba(0,0,0,0.2)]">
              <div className="absolute inset-px rounded-[19px] bg-[linear-gradient(180deg,rgba(255,255,255,0.14),transparent)]" />
            </div>
            <div className="relative z-10 text-white">
              <Wrench className="size-7" strokeWidth={1.7} />
            </div>
          </div>

          <div className="animate-slide-up stagger-3 font-[Space_Grotesk,sans-serif] text-[13px] font-bold uppercase tracking-[0.14em] text-slate-500">
            NeverBrokeAgain
          </div>
          <h1 className="animate-slide-up stagger-3 mt-2 font-[Space_Grotesk,sans-serif] text-[26px] font-bold leading-[1.15] tracking-[-0.03em] text-slate-100 max-[480px]:text-[22px]">
            Nous peaufinons
            <br />
            <em className="bg-[linear-gradient(135deg,#60A5FA_0%,#818CF8_45%,#A78BFA_100%)] bg-clip-text font-bold not-italic text-transparent">
              l’expérience
            </em>
          </h1>
          <p className="animate-slide-up stagger-4 mt-3 text-[14.5px] leading-6 text-slate-400 max-[480px]:text-sm">
            Nous mettons à jour la plateforme pour vous offrir
            <br className="max-[480px]:hidden" />
            une expérience encore plus fluide.{" "}
            <strong className="font-semibold text-slate-300">De retour dans quelques instants.</strong>
          </p>

          {/* Status */}
          <div
            className={`animate-slide-up stagger-5 mt-6 rounded-2xl border p-4 pb-3.5 text-left transition-colors ${done ? "border-emerald-500/20 bg-emerald-500/5" : "border-white/10 bg-white/[0.04]"}`}
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-slate-200">
                {done ? (
                  <span className="flex size-3.5 items-center justify-center rounded-full bg-emerald-500 text-white">
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12l5 5l10 -10" />
                    </svg>
                  </span>
                ) : (
                  <span className="size-3.5 animate-spin rounded-full border-2 border-white/15 border-t-blue-400" aria-hidden />
                )}
                {label}
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-slate-500">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full border border-white/5 bg-white/5 p-px">
              <div
                className={`relative h-full rounded-full transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${done ? "bg-[linear-gradient(90deg,#059669,#10B981)] shadow-[0_0_12px_rgba(16,185,129,0.4)]" : "bg-[linear-gradient(90deg,#2563EB_0%,#6366F1_50%,#8B5CF6_100%)] shadow-[0_0_12px_rgba(99,102,241,0.5)]"}`}
                style={{ width: `${progress}%` }}
              >
                {!done && (
                  <span className="absolute inset-0 animate-shimmer bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.22)_50%,transparent_100%)] bg-[length:200%_100%]" />
                )}
              </div>
            </div>
            <div
              className={`mt-2.5 flex items-center gap-1.5 text-xs leading-5 ${done ? "text-emerald-300" : "text-slate-400"}`}
              role="status"
              aria-live="polite"
            >
              <span className={`size-1 rounded-full ${done ? "bg-emerald-500" : "animate-pulse bg-slate-500"}`} />
              {message}
            </div>
          </div>

          {/* Actions */}
          <div className="animate-slide-up stagger-6 mt-5 flex gap-2.5 max-[480px]:flex-col">
            <button
              onClick={handleManualRetry}
              className="relative inline-flex flex-1 items-center justify-center gap-2 overflow-hidden rounded-xl bg-[linear-gradient(135deg,#2563EB_0%,#4F46E5_50%,#7C3AED_100%)] px-5 py-3.5 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(37,99,235,0.35),0_1px_0_rgba(255,255,255,0.15)_inset] transition-all hover:-translate-y-px hover:brightness-[1.06] active:translate-y-0 active:scale-[0.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 max-[480px]:w-full"
            >
              <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),transparent)]" />
              <RefreshCw className="size-4" />
              Réessayer maintenant
            </button>
            <a
              href={`mailto:${SUPPORT_EMAIL}?subject=Maintenance%20en%20cours`}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3.5 text-sm font-semibold text-slate-200 backdrop-blur transition-all hover:-translate-y-px hover:border-white/15 hover:bg-white/10 active:translate-y-0 active:scale-[0.99] max-[480px]:w-full"
            >
              <Mail className="size-4" />
              Support
            </a>
          </div>

          <div className="animate-slide-up stagger-7 mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-4">
            <span className="inline-flex items-center gap-1.5 text-[11px] leading-5 text-slate-500">
              <Clock className="size-3 opacity-60" />
              Temps estimé : 2 — 5 minutes
            </span>
            <a
              href={`mailto:${SUPPORT_EMAIL}?subject=Maintenance`}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/5 bg-white/[0.03] px-2.5 py-1 text-xs font-medium text-slate-400 transition-colors hover:border-white/10 hover:bg-white/10 hover:text-slate-100"
            >
              Besoin d’aide ?
              <ArrowRight className="size-3" />
            </a>
          </div>
        </div>

        <div className="animate-slide-up stagger-8 mt-4 flex items-center justify-center gap-2 text-center text-[11px] font-medium uppercase tracking-[0.06em] text-slate-500/70">
          <span className="h-px max-w-10 flex-1 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.08))]" />
          NeverBrokeAgain • Plateforme premium
          <span className="h-px max-w-10 flex-1 bg-[linear-gradient(90deg,rgba(255,255,255,0.08),transparent)]" />
        </div>

        {/* Subtle reassurance */}
        <div className="animate-slide-up stagger-8 mt-4 flex items-start gap-2.5 rounded-xl border border-indigo-500/10 bg-indigo-500/5 p-3 text-left backdrop-blur">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-indigo-500/15 bg-indigo-500/10 text-indigo-300">
            <Sparkles className="size-3.5" />
          </span>
          <p className="text-xs leading-5 text-slate-300">
            Vos données sont en sécurité. La mise à jour est automatique —<br className="hidden sm:inline" />
            <span className="text-slate-400">aucune action n’est requise de votre part.</span>
          </p>
        </div>
      </div>
    </div>
  )
}
