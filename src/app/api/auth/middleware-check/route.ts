import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@nba/lib/auth"
import { prisma } from "@nba/lib/db"

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session) {
      return NextResponse.json({ session: null, onboardingStatus: null })
    }

    // Fetch the user status directly from database in a single query
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { onboardingStatus: true, emailVerified: true },
    })

    return NextResponse.json({
      session: {
        ...session,
        user: {
          ...session.user,
          emailVerified: user?.emailVerified ?? session.user.emailVerified,
        },
      },
      onboardingStatus: user?.onboardingStatus ?? null,
    })
  } catch (error) {
    console.error("[middleware-check] Error:", error)
    return NextResponse.json({ session: null, onboardingStatus: null })
  }
}
