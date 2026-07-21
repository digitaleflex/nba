import { NextResponse } from "next/server"
import { requireRole, handleAuthError } from "@nba/lib/auth-utils"
import { prisma } from "@nba/lib/db"

export async function GET() {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"])
    const total = await prisma.device.count()

    const [byType, byBrand, byOs, byBrowser, recent] = await Promise.all([
      prisma.device.groupBy({
        by: ["deviceType"],
        _count: { _all: true },
      }),
      prisma.device.groupBy({
        by: ["brand"],
        where: { brand: { not: null } },
        _count: { _all: true },
        orderBy: { _count: { brand: "desc" } },
      }),
      prisma.device.groupBy({
        by: ["os"],
        where: { os: { not: null } },
        _count: { _all: true },
        orderBy: { _count: { os: "desc" } },
      }),
      prisma.device.groupBy({
        by: ["browser"],
        where: { browser: { not: null } },
        _count: { _all: true },
        orderBy: { _count: { browser: "desc" } },
      }),
      prisma.device.findMany({
        orderBy: { lastSeenAt: "desc" },
        take: 20,
        select: {
          id: true,
          name: true,
          deviceType: true,
          brand: true,
          model: true,
          os: true,
          browser: true,
          ipAddress: true,
          lastSeenAt: true,
          trusted: true,
        },
      }),
    ])

    const brandMap: Record<string, number> = {}
    let mobileCount = 0
    let tabletCount = 0
    let desktopCount = 0

    for (const row of byType) {
      const c = row._count._all
      if (row.deviceType === "mobile") mobileCount = c
      else if (row.deviceType === "tablet") tabletCount = c
      else if (row.deviceType === "desktop") desktopCount = c
    }

    for (const row of byBrand) {
      if (row.brand) brandMap[row.brand] = row._count._all
    }

    return NextResponse.json({
      total,
      counts: {
        mobile: mobileCount,
        tablet: tabletCount,
        desktop: desktopCount,
      },
      byBrand: brandMap,
      byOs: byOs.map((r) => ({ name: r.os, count: r._count._all })),
      byBrowser: byBrowser.map((r) => ({ name: r.browser, count: r._count._all })),
      recent,
    })
  } catch (error) {
    return handleAuthError(error)
  }
}
