import { createHash } from "crypto"

export interface DeviceSignals {
  userAgent: string
  language: string
  platform: string
  screenResolution: string
  colorDepth: number
  timezone: string
  timezoneOffset: number
  cpuCores: number
  touchSupport: boolean
  pixelRatio: number
  hardwareConcurrency: number
  vendor: string
}

export class DeviceFingerprintService {
  private readonly pepper: string

  constructor() {
    this.pepper = process.env.FINGERPRINT_PEPPER ?? "nba-fp-pepper"
  }

  computeHash(signals: DeviceSignals): string {
    const normalized = this.normalize(signals)
    const sorted = Object.keys(normalized).sort().reduce((acc, key) => {
      acc[key] = normalized[key]
      return acc
    }, {} as Record<string, unknown>)

    const payload = JSON.stringify(sorted) + this.pepper
    return createHash("sha256").update(payload).digest("hex")
  }

  computeLegacyFingerprint(req: Request): string {
    const ua = req.headers.get("user-agent") ?? ""
    const ip = req.headers.get("x-forwarded-for")
      ?? req.headers.get("x-real-ip")
      ?? "unknown"
    return `${ip}|${ua}`
  }

  private normalize(signals: DeviceSignals): Record<string, unknown> {
    return {
      ua: signals.userAgent,
      lang: signals.language,
      plat: signals.platform,
      screen: signals.screenResolution,
      depth: signals.colorDepth,
      tz: signals.timezone,
      tzo: signals.timezoneOffset,
      mem: signals.cpuCores,
      touch: signals.touchSupport,
      px: signals.pixelRatio,
      hw: signals.hardwareConcurrency,
      vendor: signals.vendor,
    }
  }
}

export const deviceFingerprintService = new DeviceFingerprintService()
