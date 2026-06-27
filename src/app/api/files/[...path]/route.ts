import { NextRequest, NextResponse } from "next/server"
import { getStorage } from "@nba/lib/storage"
import { createReadStream } from "fs"
import { stat } from "fs/promises"
import { getServerSession } from "@nba/lib/get-session"
import { prisma } from "@nba/lib/db"

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
  const hasPermission = (perm: string) => user.role.permissions.some(rp => rp.permission.name === perm)

  if (category === "kyc") {
    if (!isAdmin && !hasPermission("kyc.review")) {
      const ownsDoc = await prisma.kycDocument.findFirst({
        where: {
          userId: session.user.id,
          OR: [
            { frontFilePath: filePath },
            { backFilePath: filePath },
            { selfieFilePath: filePath }
          ]
        }
      })
      if (!ownsDoc) {
        return new NextResponse("Accès refusé", { status: 403 })
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
      const activeAccess = await prisma.accessRequest.findFirst({
        where: {
          userId: session.user.id,
          status: "APPROVED"
        }
      })
      if (!activeAccess) {
        return new NextResponse("Accès refusé", { status: 403 })
      }
    }
  } else {
    return new NextResponse("Catégorie de fichier inconnue", { status: 400 })
  }

  const storage = getStorage()
  const exists = await storage.exists(filePath)
  if (!exists) {
    return new NextResponse("Fichier non trouvé", { status: 404 })
  }

  const absolutePath = storage.getUrl(filePath)
  const fileStat = await stat(absolutePath)
  
  let contentType = "application/octet-stream"
  if (filePath.endsWith(".jpg") || filePath.endsWith(".jpeg")) contentType = "image/jpeg"
  else if (filePath.endsWith(".png")) contentType = "image/png"
  else if (filePath.endsWith(".webp")) contentType = "image/webp"
  else if (filePath.endsWith(".pdf")) contentType = "application/pdf"
  else if (filePath.endsWith(".mp4")) contentType = "video/mp4"
  else if (filePath.endsWith(".webm")) contentType = "video/webm"

  const fileStream = createReadStream(absolutePath)
  
  const webStream = new ReadableStream({
    start(controller) {
      fileStream.on("data", (chunk) => controller.enqueue(chunk))
      fileStream.on("end", () => controller.close())
      fileStream.on("error", (err) => controller.error(err))
    },
    cancel() {
      fileStream.destroy()
    }
  })

  return new NextResponse(webStream, {
    headers: {
      "Content-Type": contentType,
      "Content-Length": fileStat.size.toString(),
      "Cache-Control": "private, max-age=31536000, immutable",
    }
  })
}
