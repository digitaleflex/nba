export const REQUEST_STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  APPROVED: "Approuvé",
  REJECTED: "Rejeté",
  SUSPENDED: "Suspendu",
  REVOKED: "Révoqué",
}

export const REQUEST_STATUS_CLASS: Record<string, string> = {
  PENDING: "text-amber-600 border-amber-500/20 bg-amber-500/10",
  APPROVED: "text-emerald-600 border-emerald-500/20 bg-emerald-500/10",
  REJECTED: "text-rose-600 border-rose-500/20 bg-rose-500/10",
  SUSPENDED: "text-orange-600 border-orange-500/20 bg-orange-500/10",
  REVOKED: "text-rose-700 border-rose-600/20 bg-rose-600/10",
}

export const REQUEST_FILTERS: { value: string; label: string }[] = [
  { value: "ALL", label: "Tous" },
  { value: "PENDING", label: "En attente" },
  { value: "APPROVED", label: "Approuvés" },
  { value: "REJECTED", label: "Rejetés" },
  { value: "SUSPENDED", label: "Suspendus" },
  { value: "REVOKED", label: "Révoqués" },
]

export const REJECT_REASONS: string[] = [
  "Documents KYC incomplets",
  "Identité non vérifiée",
  "Broker non vérifié",
  "Paiement ou abonnement requis",
  "Doublon de compte",
  "Autre",
]
