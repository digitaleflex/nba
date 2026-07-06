import { resolve } from "path"
import { LocalStorageProvider } from "./local"
import { S3StorageProvider } from "./s3"
import type { StorageProvider } from "./types"

const STORAGE_PATH = resolve(process.cwd(), "storage")

let _instance: StorageProvider | null = null

export function getStorage(): StorageProvider {
  if (!_instance) {
    if (process.env.STORAGE_PROVIDER === "s3") {
      _instance = new S3StorageProvider()
    } else {
      _instance = new LocalStorageProvider(STORAGE_PATH)
    }
  }
  return _instance
}

export type { StorageProvider, UploadResult } from "./types"
