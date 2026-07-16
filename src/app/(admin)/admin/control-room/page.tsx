import { redirect } from "next/navigation"

export default function ControlRoomRedirect() {
  redirect("/admin?tab=dashboard")
}
