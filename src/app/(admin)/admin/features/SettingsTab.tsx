"use client"

import { useEffect, useState, useCallback } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, Input, Button } from "@nba/design-system"
import { CachedGet } from "./types"

interface SettingsTabProps {
  cachedGet: CachedGet
}

export function SettingsTab({ cachedGet }: SettingsTabProps) {
  const [settings, setSettings] = useState({
    smtpHost: "",
    smtpPort: "",
    smtpTls: "",
    smtpUser: "",
    smtpPass: "",
    smtpFrom: "",
  })
  const [loadingSettings, setLoadingSettings] = useState(false)
  const [savingSettings, setSavingSettings] = useState(false)

  const fetchSettings = useCallback(async () => {
    setLoadingSettings(true)
    try {
      const { ok, data } = await cachedGet("/api/admin/settings")
      if (ok && data) {
        setSettings({
          smtpHost: data.smtp_host ?? "",
          smtpPort: data.smtp_port ?? "",
          smtpTls: data.smtp_tls ?? "",
          smtpUser: data.smtp_user ?? "",
          // Ne jamais pré-remplir le mot de passe en clair (fuite via DevTools/state).
          // L'utilisateur doit le saisir pour le changer ; vide = inchangé.
          smtpPass: "",
          smtpFrom: data.smtp_from ?? "",
        })
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingSettings(false)
    }
  }, [cachedGet])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSettings()
  }, [fetchSettings])

  return (
    <div className="space-y-6 max-w-xl">
      <div className="flex items-center justify-between border-b border-border pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Paramètres système</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Configuration SMTP optionnelle pour l&apos;envoi d&apos;e-mails.
          </p>
        </div>
      </div>

      <Card className="border-border bg-card/30">
        <CardContent className="p-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Configuration SMTP</h3>
          {loadingSettings ? (
            <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
          ) : (
            <>
              <div className="space-y-1.5">
                <label className="text-[10px] text-muted-foreground uppercase font-bold">Hôte SMTP</label>
                <Input
                  placeholder="smtp.exemple.com"
                  className="bg-background border-border text-xs text-foreground"
                  value={settings.smtpHost}
                  onChange={(e) => setSettings((s) => ({ ...s, smtpHost: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] text-muted-foreground uppercase font-bold">Port</label>
                <Input
                  placeholder="587"
                  className="bg-background border-border text-xs text-foreground"
                  value={settings.smtpPort}
                  onChange={(e) => setSettings((s) => ({ ...s, smtpPort: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] text-muted-foreground uppercase font-bold">Chiffrement</label>
                <Input
                  placeholder="tls / ssl / none"
                  className="bg-background border-border text-xs text-foreground"
                  value={settings.smtpTls}
                  onChange={(e) => setSettings((s) => ({ ...s, smtpTls: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] text-muted-foreground uppercase font-bold">Utilisateur</label>
                <Input
                  placeholder="user@exemple.com"
                  className="bg-background border-border text-xs text-foreground"
                  value={settings.smtpUser}
                  onChange={(e) => setSettings((s) => ({ ...s, smtpUser: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] text-muted-foreground uppercase font-bold">Mot de passe</label>
                <Input
                  type="password"
                  placeholder="Laissé vide = inchangé"
                  className="bg-background border-border text-xs text-foreground"
                  value={settings.smtpPass}
                  onChange={(e) => setSettings((s) => ({ ...s, smtpPass: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] text-muted-foreground uppercase font-bold">E-mail expéditeur</label>
                <Input
                  placeholder="noreply@exemple.com"
                  className="bg-background border-border text-xs text-foreground"
                  value={settings.smtpFrom}
                  onChange={(e) => setSettings((s) => ({ ...s, smtpFrom: e.target.value }))}
                />
              </div>
              <Button
                variant="default"
                size="sm"
                className="cursor-pointer"
                disabled={savingSettings}
                onClick={async () => {
                  setSavingSettings(true)
                  try {
                    // N'envoie le mot de passe que s'il a été modifié (non vide),
                    // sinon on le retire pour ne pas écraser la valeur enregistrée.
                    const payload: Record<string, string> = { ...settings }
                    if (!payload.smtpPass) delete payload.smtpPass
                    const res = await fetch("/api/admin/settings", {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(payload),
                    })
                    if (res.ok) {
                      toast.success("Paramètres SMTP enregistrés avec succès.")
                    } else {
                      toast.error("Erreur lors de l'enregistrement des paramètres.")
                    }
                  } catch (err) {
                    console.error(err)
                    toast.error("Erreur lors de l'enregistrement des paramètres.")
                  } finally {
                    setSavingSettings(false)
                  }
                }}
              >
                {savingSettings ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  "Enregistrer"
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <p className="text-[10px] text-muted-foreground">
        Note : l&apos;application utilise <span className="font-semibold">Resend</span> par défaut pour l&apos;envoi d&apos;e-mails. Cette configuration SMTP est optionnelle et n&apos;est utilisée que si vous souhaitez bypasser Resend.
      </p>
    </div>
  )
}
