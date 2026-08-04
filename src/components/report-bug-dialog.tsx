"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  cn,
} from "@nba/design-system"
import { Bug, Loader2, Check } from "lucide-react"
import { toast } from "sonner"
import { apiFetch } from "@nba/lib/fetch-client"

function collectContext() {
  return {
    url: typeof window !== "undefined" ? window.location.href : undefined,
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    platform: typeof navigator !== "undefined" ? navigator.platform : undefined,
    screen: typeof window !== "undefined" ? `${window.screen?.width ?? "?"}×${window.screen?.height ?? "?"}` : undefined,
    language: typeof navigator !== "undefined" ? navigator.language : undefined,
    timezone: (() => {
      try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone
      } catch {
        return undefined
      }
    })(),
  }
}

interface ReportBugDialogProps {
  className?: string
  variant?: "ghost" | "outline" | "default"
  size?: "icon" | "sm" | "default" | "icon-sm"
  label?: string
  onOpenChange?: (open: boolean) => void
}

export function ReportBugDialog({ className, variant = "ghost", size, label, onOpenChange }: ReportBugDialogProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [severity, setSeverity] = useState<"low" | "medium" | "high">("medium")
  const [steps, setSteps] = useState("")
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const reset = () => {
    setTitle("")
    setDescription("")
    setSeverity("medium")
    setSteps("")
    setSent(false)
  }

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) reset()
    onOpenChange?.(next)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    try {
      await apiFetch("/api/dashboard/bug-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          severity,
          steps: steps.trim() || undefined,
          context: collectContext(),
        }),
      })
      setSent(true)
      toast.success("Bug signalé ! Merci, notre équipe va l'examiner.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Impossible d'envoyer le signalement")
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Button
        type="button"
        variant={variant}
        size={size}
        className={cn("cursor-pointer gap-2", className)}
        onClick={() => setOpen(true)}
        aria-label="Signaler un bug"
      >
        <Bug className="size-4" />
        {label && <span>{label}</span>}
      </Button>

      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bug className="size-4 text-primary" /> Signaler un bug
          </DialogTitle>
          <DialogDescription>
            Décrivez le problème rencontré. Votre navigateur et la page sont capturés automatiquement pour nous aider.
          </DialogDescription>
        </DialogHeader>

        {sent ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <div className="size-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <Check className="size-6 text-emerald-500" />
            </div>
            <p className="font-semibold text-foreground">Signalement envoyé !</p>
            <p className="text-sm text-muted-foreground">
              Merci pour votre retour. Notre équipe va examiner ce bug.
            </p>
            <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => setOpen(false)}>Fermer</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="bug-title" className="text-sm font-medium text-foreground">Titre</label>
              <input
                id="bug-title"
                className="w-full p-2.5 text-sm rounded-lg border border-border bg-background text-foreground outline-none focus:border-primary/50"
                placeholder="Ex: Le graphique des signaux ne se charge pas"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="bug-desc" className="text-sm font-medium text-foreground">Description</label>
              <textarea
                id="bug-desc"
                className="w-full p-2.5 text-sm rounded-lg border border-border bg-background text-foreground outline-none focus:border-primary/50 resize-y min-h-24"
                placeholder="Ce qui s'est passé, ce que vous attendiez…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={3000}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="bug-steps" className="text-sm font-medium text-foreground">Étapes pour reproduire <span className="text-muted-foreground font-normal">(optionnel)</span></label>
              <textarea
                id="bug-steps"
                className="w-full p-2.5 text-sm rounded-lg border border-border bg-background text-foreground outline-none focus:border-primary/50 resize-y min-h-16"
                placeholder="1. Ouvrir les signaux  2. Cliquer sur …"
                value={steps}
                onChange={(e) => setSteps(e.target.value)}
                maxLength={2000}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Impact</label>
              <Select value={severity} onValueChange={(v) => setSeverity(v as "low" | "medium" | "high")}>
                <SelectTrigger className="w-full cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Mineur — gêne légère</SelectItem>
                  <SelectItem value="medium">Moyen — fonctionnalité dégradée</SelectItem>
                  <SelectItem value="high">Critique — blocage complet</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="ghost" size="sm" className="cursor-pointer" onClick={() => setOpen(false)}>Annuler</Button>
              <Button
                type="submit"
                size="sm"
                className="cursor-pointer gap-2"
                disabled={sending || title.trim().length < 3 || description.trim().length < 10}
              >
                {sending ? <Loader2 className="size-4 animate-spin" /> : <Bug className="size-4" />}
                {sending ? "Envoi..." : "Signaler"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
