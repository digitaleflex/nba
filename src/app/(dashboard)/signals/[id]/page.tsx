import { redirect } from "next/navigation"

export default async function OldSignalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  redirect(`/dashboard/signals/${id}`)
}
