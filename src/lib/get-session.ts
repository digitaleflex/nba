import { cache } from "react"
import { headers } from "next/headers"
import { auth } from "./auth"

export const getServerSession = cache(async () => {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    return session
  } catch {
    return null
  }
})
