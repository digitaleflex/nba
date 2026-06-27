import { randomUUID } from "crypto"
import { mkdir, unlink, access } from "fs/promises"
import { join, extname } from "path"
import type { StorageProvider, UploadResult } from "./types"

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "video/mp4",
  "video/webm",
]

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50 MB

function sanitizeExtension(mime: string): string {
  const map: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "application/pdf": ".pdf",
    "video/mp4": ".mp4",
    "video/webm": ".webm",
  }
  return map[mime] ?? ".bin"
}

export class LocalStorageProvider implements StorageProvider {
  constructor(private basePath: string) {}

  async upload(file: File, subDir: string): Promise<UploadResult> {
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      throw new Error(`Type de fichier non autorisé : ${file.type}`)
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`Fichier trop volumineux (max ${MAX_FILE_SIZE / 1024 / 1024} MB)`)
    }

    const ext = sanitizeExtension(file.type)
    const fileName = `${randomUUID()}${ext}`
    const dir = join(this.basePath, subDir)
    const filePath = join(dir, fileName)

    await mkdir(dir, { recursive: true })

    const buffer = Buffer.from(await file.arrayBuffer())
    const { writeFile } = await import("fs/promises")
    await writeFile(filePath, buffer)

    return {
      path: join(subDir, fileName),
      fileName,
      mimeType: file.type,
      size: file.size,
    }
  }

  async delete(path: string): Promise<void> {
    const fullPath = join(this.basePath, path)
    await unlink(fullPath)
  }

  getUrl(path: string): string {
    return join(this.basePath, path)
  }

  async exists(path: string): Promise<boolean> {
    const fullPath = join(this.basePath, path)
    try {
      await access(fullPath)
      return true
    } catch {
      return false
    }
  }
}
