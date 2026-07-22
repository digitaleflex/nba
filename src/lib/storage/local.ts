import { randomUUID } from "crypto"
import { mkdir, unlink, access, writeFile, stat } from "fs/promises"
import { resolve, normalize } from "path"
import { createReadStream } from "fs"
import type { StorageProvider, UploadResult, FileStreamResult } from "./types"
import { validateUpload, safeExtension } from "./validate"

function safePath(basePath: string, ...paths: string[]): string {
  const resolved = resolve(basePath, ...paths)
  const normalized = normalize(resolved)
  const base = normalize(resolve(basePath))
  if (!normalized.startsWith(base)) {
    throw new Error("Path traversal detected")
  }
  return normalized
}

export class LocalStorageProvider implements StorageProvider {
  constructor(private basePath: string) {
    this.basePath = resolve(basePath)
  }

  async upload(file: File, subDir: string): Promise<UploadResult> {
    await validateUpload(file)

    const fileName = `${randomUUID()}${safeExtension(file)}`
    const dir = safePath(this.basePath, subDir)
    const filePath = safePath(this.basePath, subDir, fileName)

    await mkdir(dir, { recursive: true })

    // Écriture directe via buffer pour éviter les blocages de flux Web API dans Next.js
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(filePath, buffer)

    return {
      path: `${subDir}/${fileName}`,
      fileName,
      mimeType: file.type,
      size: file.size,
    }
  }

  async delete(path: string): Promise<void> {
    const fullPath = safePath(this.basePath, path)
    await unlink(fullPath)
  }

  getUrl(path: string): string {
    return safePath(this.basePath, path)
  }

  async exists(path: string): Promise<boolean> {
    const fullPath = safePath(this.basePath, path)
    try {
      await access(fullPath)
      return true
    } catch {
      return false
    }
  }

  async read(path: string): Promise<FileStreamResult> {
    const fullPath = safePath(this.basePath, path)
    const fileStat = await stat(fullPath)
    const fileStream = createReadStream(fullPath)
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
    return {
      stream: webStream,
      size: fileStat.size,
    }
  }
}
