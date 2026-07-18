import { redirect } from "next/navigation"

// Le tableau de bord redirige directement vers le flux de signaux : c'est la
// valeur centrale du produit. L'utilisateur arrive ainsi immediatement sur ce
// qu'il vient chercher, sans etape intermediaire.
export default function DashboardPage() {
  redirect("/dashboard/signals")
}
