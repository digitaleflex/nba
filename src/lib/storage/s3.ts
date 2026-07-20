import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3"
import { Readable } from "stream"
import type { StorageProvider, UploadResult, FileStreamResult } from "./types"
import { validateUpload, safeExtension } from "./validate"

// ── QW5: S3 retry wrapper with exponential backoff ──

const S3_RETRY_MAX = 3;
const S3_RETRY_BASE_DELAY_MS = 500;
const S3_RETRYABLE_ERRORS = /ECONNRESET|EPIPE|ETIMEDOUT|ECONNREFUSED|socket hang up|Network Failure/i;

async function withS3Retry<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= S3_RETRY_MAX; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt >= S3_RETRY_MAX) throw err;
      const msg = err instanceof Error ? err.message : "";
      if (!S3_RETRYABLE_ERRORS.test(msg)) throw err;
      const delay = S3_RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
      console.warn(`[s3] Retry ${attempt + 1}/${S3_RETRY_MAX} after ${delay}ms:`, msg);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastError;
}

export class S3StorageProvider implements StorageProvider {
  private client: S3Client
  private bucket: string

  constructor() {
    const endpoint = process.env.MINIO_ENDPOINT
    const accessKeyId = process.env.MINIO_ROOT_USER
    const secretAccessKey = process.env.MINIO_ROOT_PASSWORD
    const bucket = process.env.MINIO_BUCKET_NAME

    if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
      throw new Error(
        "MinIO configuration incomplete. Set MINIO_ENDPOINT, MINIO_ROOT_USER, MINIO_ROOT_PASSWORD, and MINIO_BUCKET_NAME."
      )
    }

    this.client = new S3Client({
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: true,
      region: "us-east-1",
    })
    this.bucket = bucket
  }

  async upload(file: File, subDir: string): Promise<UploadResult> {
    await validateUpload(file)

    const fileName = `${crypto.randomUUID()}${safeExtension(file)}`
    const key = `${subDir}/${fileName}`
    const buffer = Buffer.from(await file.arrayBuffer())

    await withS3Retry(() =>
      this.client.send(new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      }))
    )

    return {
      path: key,
      fileName,
      mimeType: file.type,
      size: file.size,
    }
  }

  async delete(path: string): Promise<void> {
    await withS3Retry(() =>
      this.client.send(new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: path,
      }))
    )
  }

  getUrl(path: string): string {
    const endpoint = process.env.MINIO_ENDPOINT!
    return `${endpoint}/${this.bucket}/${path}`
  }

  async exists(path: string): Promise<boolean> {
    try {
      await withS3Retry(() =>
        this.client.send(new HeadObjectCommand({
          Bucket: this.bucket,
          Key: path,
        }))
      )
      return true
    } catch {
      return false
    }
  }

  async read(path: string): Promise<FileStreamResult> {
    const response = await withS3Retry(() =>
      this.client.send(new GetObjectCommand({
        Bucket: this.bucket,
        Key: path,
      }))
    )

    if (!response.Body) {
      throw new Error("Contenu du fichier vide")
    }

    // Le corps de réponse de GetObjectCommand sous Node.js est un stream Node.js
    const webStream = Readable.toWeb(response.Body as Readable) as ReadableStream

    return {
      stream: webStream,
      size: response.ContentLength ?? 0,
      mimeType: response.ContentType,
    }
  }
}
