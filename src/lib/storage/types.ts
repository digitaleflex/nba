export interface UploadResult {
  path: string
  fileName: string
  mimeType: string
  size: number
}

export interface FileStreamResult {
  stream: ReadableStream
  size: number
  mimeType?: string
}

export interface StorageProvider {
  upload(file: File, subDir: string): Promise<UploadResult>
  delete(path: string): Promise<void>
  getUrl(path: string): string
  exists(path: string): Promise<boolean>
  read(path: string): Promise<FileStreamResult>
}
