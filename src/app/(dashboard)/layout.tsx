import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { auth } from "@nba/lib/auth"
import { DashboardHeader } from "./components/dashboard-header"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect("/login")

  return (
    <div className="flex min-h-dvh flex-col noise">
      <DashboardHeader user={session.user} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">{children}</main>
    </div>
  )
}
