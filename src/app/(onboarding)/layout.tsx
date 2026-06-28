import { redirect } from "next/navigation"
import { getServerSession } from "@nba/lib/get-session"

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession()
  if (!session) redirect("/login")

  return (
    <div className="flex min-h-dvh flex-col noise">
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-8">
        {children}
      </main>
    </div>
  )
}
