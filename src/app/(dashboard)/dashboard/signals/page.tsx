import { SignalsView } from "./components/signals-view"
import { NoAccessView } from "./components/no-access-view"
import { PendingApprovalView } from "./components/pending-approval-view"
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
        select: { id: true, status: true, planId: true, createdAt: true, plan: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  })

  if (!user) {
    redirect("/login")
  }

  const isAdmin = user.role?.name === "ADMIN" || user.role?.name === "SUPER_ADMIN"
  const hasApprovedAccess = isAdmin || user.signalsAccessOverride || user.accessRequests.some((r) => r.status === "APPROVED")
  const pendingRequest = user.accessRequests.find((r) => r.status === "PENDING")

  if (hasApprovedAccess) {
    return <SignalsView />
  }

  if (pendingRequest) {
    return (
      <PendingApprovalView
        planName={pendingRequest.plan.name}
        requestedAt={pendingRequest.createdAt.toISOString()}
      />
    )
  }

  return <NoAccessView />
}

