/**
 * Heures de silence : une seule implémentation pour le serveur et le navigateur (#368).
 * L'heure est lue dans le fuseau IANA de l'utilisateur (ex. « Europe/Paris »), pas dans celui du serveur.
 * Sans fuseau valide, on retombe sur l'heure locale de la machine (navigateur = heure de l'appareil).
 */
export interface QuietHours {
  start: string
  end: string
}

function minutesOfDay(now: Date, timeZone?: string): number {
  if (timeZone) {
    try {
      const parts = new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(now)
      const h = Number(parts.find((p) => p.type === "hour")?.value)
      const m = Number(parts.find((p) => p.type === "minute")?.value)
      if (Number.isFinite(h) && Number.isFinite(m)) return h * 60 + m
    } catch {
      // fuseau invalide : repli ci-dessous
    }
  }
  return now.getHours() * 60 + now.getMinutes()
}

export function isInQuietHours(qh: QuietHours | null | undefined, timeZone?: string, now: Date = new Date()): boolean {
  if (!qh?.start || !qh?.end) return false
  const [sh, sm = 0] = qh.start.split(":").map(Number)
  const [eh, em = 0] = qh.end.split(":").map(Number)
  if (Number.isNaN(sh) || Number.isNaN(eh)) return false
  const start = sh * 60 + sm
  const end = eh * 60 + em
  if (start === end) return false
  const cur = minutesOfDay(now, timeZone)
  if (start < end) return cur >= start && cur < end
  return cur >= start || cur < end // la plage franchit minuit
}

/**
 * Un signal de trading sonne toujours, sauf si le membre a coché
 * « Respecter mes heures de silence aussi pour les signaux » (décision D-3, option C : décoché par défaut).
 */
export function shouldMuteNow(
  prefs: { quietHours?: QuietHours | null; signalsRespectQuietHours?: boolean } | null | undefined,
  isSignal: boolean,
  timeZone?: string,
  now: Date = new Date(),
): boolean {
  if (!prefs?.quietHours) return false
  if (isSignal && prefs.signalsRespectQuietHours !== true) return false
  return isInQuietHours(prefs.quietHours, timeZone, now)
}
