import { msg } from "../messages"

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "video/mp4",
  "video/webm",
  // Audio — enregistreur vocal des Redpills (MediaRecorder → webm/ogg/mp4).
  "audio/webm",
  "audio/ogg",
  "audio/mpeg",
  "audio/mp4",
  "audio/wav",
  "audio/x-wav",
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
  // Signatures audio (cf. specs conteneurs) — un fichier qui ne matche pas est rejeté.
  "audio/webm": [new Uint8Array([0x1A, 0x45, 0xDF, 0xA3])],
  "audio/ogg": [new Uint8Array([0x4F, 0x67, 0x67, 0x53])], // "OggS"
  "audio/mpeg": [
    new Uint8Array([0x49, 0x44, 0x33]), // ID3
    new Uint8Array([0xFF, 0xFB]),
    new Uint8Array([0xFF, 0xF3]),
    new Uint8Array([0xFF, 0xF2]),
  ],
  "audio/mp4": [
    new Uint8Array([0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70]),
    new Uint8Array([0x00, 0x00, 0x00, 0x1C, 0x66, 0x74, 0x79, 0x70]),
    new Uint8Array([0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70]),
  ],
  "audio/wav": [new Uint8Array([0x52, 0x49, 0x46, 0x46])], // "RIFF"
  "audio/x-wav": [new Uint8Array([0x52, 0x49, 0x46, 0x46])],
}

const EXT_MAP: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "application/pdf": ".pdf",
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "audio/webm": ".webm",
  "audio/ogg": ".ogg",
  "audio/mpeg": ".mp3",
  "audio/mp4": ".m4a",
  "audio/wav": ".wav",
  "audio/x-wav": ".wav",
}

export function getBaseMime(file: File): string {
  return (file.type || "").split(";")[0].trim().toLowerCase()
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
  const rawMime = file.type || ""
  const mime = getBaseMime(file)

  if (!ALLOWED_MIME_TYPES.includes(mime)) {
    throw new Error(msg.storage.FILE_TYPE_NOT_ALLOWED(rawMime || mime, ALLOWED_MIME_TYPES.join(", ")))
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(msg.storage.FILE_TOO_LARGE((MAX_FILE_SIZE / 1024 / 1024).toFixed(0)))
  }

  if (file.size === 0) {
    throw new Error(msg.storage.FILE_EMPTY)
  }

  const headerBuffer = await file.slice(0, 12).arrayBuffer()
  if (!validateMagicBytes(headerBuffer, mime)) {
    throw new Error(msg.storage.CONTENT_MISMATCH(rawMime || mime))
  }
}

export function safeExtension(file: File): string {
  return sanitizeExtension(getBaseMime(file))
}
