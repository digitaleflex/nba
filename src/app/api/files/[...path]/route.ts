import { NextRequest, NextResponse } from "next/server"
import { getStorage } from "@nba/lib/storage"
import { getServerSession } from "@nba/lib/get-session"
import { prisma } from "@nba/lib/db"
import { SignalPolicy } from "@nba/modules/signals/policies/signal-policy"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const session = await getServerSession()
  if (!session) {
    return new NextResponse("Non autorisé", { status: 401 })
  }

  const { path: pathSegments } = await params
  const filePath = pathSegments.join("/")

  if (filePath.includes("..") || filePath.startsWith("/") || filePath.includes("\\")) {
    return new NextResponse("Chemin invalide", { status: 400 })
  }

  const category = pathSegments[0]
  
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      role: {
        select: {
          name: true,
          permissions: {
            select: { permission: { select: { name: true } } }
          }
        }
      }
    }
  })

  if (!user) {
    return new NextResponse("Utilisateur non trouvé", { status: 404 })
  }

  const isAdmin = user.role.name === "ADMIN" || user.role.name === "SUPER_ADMIN"
  const hasPermission = (perm: string) => user.role.permissions.some((rp: any) => rp.permission.name === perm)

  let actualFilePath = filePath

  if (category === "kyc") {
    // Si l'URL a 3 segments : kyc/docId/document_recto ou kyc/docId/document_verso
    if (pathSegments.length === 3) {
      const docId = pathSegments[1]
      const fileType = pathSegments[2]

      const doc = await prisma.kycDocument.findUnique({
        where: { id: docId }
      })

      if (!doc) {
        return new NextResponse("Document non trouvé", { status: 404 })
      }

      // Sécurité : Seul le propriétaire ou les admins peuvent visualiser
      if (!isAdmin && !hasPermission("kyc.review") && doc.userId !== session.user.id) {
        return new NextResponse("Accès refusé", { status: 403 })
      }

      if (fileType === "document_recto") {
        actualFilePath = doc.frontFilePath
      } else if (fileType === "document_verso") {
        if (!doc.backFilePath) {
          return new NextResponse("Fichier non trouvé", { status: 404 })
        }
        actualFilePath = doc.backFilePath
      } else {
        return new NextResponse("Type de fichier invalide", { status: 400 })
      }
    } else {
      if (!isAdmin && !hasPermission("kyc.review")) {
        const ownsDoc = await prisma.kycDocument.findFirst({
          where: {
            userId: session.user.id,
            OR: [
              { frontFilePath: filePath },
              { backFilePath: filePath }
            ]
          }
        })
        if (!ownsDoc) {
          return new NextResponse("Accès refusé", { status: 403 })
        }
      }
    }
  } else if (category === "broker") {
    if (!isAdmin && !hasPermission("broker.review")) {
      const ownsDoc = await prisma.brokerVerification.findFirst({
        where: {
          userId: session.user.id,
          videoFilePath: filePath
        }
      })
      if (!ownsDoc) {
        return new NextResponse("Accès refusé", { status: 403 })
      }
    }
  } else if (category === "signals") {
    if (!isAdmin) {
      // Check imageUrl first (most common case), then check imageUrls JSONB array
      const matchingSignal = await prisma.signal.findFirst({
        where: {
          deletedAt: null,
          imageUrl: filePath,
        },
        select: { id: true },
      }) ?? await prisma.signal.findFirst({
        where: {
          deletedAt: null,
          imageUrls: { path: "$", array_contains: filePath } as any,
        },
        select: { id: true },
      })

      if (matchingSignal) {
        const hasAccess = await SignalPolicy.canView(session.user.id, matchingSignal.id)
        if (!hasAccess) {
          return new NextResponse("Accès refusé", { status: 403 })
        }
      } else {
        // If it's a draft and not published yet, only creators/admins can view it
        if (!hasPermission("signals.create")) {
          return new NextResponse("Accès refusé", { status: 403 })
        }
      }
    }
  } else {
    return new NextResponse("Catégorie de fichier inconnue", { status: 400 })
  }

  const storage = getStorage()
  const exists = await storage.exists(actualFilePath)
  if (!exists) {
    return new NextResponse("Fichier non trouvé", { status: 404 })
  }

  try {
    const { stream, size, mimeType } = await storage.read(actualFilePath)
    
    let contentType = mimeType ?? "application/octet-stream"
    if (!mimeType) {
      if (actualFilePath.endsWith(".jpg") || actualFilePath.endsWith(".jpeg")) contentType = "image/jpeg"
      else if (actualFilePath.endsWith(".png")) contentType = "image/png"
      else if (actualFilePath.endsWith(".webp")) contentType = "image/webp"
      else if (actualFilePath.endsWith(".pdf")) contentType = "application/pdf"
      else if (actualFilePath.endsWith(".mp4")) contentType = "video/mp4"
      else if (actualFilePath.endsWith(".webm")) contentType = "video/webm"
    }

    return new NextResponse(stream, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": size.toString(),
        "Cache-Control": "private, max-age=31536000, immutable",
      }
    })
  } catch (error) {
    console.error("Erreur lors de la lecture du fichier :", error)
    return new NextResponse("Erreur lors de la lecture du fichier", { status: 500 })
  }
}
