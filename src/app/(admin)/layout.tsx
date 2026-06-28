import { redirect } from "next/navigation"
import { getServerSession } from "@nba/lib/get-session"
import { prisma } from "@nba/lib/db"
import { Sidebar } from "@nba/app/components/sidebar"
import { MobileBottomNav } from "@nba/app/components/mobile-bottom-nav"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession()
  if (!session) redirect("/login")

  const userDb = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: { select: { name: true } } },
  })

  if (!userDb || (userDb.role.name !== "ADMIN" && userDb.role.name !== "SUPER_ADMIN")) {
    redirect("/403")
  }

  const user = {
    ...session.user,
    role: userDb.role.name,
  }

  return (
    <div className="flex min-h-dvh flex-col md:flex-row noise">
      {/* Desktop Sidebar */}
      <Sidebar isAdmin={true} user={user} />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-y-auto pb-16 md:pb-0">
        {/* Mobile Header */}
        <header className="md:hidden border-b bg-card/40 backdrop-blur-md sticky top-0 z-40 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-sm">
            <span className="text-primary font-extrabold">Never</span>BrokeAgain
            <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold text-primary uppercase">
              Admin
            </span>
          </div>
          <span className="text-xs text-muted-foreground font-medium">{user.name}</span>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-8 md:py-8">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav isAdmin={true} user={user} />
    </div>
  )
}
