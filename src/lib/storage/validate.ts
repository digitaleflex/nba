import { msg } from "../messages"

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "video/mp4",
  "video/webm",
]

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50 MB

const MAGIC_BYTES: Record<string, Uint8Array[]> = {
  "image/jpeg": [new Uint8Array([0xFF, 0xD8, 0xFF])],
  "image/png": [new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])],
  "image/webp": [new Uint8Array([0x52, 0x49, 0x46, 0x46])],
  "application/pdf": [new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2D])],
  "video/mp4": [
    new Uint8Array([0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70]), // ftyp box standard
    new Uint8Array([0x00, 0x00, 0x00, 0x1C, 0x66, 0x74, 0x79, 0x70]), // ftyp box variante
    new Uint8Array([0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70]), // ftyp box large
  ],
  "video/webm": [new Uint8Array([0x1A, 0x45, 0xDF, 0xA3])],
}

const EXT_MAP: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "application/pdf": ".pdf",
  "video/mp4": ".mp4",
  "video/webm": ".webm",
}

function validateMagicBytes(buffer: ArrayBuffer, mimeType: string): boolean {
  const signatures = MAGIC_BYTES[mimeType]
  if (!signatures) return false
  const arr = new Uint8Array(buffer)
  return signatures.some((sig) => sig.every((byte, i) => arr[i] === byte))
}

function sanitizeExtension(mime: string): string {
  return EXT_MAP[mime] ?? ".bin"
}

export async function validateUpload(file: File): Promise<void> {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error(msg.storage.FILE_TYPE_NOT_ALLOWED(file.type, ALLOWED_MIME_TYPES.join(", ")))
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(msg.storage.FILE_TOO_LARGE((MAX_FILE_SIZE / 1024 / 1024).toFixed(0)))
  }

  if (file.size === 0) {
    throw new Error(msg.storage.FILE_EMPTY)
  }

  const headerBuffer = await file.slice(0, 12).arrayBuffer()
  if (!validateMagicBytes(headerBuffer, file.type)) {
    throw new Error(msg.storage.CONTENT_MISMATCH(file.type))
  }
}

export function safeExtension(file: File): string {
  return sanitizeExtension(file.type)
}
