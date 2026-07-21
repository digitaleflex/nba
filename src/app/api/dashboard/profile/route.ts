import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { requireActiveUser, handleAuthError } from "@nba/lib/auth-utils"
import { profileSchema, validateOrThrow } from "@nba/lib/validations"
import { msg } from "@nba/lib/messages"

export async function GET() {
  try {
    const session = await requireActiveUser()

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        phone: true,
        whatsapp: true,
        image: true,
        country: true,
        language: true,
        timezone: true,
        onboardingStatus: true,
        role: { select: { name: true } },
      },
    })

    if (!user) {
      return NextResponse.json({ error: msg.member.NOT_FOUND_ALT }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    return handleAuthError(error)
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await requireActiveUser()

    const body = await req.json()
    const input = validateOrThrow(profileSchema, body)

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.phone !== undefined && { phone: input.phone }),
        ...(input.whatsapp !== undefined && { whatsapp: input.whatsapp }),
        ...(input.country !== undefined && { country: input.country }),
        ...(input.language !== undefined && { language: input.language }),
        ...(input.timezone !== undefined && { timezone: input.timezone }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        phone: true,
        whatsapp: true,
        image: true,
        country: true,
        language: true,
        timezone: true,
        onboardingStatus: true,
        role: { select: { name: true } },
      },
    })

    return NextResponse.json({ user })
  } catch (error) {
    return handleAuthError(error)
  }
}
