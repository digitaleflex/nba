"use client"

import { useRouter } from "next/navigation"
import { BrokerVerificationForm } from "../components/broker-verification-form"
import { useFormDraft, getDraft } from "@nba/hooks/use-form-draft"

export default function BrokerPage() {
  const router = useRouter()
  const saved = getDraft<{ brokerName: string; accountId: string }>("broker")
  const { clear } = useFormDraft("broker", { brokerName: saved?.brokerName, accountId: saved?.accountId })

  return (
    <div className="max-w-lg mx-auto py-8">
      <BrokerVerificationForm
        initialBrokerName={saved?.brokerName}
        initialAccountId={saved?.accountId}
        onSubmit={async (form) => {
          const res = await fetch("/api/onboarding/broker", { method: "POST", body: form })
          const data = res.ok ? {} : await res.json()
          return { ok: res.ok, error: data.error }
        }}
        onSuccess={() => {
          clear()
          router.push("/onboarding")
          router.refresh()
        }}
      />
    </div>
  )
}
