import { redirect } from "next/navigation"
import { getServerSession } from "@nba/lib/get-session"
import { prisma } from "@nba/lib/db"
import Link from "next/link"
import { User, Bell } from "lucide-react"
import { AppShell } from "@nba/app/components/app-shell"
import { MobileMenu } from "@nba/app/components/mobile-menu"
import { NotificationBell } from "@nba/components/notification-bell"
import { WelcomeGuide } from "./dashboard/welcome-guide"
import { CoachIA } from "@nba/components/coach-ia"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession()
  if (!session) redirect("/login")

  const userDb = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: { select: { name: true } } },
  })

  const user = {
    ...session.user,
    role: userDb?.role?.name,
  }

  const desktopHeader = (
    <header className="hidden md:flex items-center justify-between border-b bg-card/50 backdrop-blur-xl sticky top-0 z-40 px-6 py-2.5">
      <div className="flex items-center gap-2">
        <Bell className="size-4 text-muted-foreground/60" />
        <span className="text-sm font-medium text-muted-foreground/80">Tableau de bord</span>
      </div>
      <div className="flex items-center gap-3">
        <NotificationBell />
        <Link
          id="profile-nav"
          href="/dashboard/profile"
          className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted/50 transition-colors group"
          title="Modifier mon profil"
        >
          <div className="size-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <User className="size-3.5 text-primary" />
          </div>
          <span className="text-sm font-medium text-foreground/80 group-hover:text-foreground transition-colors">{user.name}</span>
        </Link>
      </div>
    </header>
  )

  const mobileHeader = (
    <header className="md:hidden border-b bg-card/80 backdrop-blur-xl sticky top-0 z-40 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <MobileMenu space="dashboard" user={user} />
        <div className="flex items-center gap-2 font-bold text-sm">
          <span className="text-primary font-extrabold">Never</span>BrokeAgain
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard/notifications"
          className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
          title="Notifications"
        >
          <Bell className="size-4" />
        </Link>
        <Link id="profile-nav" href="/dashboard/profile" title="Modifier mon profil">
          <div className="size-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
            <User className="size-3.5 text-primary" />
          </div>
        </Link>
      </div>
    </header>
  )

  return (
    <AppShell space="dashboard" user={user} desktopHeader={desktopHeader} mobileHeader={mobileHeader}>
      <WelcomeGuide />
      <CoachIA />
      {children}
    </AppShell>
  )
}
