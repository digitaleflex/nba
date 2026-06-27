import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { auth } from "@nba/lib/auth"
import { prisma } from "@nba/lib/db"
import { LogoutButton } from "@nba/app/components/logout-button"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect("/login")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: { select: { name: true } } },
  })

  if (!user || (user.role.name !== "Admin" && user.role.name !== "SUPER_ADMIN")) {
    redirect("/403")
  }

  return (
    <div className="flex min-h-dvh flex-col noise">
      <header className="glass-strong sticky top-0 z-50 border-b px-6 py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold">
              <span className="text-primary">Never</span>BrokeAgain
            </span>
            <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{session.user.name}</span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">{children}</main>
    </div>
  )
}
