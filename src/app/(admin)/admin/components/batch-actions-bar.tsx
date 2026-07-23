"use client"

import { useCallback, useState } from "react"
import { toast } from "sonner"
import { X, CheckCheck, Ban, RotateCw, Trash2, Loader2 } from "lucide-react"

interface BatchActionsBarProps {
  selectedIds: Set<string>
  onClear: () => void
  onSuccess: () => void
}

export function BatchActionsBar({ selectedIds, onClear, onSuccess }: BatchActionsBarProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const count = selectedIds.size

  const batchAction = useCallback(async (action: string, body: Record<string, unknown>) => {
    setLoading(action)
    try {
      const res = await fetch("/api/admin/members", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: Array.from(selectedIds), ...body }),
      })
      if (res.ok) {
        toast.success(`${count} membre${count > 1 ? "s" : ""} ${action === "activate" ? "activé" : action === "suspend" ? "suspendu" : "forcé"}`)
        onClear()
        onSuccess()
      } else {
        const data = await res.json()
        toast.error(data.error || "Erreur lors de l'action")
      }
    } catch {
      toast.error("Erreur réseau")
    } finally {
      setLoading(null)
    }
  }, [selectedIds, count, onClear, onSuccess])

  const batchDelete = useCallback(async () => {
    const confirmed = confirm(
      `Supprimer ${count} membre${count > 1 ? "s" : ""} ?\n\n` +
      `Seuls les membres inactifs seront supprimés. Cette action est irréversible.`
    )
    if (!confirmed) return

    setLoading("delete")
    try {
      const res = await fetch("/api/admin/members/batch-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: Array.from(selectedIds) }),
      })
      if (res.ok) {
        toast.success(`${count} membre${count > 1 ? "s" : ""} supprimé${count > 1 ? "s" : ""}`)
        onClear()
        onSuccess()
      } else {
        const data = await res.json()
        toast.error(data.error || "Erreur lors de la suppression")
      }
    } catch {
      toast.error("Erreur réseau")
    } finally {
      setLoading(null)
    }
  }, [selectedIds, count, onClear, onSuccess])

  if (count === 0) return null

  return (
    <div className="sticky top-0 z-40 -mx-2 px-2 animate-in slide-in-from-top-2 duration-200">
      <div className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-4 py-2.5 shadow-lg backdrop-blur-sm">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="inline-flex size-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            {count}
          </span>
          <span className="text-sm font-medium text-foreground truncate">
            {count} membre{count > 1 ? "s" : ""} sélectionné{count > 1 ? "s" : ""}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => batchAction("activate", { isActive: true })}
            disabled={loading !== null}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-emerald-600 hover:bg-emerald-500/10 transition-colors disabled:opacity-50 cursor-pointer"
            title="Activer les membres sélectionnés"
          >
            {loading === "activate" ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCheck className="size-3.5" />}
            <span className="hidden sm:inline">Activer</span>
          </button>

          <button
            onClick={() => batchAction("suspend", { isActive: false })}
            disabled={loading !== null}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-amber-600 hover:bg-amber-500/10 transition-colors disabled:opacity-50 cursor-pointer"
            title="Suspendre les membres sélectionnés"
          >
            {loading === "suspend" ? <Loader2 className="size-3.5 animate-spin" /> : <Ban className="size-3.5" />}
            <span className="hidden sm:inline">Suspendre</span>
          </button>

          <button
            onClick={() => batchAction("force_onboarding", { onboardingStatus: "ACTIVE" })}
            disabled={loading !== null}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-500/10 transition-colors disabled:opacity-50 cursor-pointer"
            title="Forcer l'onboarding des membres sélectionnés"
          >
            {loading === "force_onboarding" ? <Loader2 className="size-3.5 animate-spin" /> : <RotateCw className="size-3.5" />}
            <span className="hidden sm:inline">Onboarding</span>
          </button>

          <button
            onClick={batchDelete}
            disabled={loading !== null}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-500/10 transition-colors disabled:opacity-50 cursor-pointer"
            title="Supprimer les membres inactifs sélectionnés"
          >
            {loading === "delete" ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
            <span className="hidden sm:inline">Supprimer</span>
          </button>

          <div className="w-px h-5 bg-border mx-1" />

          <button
            onClick={onClear}
            disabled={loading !== null}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-50 cursor-pointer"
            title="Désélectionner tout"
          >
            <X className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
