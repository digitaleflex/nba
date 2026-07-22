"use client"

import { useRouter } from "next/navigation"
import { KycUploadForm } from "../components/kyc-upload-form"

export default function KycPage() {
  const router = useRouter()

  return (
    <div className="max-w-lg mx-auto py-8">
      <KycUploadForm
        onSubmit={async (form) => {
          const res = await fetch("/api/onboarding/kyc", { method: "POST", body: form })
          const data = res.ok ? {} : await res.json()
          return { ok: res.ok, error: data.error }
        }}
        onSuccess={() => {
          router.push("/onboarding/broker")
          router.refresh()
        }}
      />
    </div>
  )
}
