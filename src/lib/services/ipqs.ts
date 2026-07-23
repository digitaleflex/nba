import { logger } from "@nba/lib/logger"

const log = logger.child({ module: "ipqs" })

const BASE_URL = "https://ipqualityscore.com/api/json"
const TIMEOUT_MS = 5000

export interface IpqsResult {
  success: boolean
  message?: string
  fraud_score: number
  proxy: boolean
  vpn: boolean
  tor: boolean
  active_vpn: boolean
  active_tor: boolean
  recent_abuse: boolean
  bot_status: boolean
  connection_type: string
  abuse_velocity: string
  country_code: string
  region: string
  city: string
  zip_code: string
  isp: string
  organization: string
  ASN: number
  host: string
  mobile: boolean
  timezone: string
  latitude: number
  longitude: number
}

/**
 * Interroge l'API IPQualityScore pour la réputation d'une IP.
 * Retourne null en cas d'erreur (timeout, API key absente, etc.).
 */
export async function lookupIpqs(ip: string): Promise<IpqsResult | null> {
  const apiKey = process.env.IPQS_API_KEY
  if (!apiKey) return null

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

    const res = await fetch(`${BASE_URL}/${apiKey}/${ip}?strictness=1&allow_public_access_points=true&fast=true&lighter_penalties=false`, {
      signal: controller.signal,
    })
    clearTimeout(timer)

    if (!res.ok) {
      log.warn({ status: res.status, ip }, "IPQS API error")
      return null
    }

    const data: IpqsResult = await res.json()
    if (!data.success) {
      log.warn({ message: data.message, ip }, "IPQS lookup failed")
      return null
    }

    return data
  } catch (err) {
    log.warn({ err, ip, errorCode: "INTEGRATION_ERROR" }, "IPQS lookup error")
    return null
  }
}
