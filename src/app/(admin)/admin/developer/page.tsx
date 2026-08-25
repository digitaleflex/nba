import { getServerSession } from "@nba/lib/get-session"
import { prisma } from "@nba/lib/db"
import { DeveloperConsole } from "./console"

export const dynamic = "force-dynamic"

export default async function DeveloperPage() {
  const session = await getServerSession()

  let isSuperAdmin = false
  if (session?.user) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: { select: { name: true } } },
    })
    isSuperAdmin = user?.role.name === "SUPER_ADMIN"
  }

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-24 text-center">
        <h1 className="text-xl font-bold tracking-tight text-foreground">Console développeur</h1>
        <p className="text-xs text-muted-foreground max-w-sm">
          La console de développement est réservée au SUPER_ADMIN.
        </p>
      </div>
    )
  }

  return <DeveloperConsole />
}
