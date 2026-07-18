import { SignalsView } from "./components/signals-view"
import { getServerSession } from "@nba/lib/get-session"
import { redirect } from "next/navigation"

export default async function SignalsPage() {
  const session = await getServerSession()
  if (!session) {
    redirect("/login")
  }

  return <SignalsView />
}

