import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { requirePermission, handleAuthError } from "@nba/lib/auth-utils"
import { z } from "zod"

const templateSchema = z.object({
  name: z.string().min(1, "Le nom du modèle est requis"),
  content: z.string().min(1, "Le contenu du modèle est requis"),
})

export async function GET() {
  try {
    await requirePermission("signals.create")

    const templates = await prisma.signalTemplate.findMany({
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(templates)
  } catch (err) {
    return handleAuthError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    await requirePermission("signals.create")

    const body = await req.json()
    const parsed = templateSchema.parse(body)

    const template = await prisma.signalTemplate.create({
      data: {
        name: parsed.name,
        content: parsed.content,
      },
    })

    return NextResponse.json(template, { status: 201 })
  } catch (err) {
    return handleAuthError(err)
  }
}
