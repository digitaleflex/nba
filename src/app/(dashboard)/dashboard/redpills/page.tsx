import { RedpillsView } from "./components/redpills-view"
import { getServerSession } from "@nba/lib/get-session"
import { redirect } from "next/navigation"

export const metadata = {
  title: "Redpills — Pilule du jour",
}

export default async function RedpillsPage() {
  const session = await getServerSession()
  if (!session) redirect("/login")
  return <RedpillsView />
}
