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

// Magic bytes signatures pour valider le type réel du fichier
const MAGIC_BYTES: Record<string, Uint8Array[]> = {
  "image/jpeg": [new Uint8Array([0xFF, 0xD8, 0xFF])],
  "image/png": [new Uint8Array([0x89, 0x50, 0x4E, 0x47])],
  "image/webp": [new Uint8Array([0x52, 0x49, 0x46, 0x46])], // RIFF header
  "application/pdf": [new Uint8Array([0x25, 0x50, 0x44, 0x46])],
  "video/mp4": [new Uint8Array([0x00, 0x00, 0x00]), new Uint8Array([0x66, 0x74, 0x79, 0x70])], // ftyp box
  "video/webm": [new Uint8Array([0x1A, 0x45, 0xDF, 0xA3])],
}

function validateMagicBytes(buffer: ArrayBuffer, mimeType: string): boolean {
  const signatures = MAGIC_BYTES[mimeType]
  if (!signatures) return false
  const arr = new Uint8Array(buffer)
  return signatures.some(sig => sig.every((byte, i) => arr[i] === byte))
}

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

    // Validation par magic bytes pour vérifier le vrai type du fichier
    const arrayBuffer = await file.arrayBuffer()
    if (!validateMagicBytes(arrayBuffer, file.type)) {
      throw new Error(`Le contenu du fichier ne correspond pas au type déclaré : ${file.type}`)
    }
    const buffer = Buffer.from(arrayBuffer)

    const fileName = `${randomUUID()}${ext}`
    const dir = join(this.basePath, subDir)
    const filePath = join(dir, fileName)

    await mkdir(dir, { recursive: true })

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
