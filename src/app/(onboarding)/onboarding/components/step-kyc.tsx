"use client"

import { useState, useEffect } from "react"
import { KycUploadForm } from "./kyc-upload-form"

const DB_NAME = "kyc-draft-store"
const STORE_NAME = "drafts"

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB non supporté"))
      return
    }
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function getDraft(key: string): Promise<any> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly")
      const store = transaction.objectStore(STORE_NAME)
      const request = store.get(key)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  } catch {
    return null
  }
}

async function clearDrafts(): Promise<void> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite")
      const store = transaction.objectStore(STORE_NAME)
      const request = store.clear()
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  } catch (err) {
    console.error("Failed to clear drafts", err)
  }
}

interface StepKycProps {
  onNext: () => void
}
export function StepKyc({ onNext }: StepKycProps) {
  const [initialDocType, setInitialDocType] = useState<string | undefined>(undefined)
  const [initialFront, setInitialFront] = useState<File | null>(null)
  const [initialBack, setInitialBack] = useState<File | null>(null)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    async function loadDrafts() {
      try {
        const type = await getDraft("documentType")
        const front = await getDraft("frontFile")
        const back = await getDraft("backFile")
        if (type) setInitialDocType(type)
        if (front) setInitialFront(front)
        if (back) setInitialBack(back)
      } catch (err) {
        console.error("Erreur lors du chargement des brouillons KYC :", err)
      } finally {
        setReady(true)
      }
    }
    loadDrafts()
  }, [])

  async function saveDraft(key: string, value: any): Promise<void> {
    try {
      const db = await openDB()
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readwrite")
        const store = transaction.objectStore(STORE_NAME)
        const request = store.put(value, key)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
    } catch (err) {
      console.error("Failed to save draft", err)
    }
  }

  async function deleteDraft(key: string): Promise<void> {
    try {
      const db = await openDB()
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readwrite")
        const store = transaction.objectStore(STORE_NAME)
        const request = store.delete(key)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
    } catch (err) {
      console.error("Failed to delete draft", err)
    }
  }

  if (!ready) return null

  return (
    <KycUploadForm
      animated
      initialDocumentType={initialDocType}
      initialFrontFile={initialFront}
      initialBackFile={initialBack}
      onStateChange={({ documentType, frontFile, backFile }) => {
        saveDraft("documentType", documentType)
        if (frontFile) saveDraft("frontFile", frontFile)
        else deleteDraft("frontFile")
        if (backFile) saveDraft("backFile", backFile)
        else deleteDraft("backFile")
      }}
      onSubmit={async (form) => {
        const res = await fetch("/api/onboarding/kyc", { method: "POST", body: form })
        const data = res.ok ? {} : await res.json()
        return { ok: res.ok, error: data.error }
      }}
      onSuccess={() => {
        clearDrafts()
        onNext()
      }}
    />
  )
}
