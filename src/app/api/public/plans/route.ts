import { NextResponse } from "next/server"

const FALLBACK_PLANS = [
  { id: "1", name: "Signals X Forex", description: null, price: "0", sortOrder: 1, isActive: true },
  { id: "2", name: "Signals X Deriv", description: null, price: "0", sortOrder: 2, isActive: true },
  { id: "3", name: "Signals X Forex + Deriv", description: null, price: "0", sortOrder: 3, isActive: true },
  { id: "4", name: "Signals X Pro Forex", description: null, price: "0", sortOrder: 4, isActive: true },
  { id: "5", name: "Signals X Pro Deriv", description: null, price: "0", sortOrder: 5, isActive: true },
  { id: "6", name: "Signals X Pro Forex + Deriv", description: null, price: "0", sortOrder: 6, isActive: true },
]

export async function GET() {
  try {
    const { prisma } = await import("@nba/lib/db")
    const plans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: { sortOrder: "asc" },
    })
    return NextResponse.json(plans)
  } catch {
    return NextResponse.json(FALLBACK_PLANS)
  }
}
