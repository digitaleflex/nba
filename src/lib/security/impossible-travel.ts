import { prisma } from "../db"
import { getConnection as getRedis } from "../redis-pubsub"
import { logger } from "../logger"
import { securityEventBus } from "./security-event-bus"

const log = logger.child({ module: "impossible-travel" })

const EARTH_RADIUS_KM = 6371

function toRadians(deg: number): number {
  return deg * (Math.PI / 180)
}

function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return EARTH_RADIUS_KM * c
}

function minimumTravelTimeMinutes(distanceKm: number): number {
  return (distanceKm / 900) * 60
}

export interface GeoPoint {
  latitude: number
  longitude: number
  timestamp: Date
  ipAddress: string
  country?: string
  city?: string
}

export interface ImpossibleTravelResult {
  detected: boolean
  distanceKm: number
  timeDeltaMinutes: number
  minTravelTimeMinutes: number
  severity: "INFO" | "WARNING" | "HIGH" | "CRITICAL"
  from: GeoPoint
  to: GeoPoint
}

export class ImpossibleTravelDetector {
  async check(userId: string, current: GeoPoint): Promise<ImpossibleTravelResult | null> {
    try {
      const lastSession = await prisma.session.findFirst({
        where: {
          userId,
          latitude: { not: null },
          longitude: { not: null },
          id: { not: current.timestamp ? undefined : undefined },
        },
        orderBy: { createdAt: "desc" },
        select: {
          latitude: true, longitude: true, createdAt: true,
          ipAddress: true, country: true, city: true,
        },
        skip: current.timestamp ? 0 : 0,
      })

      if (!lastSession || !lastSession.latitude || !lastSession.longitude) return null

      const prev: GeoPoint = {
        latitude: lastSession.latitude,
        longitude: lastSession.longitude,
        timestamp: lastSession.createdAt,
        ipAddress: lastSession.ipAddress ?? "unknown",
        country: lastSession.country ?? undefined,
        city: lastSession.city ?? undefined,
      }

      const distance = haversineDistance(
        prev.latitude, prev.longitude,
        current.latitude, current.longitude,
      )

      if (distance < 50) return null

      const timeDeltaMs = Math.abs(current.timestamp.getTime() - prev.timestamp.getTime())
      const timeDeltaMinutes = timeDeltaMs / 60000
      const minTravelTime = minimumTravelTimeMinutes(distance)

      if (timeDeltaMinutes < minTravelTime) {
        const severityRatio = minTravelTime / Math.max(timeDeltaMinutes, 1)
        let severity: "INFO" | "WARNING" | "HIGH" | "CRITICAL" = "WARNING"
        if (severityRatio > 10) severity = "CRITICAL"
        else if (severityRatio > 5) severity = "HIGH"

        const result: ImpossibleTravelResult = {
          detected: true,
          distanceKm: Math.round(distance),
          timeDeltaMinutes: Math.round(timeDeltaMinutes),
          minTravelTimeMinutes: Math.round(minTravelTime),
          severity,
          from: prev,
          to: current,
        }

        await securityEventBus.emit({
          userId,
          type: "SECURITY_ALERT",
          severity,
          ipAddress: current.ipAddress,
          details: {
            detection: "impossible_travel",
            distanceKm: result.distanceKm,
            timeDeltaMinutes: result.timeDeltaMinutes,
            minTravelTimeMinutes: result.minTravelTimeMinutes,
            fromCountry: prev.country,
            toCountry: current.country,
            fromCity: prev.city,
            toCity: current.city,
            fromIp: prev.ipAddress,
          },
          country: current.country,
          city: current.city,
          latitude: current.latitude,
          longitude: current.longitude,
          riskScore: Math.min(Math.round(severityRatio * 10), 100),
        })

        try {
          const redis = getRedis()
          if (redis) {
            const countKey = `impossible_travel:${userId}:${Math.floor(Date.now() / 3600000)}`
            const count = await redis.incr(countKey)
            await redis.expire(countKey, 7200)
            if (count > 3) {
              await prisma.user.update({
                where: { id: userId },
                data: { isActive: false, suspendedAt: new Date() },
              })
              log.warn({ userId }, "Account suspended for repeated impossible travel")
            }
          }
        } catch {
          // Redis failure
        }

        return result
      }

      return null
    } catch (err) {
      log.error({ err, userId, errorCode: "INTEGRATION_ERROR" }, "Impossible travel check failed")
      return null
    }
  }
}

export const impossibleTravelDetector = new ImpossibleTravelDetector()
