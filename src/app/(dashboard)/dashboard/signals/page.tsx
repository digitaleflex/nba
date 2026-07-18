import { SignalsView } from "./components/signals-view"
import { NoAccessView } from "./components/no-access-view"
import { getServerSession } from "@nba/lib/get-session"
import { prisma } from "@nba/lib/db"
import { redirect } from "next/navigation"

export default async function SignalsPage() {
  const session = await getServerSession()
  if (!session) {
    redirect("/login")
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      role: { select: { name: true } },
      signalsAccessOverride: true,
      accessRequests: {
        where: { status: "APPROVED" },
        take: 1,
      },
    },
  })

  if (!user) {
    redirect("/login")
  }

  const isAdmin = user.role.name === "ADMIN" || user.role.name === "SUPER_ADMIN"
  const hasApprovedAccess = isAdmin || user.signalsAccessOverride || user.accessRequests.length > 0

  if (hasApprovedAccess) {
    return <SignalsView />
  }

  return <NoAccessView />
}

