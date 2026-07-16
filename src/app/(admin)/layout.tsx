import { redirect } from "next/navigation"
import { getServerSession } from "@nba/lib/get-session"
import { prisma } from "@nba/lib/db"
import { Sidebar } from "@nba/app/components/sidebar"
import { MobileBottomNav } from "@nba/app/components/mobile-bottom-nav"
import { MobileMenu } from "@nba/app/components/mobile-menu"
import { MobilePageTitle } from "@nba/app/components/mobile-page-title"
import { AdminHeader } from "./admin/components/admin-header"
import { MessagingUnreadProvider } from "@nba/lib/messaging-unread"
import { ErrorBoundary } from "@nba/app/components/error-boundary"

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
    <MessagingUnreadProvider>
      <div className="flex min-h-dvh flex-col md:flex-row noise">
        {/* Desktop Sidebar */}
        <Sidebar isAdmin={true} user={user} />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-y-auto pb-16 md:pb-0">
        {/* Desktop Header */}
        <AdminHeader user={user} />

        {/* Mobile Header */}
        <header className="md:hidden border-b bg-card/40 backdrop-blur-md sticky top-0 z-40 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <MobileMenu isAdmin={true} user={user} />
            <MobilePageTitle />
          </div>
          <span className="text-xs text-muted-foreground font-medium truncate ml-2">{user.name}</span>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-8 md:py-8">
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav isAdmin={true} user={user} />
      </div>
    </MessagingUnreadProvider>
  )
}
