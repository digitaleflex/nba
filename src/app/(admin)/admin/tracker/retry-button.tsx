"use client"

import { useActionState } from "react"
import { toast } from "sonner"
import { RotateCw } from "lucide-react"

export function RetryButton({ serverAction }: { serverAction: () => Promise<{ count: number }> }) {
  const [, action, pending] = useActionState(async () => {
    const result = await serverAction()
    if (result && result.count > 0) {
      toast.success(`${result.count} job${result.count > 1 ? "s" : ""} relancé${result.count > 1 ? "s" : ""}`)
    } else {
      toast.info("Aucun job en échec")
    }
    return result
  }, null)

  return (
    <form action={action}>
      <button
        type="submit"
        disabled={pending}
        className="h-9 rounded-lg border border-amber-500/30 text-amber-600 bg-amber-500/5 px-4 text-xs font-medium hover:bg-amber-500/10 disabled:opacity-50 inline-flex items-center gap-1.5"
      >
        {pending && <RotateCw className="size-3 animate-spin" />}
        {pending ? "Relance..." : "Re-tenter les jobs échoués"}
      </button>
    </form>
  )
}