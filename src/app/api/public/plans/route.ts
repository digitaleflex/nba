import { NextResponse } from "next/server"
import { getCached } from "@nba/lib/cache"

// UUIDs stables pour le fallback — ne jamais changer ces valeurs (FK compatibility)
const FALLBACK_PLANS = [
  { id: "00000000-0000-0000-0000-000000000001", name: "Signals X Forex", description: null, price: "0", sortOrder: 1, isActive: true, _count: { accessRequests: 0 } },
  { id: "00000000-0000-0000-0000-000000000002", name: "Signals X Deriv", description: null, price: "0", sortOrder: 2, isActive: true, _count: { accessRequests: 0 } },
  { id: "00000000-0000-0000-0000-000000000003", name: "Signals X Forex + Deriv", description: null, price: "0", sortOrder: 3, isActive: true, _count: { accessRequests: 0 } },
  { id: "00000000-0000-0000-0000-000000000004", name: "Signals X Pro Forex", description: null, price: "0", sortOrder: 4, isActive: true, _count: { accessRequests: 0 } },
  { id: "00000000-0000-0000-0000-000000000005", name: "Signals X Pro Deriv", description: null, price: "0", sortOrder: 5, isActive: true, _count: { accessRequests: 0 } },
  { id: "00000000-0000-0000-0000-000000000006", name: "Signals X Pro Forex + Deriv", description: null, price: "0", sortOrder: 6, isActive: true, _count: { accessRequests: 0 } },
]

export async function GET() {
  const plans = await getCached(
    "plans",
    async () => {
      try {
        const { prisma } = await import("@nba/lib/db")
        return await prisma.subscriptionPlan.findMany({
          where: { isActive: true, deletedAt: null },
          orderBy: { sortOrder: "asc" },
          include: {
            _count: {
              select: {
                accessRequests: {
                  where: {
                    status: "APPROVED",
                    user: { isActive: true, deletedAt: null },
                  },
                },
              },
            },
          },
        })
      } catch {
        return FALLBACK_PLANS
      }
    },
    300,
  )
  return NextResponse.json(plans)
}
