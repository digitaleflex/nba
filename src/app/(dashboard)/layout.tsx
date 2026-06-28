import { redirect } from "next/navigation"
import { getServerSession } from "@nba/lib/get-session"
import { DashboardHeader } from "./components/dashboard-header"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession()
  if (!session) redirect("/login")

  return (
    <div className="flex min-h-dvh flex-col noise">
      <DashboardHeader user={session.user} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">{children}</main>
    </div>
  )
}
