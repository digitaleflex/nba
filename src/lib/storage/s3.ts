import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3"
import { Readable } from "stream"
import type { StorageProvider, UploadResult, FileStreamResult } from "./types"

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
    const ext = file.name.split(".").pop()
    const fileName = `${crypto.randomUUID()}.${ext || "bin"}`
    const key = `${subDir}/${fileName}`
    const buffer = Buffer.from(await file.arrayBuffer())

    await this.client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    }))

    return {
      path: key,
      fileName,
      mimeType: file.type,
      size: file.size,
    }
  }

  async delete(path: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: path,
    }))
  }

  getUrl(path: string): string {
    const endpoint = process.env.MINIO_ENDPOINT!
    return `${endpoint}/${this.bucket}/${path}`
  }

  async exists(path: string): Promise<boolean> {
    try {
      await this.client.send(new HeadObjectCommand({
        Bucket: this.bucket,
        Key: path,
      }))
      return true
    } catch {
      return false
    }
  }

  async read(path: string): Promise<FileStreamResult> {
    const response = await this.client.send(new GetObjectCommand({
      Bucket: this.bucket,
      Key: path,
    }))

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
