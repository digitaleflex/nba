"use client"

import { useState, useEffect } from "react"
import { BrokerVerificationForm } from "./broker-verification-form"
import { useOnboardingPersistence } from "../hooks/use-onboarding-persistence"

interface StepBrokerProps {
  onNext: () => void
}

export function StepBroker({ onNext }: StepBrokerProps) {
  const { save, restore, clear } = useOnboardingPersistence()
  const [initialName, setInitialName] = useState("")
  const [initialId, setInitialId] = useState("")

  useEffect(() => {
    const saved = restore<{ brokerName: string; accountId: string }>("broker")
    if (saved) {
      setInitialName(saved.brokerName ?? "")
      setInitialId(saved.accountId ?? "")
    }
  }, [])

  return (
    <BrokerVerificationForm
      animated
      initialBrokerName={initialName}
      initialAccountId={initialId}
      onStateChange={({ brokerName, accountId }) => {
        save("broker", { brokerName, accountId })
      }}
      onSubmit={async (form) => {
        const res = await fetch("/api/onboarding/broker", { method: "POST", body: form })
        const data = res.ok ? {} : await res.json()
        return { ok: res.ok, error: data.error }
      }}
      onSuccess={() => {
        clear()
        onNext()
      }}
    />
  )
}
