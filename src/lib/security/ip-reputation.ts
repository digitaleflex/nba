import { getConnection as getRedis } from "../redis-pubsub"
import { logger } from "../logger"

const log = logger.child({ module: "ip-reputation" })

export interface IpReputation {
  isVPN: boolean
  isProxy: boolean
  isTor: boolean
  isDatacenter: boolean
  isMobile: boolean
  isCrawler: boolean
  country: string | null
  city: string | null
  latitude: number | null
  longitude: number | null
  isp: string | null
  org: string | null
  asn: number | null
  confidence: number
}

const VPN_ASNS = new Set([
  20473, 36352, 22612, 21859, 25820, 32780, 36459, 39798,
  32810, 209531, 207375, 207375, 209531, 214845, 215369,
])

const DATACENTER_ASNS = new Set([
  14061, 36351, 12876, 16276, 16509, 14618, 16509, 13335,
  8075, 15169, 54113, 63949, 20473, 39798, 10796, 46652,
  8100, 231, 36352, 39798, 53371, 26496, 62468,
])

const KNOWN_TOR_EXIT_NODES = new Set<string>()

export class IpReputationService {
  async lookup(ip: string): Promise<IpReputation> {
    try {
      const redis = getRedis()
      if (redis) {
        const cacheKey = `iprep:${ip}`
        const cached = await redis.get(cacheKey)
        if (cached) return JSON.parse(cached)
      }

      const result = await this.resolve(ip)

      if (redis) {
        const cacheKey = `iprep:${ip}`
        await redis.setex(cacheKey, 3600, JSON.stringify(result))
      }

      return result
    } catch (err) {
      log.error({ err, ip, errorCode: "INTEGRATION_ERROR" }, "IP reputation lookup failed")
      return {
        isVPN: false, isProxy: false, isTor: false, isDatacenter: false,
        isMobile: false, isCrawler: false,
        country: null, city: null, latitude: null, longitude: null,
        isp: null, org: null, asn: null, confidence: 0,
      }
    }
  }

  private async resolve(ip: string): Promise<IpReputation> {
    if (ip === "127.0.0.1" || ip === "::1" || ip === "localhost") {
      return {
        isVPN: false, isProxy: false, isTor: false, isDatacenter: false,
        isMobile: false, isCrawler: false,
        country: null, city: null, latitude: null, longitude: null,
        isp: null, org: null, asn: null, confidence: 100,
      }
    }

    const result: IpReputation = {
      isVPN: false, isProxy: false, isTor: false, isDatacenter: false,
      isMobile: false, isCrawler: false,
      country: null, city: null, latitude: null, longitude: null,
      isp: null, org: null, asn: null, confidence: 50,
    }

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 3000)
      const response = await fetch(
        `https://ipapi.co/${ip}/json/`,
        { signal: controller.signal, headers: { "User-Agent": "NBA-Security/1.0" } },
      )
      clearTimeout(timeout)

      if (!response.ok) return result

      const data = await response.json()
      if (data.error) return result

      result.country = data.country ?? null
      result.city = data.city ?? null
      result.latitude = data.latitude ?? null
      result.longitude = data.longitude ?? null
      result.isp = data.org ?? data.isp ?? null
      result.org = data.org ?? null
      result.asn = data.asn ? parseInt(String(data.asn).replace("AS", ""), 10) : null

      if (data.organisation) {
        const orgLower = data.organisation.toLowerCase()
        if (orgLower.includes("vpn") || orgLower.includes("proxy")) result.isProxy = true
      }

      if (result.asn) {
        if (VPN_ASNS.has(result.asn)) result.isVPN = true
        if (DATACENTER_ASNS.has(result.asn)) result.isDatacenter = true
      }

      if (result.org) {
        const orgLower = result.org.toLowerCase()
        if (orgLower.includes("amazon") || orgLower.includes("google cloud") ||
            orgLower.includes("microsoft azure") || orgLower.includes("digitalocean") ||
            orgLower.includes("hetzner") || orgLower.includes("ovh") ||
            orgLower.includes("scaleway") || orgLower.includes("linode") ||
            orgLower.includes("vultr")) {
          result.isDatacenter = true
        }
      }

      if (KNOWN_TOR_EXIT_NODES.has(ip)) result.isTor = true

      result.confidence = result.asn ? 85 : 60
    } catch {
      return result
    }

    return result
  }

  async flagDevice(deviceId: string, reputation: IpReputation): Promise<void> {
    const { prisma } = await import("../db")
    await prisma.device.update({
      where: { id: deviceId },
      data: {
        flagVpn: reputation.isVPN,
        flagProxy: reputation.isProxy,
        flagTor: reputation.isTor,
        flagDatacenter: reputation.isDatacenter,
        lastCountry: reputation.country,
      },
    })
  }
}

export const ipReputationService = new IpReputationService()
