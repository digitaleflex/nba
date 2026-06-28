import { Loader2 } from "lucide-react"

export default function AuthLoading() {
  return (
    <div className="flex items-center justify-center min-h-dvh">
      <Loader2 className="size-8 animate-spin text-primary" />
    </div>
  )
}
