import { resolve } from "path"
import { LocalStorageProvider } from "./local"
import type { StorageProvider } from "./types"

const STORAGE_PATH = resolve(process.cwd(), "storage")

let _instance: StorageProvider | null = null

export function getStorage(): StorageProvider {
  if (!_instance) {
    _instance = new LocalStorageProvider(STORAGE_PATH)
  }
  return _instance
}

export type { StorageProvider, UploadResult } from "./types"
