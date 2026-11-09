import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { requireAdmin, adminError } from "../_auth"
import { csrfCheck } from "@nba/lib/csrf"

// PUT /api/admin/redpills/[id] — modifier une pilule
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const csrf = csrfCheck(req)
  if (csrf) return csrf
  try {
    await requireAdmin()
    const { id } = await params
    const body = await req.json()
    const { title, content, audioUrl, imageUrl, videoUrl, isPublished } = body ?? {}

    const clean = (v: unknown) =>
      typeof v === "string" && v.trim() ? v.trim() : v === null ? null : undefined

    const redpill = await prisma.redpill.update({
      where: { id },
      data: {
        ...(typeof title === "string" && title.trim() ? { title: title.trim() } : {}),
        ...(content !== undefined ? { content: clean(content) ?? null } : {}),
        ...(audioUrl !== undefined ? { audioUrl: clean(audioUrl) ?? null } : {}),
        ...(imageUrl !== undefined ? { imageUrl: clean(imageUrl) ?? null } : {}),
        ...(videoUrl !== undefined ? { videoUrl: clean(videoUrl) ?? null } : {}),
        ...(typeof isPublished === "boolean" ? { isPublished } : {}),
      },
    })

    return NextResponse.json(redpill)
  } catch (error) {
    return adminError(error)
  }
}

// DELETE /api/admin/redpills/[id] — supprimer une pilule
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const csrf = csrfCheck(req)
  if (csrf) return csrf
  try {
    await requireAdmin()
    const { id } = await params
    await prisma.redpill.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return adminError(error)
  }
}
