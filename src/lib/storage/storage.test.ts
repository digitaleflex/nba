import { vi, describe, it, expect, beforeEach, afterEach } from "vitest"
import { join } from "path"
import { rm, mkdir, access } from "fs/promises"
import { Readable } from "stream"
import { LocalStorageProvider } from "./local"
import { S3StorageProvider } from "./s3"
import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3"

const mockSend = vi.fn()

vi.mock("@aws-sdk/client-s3", async () => {
  return {
    S3Client: class {
      send = mockSend
    },
    PutObjectCommand: class {
      constructor(public input: any) {}
    },
    DeleteObjectCommand: class {
      constructor(public input: any) {}
    },
    HeadObjectCommand: class {
      constructor(public input: any) {}
    },
    GetObjectCommand: class {
      constructor(public input: any) {}
    },
  }
})

describe("LocalStorageProvider", () => {
  const testDir = join(process.cwd(), "storage-test-temp")
  let provider: LocalStorageProvider

  beforeEach(async () => {
    provider = new LocalStorageProvider(testDir)
    await mkdir(testDir, { recursive: true })
  })

  afterEach(async () => {
    try {
      await rm(testDir, { recursive: true, force: true })
    } catch {}
  })

  it("should successfully lifecycle a file (upload, exists, read, delete)", async () => {
    // 1. Upload
    // Image JPEG factice (magic bytes valide: 0xFF, 0xD8, 0xFF)
    const content = new Uint8Array([0xFF, 0xD8, 0xFF, 0x00, 0x01, 0x02, 0x03, 0x04])
    const file = new File([content], "test-image.jpg", { type: "image/jpeg" })
    
    const result = await provider.upload(file, "test-sub")
    expect(result.path).toContain("test-sub/")
    expect(result.mimeType).toBe("image/jpeg")

    // 2. Exists
    const isPresent = await provider.exists(result.path)
    expect(isPresent).toBe(true)

    // 3. Read
    const readResult = await provider.read(result.path)
    expect(readResult.size).toBe(content.length)
    
    // Lire le flux web retourné
    const reader = readResult.stream.getReader()
    let readBytes = new Uint8Array(0)
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const newBytes = new Uint8Array(readBytes.length + value.length)
      newBytes.set(readBytes)
      newBytes.set(value, readBytes.length)
      readBytes = newBytes
    }
    expect(readBytes).toEqual(content)

    // 4. Delete
    await provider.delete(result.path)
    const existsAfterDelete = await provider.exists(result.path)
    expect(existsAfterDelete).toBe(false)
  })

  it("should reject disallowed MIME types", async () => {
    const file = new File(["malicious code"], "exploit.exe", { type: "application/x-msdownload" })
    await expect(provider.upload(file, "test-sub")).rejects.toThrow("Type de fichier non autorisé")
  })

  it("should reject files with invalid magic bytes", async () => {
    // Contenu PNG factice mais type JPEG déclaré
    const content = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])
    const file = new File([content], "fake-image.jpg", { type: "image/jpeg" })
    await expect(provider.upload(file, "test-sub")).rejects.toThrow("Le contenu du fichier ne correspond pas au type déclaré")
  })
})

describe("S3StorageProvider", () => {
  let provider: S3StorageProvider

  beforeEach(() => {
    vi.clearAllMocks()
    provider = new S3StorageProvider()
  })

  it("should call PutObjectCommand on upload", async () => {
    mockSend.mockResolvedValueOnce({})
    
    const content = new Uint8Array([0x00, 0x01, 0x02])
    const file = new File([content], "test.jpg", { type: "image/jpeg" })

    const result = await provider.upload(file, "kyc")
    
    expect(mockSend).toHaveBeenCalledTimes(1)
    const callArgs = mockSend.mock.calls[0][0]
    expect(callArgs).toBeInstanceOf(PutObjectCommand)
    expect(callArgs.input).toEqual({
      Bucket: "nba-assets",
      Key: result.path,
      Body: expect.any(Buffer),
      ContentType: "image/jpeg",
    })
    expect(result.path).toContain("kyc/")
  })

  it("should call DeleteObjectCommand on delete", async () => {
    mockSend.mockResolvedValueOnce({})

    await provider.delete("kyc/some-file.jpg")

    expect(mockSend).toHaveBeenCalledTimes(1)
    const callArgs = mockSend.mock.calls[0][0]
    expect(callArgs).toBeInstanceOf(DeleteObjectCommand)
    expect(callArgs.input).toEqual({
      Bucket: "nba-assets",
      Key: "kyc/some-file.jpg",
    })
  })

  it("should call HeadObjectCommand and return true on exists", async () => {
    mockSend.mockResolvedValueOnce({})

    const res = await provider.exists("kyc/some-file.jpg")
    expect(res).toBe(true)

    expect(mockSend).toHaveBeenCalledTimes(1)
    const callArgs = mockSend.mock.calls[0][0]
    expect(callArgs).toBeInstanceOf(HeadObjectCommand)
  })

  it("should call HeadObjectCommand and return false on failure", async () => {
    mockSend.mockRejectedValueOnce(new Error("NotFound"))

    const res = await provider.exists("kyc/some-file.jpg")
    expect(res).toBe(false)
  })

  it("should call GetObjectCommand and stream content on read", async () => {
    const mockContent = Buffer.from("hello world S3")
    const mockNodeStream = Readable.from(mockContent)
    
    mockSend.mockResolvedValueOnce({
      Body: mockNodeStream,
      ContentLength: mockContent.length,
      ContentType: "text/plain",
    })

    const readResult = await provider.read("kyc/test.txt")
    expect(readResult.size).toBe(mockContent.length)
    expect(readResult.mimeType).toBe("text/plain")

    // Lire le flux web retourné
    const reader = readResult.stream.getReader()
    let readBytes = new Uint8Array(0)
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const newBytes = new Uint8Array(readBytes.length + value.length)
      newBytes.set(readBytes)
      newBytes.set(value, readBytes.length)
      readBytes = newBytes
    }
    
    expect(Buffer.from(readBytes).toString()).toBe("hello world S3")
    expect(mockSend).toHaveBeenCalledTimes(1)
    const callArgs = mockSend.mock.calls[0][0]
    expect(callArgs).toBeInstanceOf(GetObjectCommand)
  })
})
