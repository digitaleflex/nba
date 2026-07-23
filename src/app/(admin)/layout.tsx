import { redirect } from "next/navigation"
import { getServerSession } from "@nba/lib/get-session"
import { prisma } from "@nba/lib/db"
import { AppShell } from "@nba/app/components/app-shell"
import { MobileMenu } from "@nba/app/components/mobile-menu"
import { MobilePageTitle } from "@nba/app/components/mobile-page-title"
import { AdminHeader } from "./admin/components/admin-header"
import { AdminInbox } from "./admin/components/admin-inbox"
import { PageBreadcrumbs } from "@nba/app/components/breadcrumbs"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession()
  if (!session?.user) redirect("/login")

  let userRole: string | undefined
  try {
    const userDb = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: { select: { name: true } } },
    })
    userRole = userDb?.role?.name
  } catch {
    // DB error — fallback without role, will redirect below since role check fails
  }

  if (!userRole || (userRole !== "ADMIN" && userRole !== "SUPER_ADMIN")) {
    redirect("/403")
  }

  const user = {
    ...session.user,
    role: userRole,
  }

  const mobileHeader = (
    <header className="md:hidden border-b bg-background/80 backdrop-blur-md sticky top-0 z-40 px-4 py-2.5 flex items-center justify-between min-h-[52px]">
      <div className="flex items-center gap-3 min-w-0">
        <MobileMenu space="admin" user={user} />
        <MobilePageTitle />
      </div>
      <div className="flex items-center gap-2 ml-2">
        <AdminInbox />
        <span className="text-xs text-muted-foreground font-medium truncate hidden xs:inline">{user.name}</span>
      </div>
    </header>
  )

  return (
    <AppShell space="admin" user={user} desktopHeader={<AdminHeader user={user} />} desktopSubheader={<PageBreadcrumbs />} mobileHeader={mobileHeader}>
      {children}
    </AppShell>
  )
}
