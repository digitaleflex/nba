"use client"

import { useState } from "react"
import { User, Shield, Check, Ban, FileText, ExternalLink, Trash2 } from "lucide-react"
import { Button, Badge, cn, Input } from "@nba/design-system"

interface UserPanelContentProps {
  data: any
  onAction?: (actionType: string, extraData?: any) => void
}

const ROLES = [
  { name: "USER", label: "Utilisateur", description: "Accès standard au tableau de bord et signaux" },
  { name: "ADMIN", label: "Administrateur", description: "Gestion des utilisateurs, des signaux et de la configuration" },
  { name: "SUPER_ADMIN", label: "Super Administrateur", description: "Accès complet, y compris les actions destructives" },
]

export function UserPanelContent({ data, onAction }: UserPanelContentProps) {
  // States pour la notification individuelle
  const [showNotifForm, setShowNotifForm] = useState(false)
  const [notifTitle, setNotifTitle] = useState("")
  const [notifContent, setNotifContent] = useState("")
  const [sendingNotif, setSendingNotif] = useState(false)

  // States pour les notes de traitement KYC / Broker
  const [kycNotes, setKycNotes] = useState("")
  const [brokerNotes, setBrokerNotes] = useState("")

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 p-4 rounded-xl bg-neutral-100/40 dark:bg-neutral-900/40 border border-neutral-200/40 dark:border-neutral-800/40">
        <div className="size-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
          {data.image ? (
            <img src={data.image?.startsWith("http") || data.image?.startsWith("/") ? data.image : `/api/files/${data.image}`} alt={data.name} className="size-full rounded-full object-cover" />
          ) : (
            <User className="size-5 text-primary" />
          )}
        </div>
        <div>
          <h4 className="text-sm font-bold text-foreground">{data.name}</h4>
          <p className="text-muted-foreground">{data.email}</p>
          <p className="text-[10px] text-muted-foreground/80 mt-0.5">ID: {data.id}</p>
        </div>
      </div>

      <div className="space-y-4">
        <h5 className="font-bold text-foreground border-b pb-1">Détails administratifs</h5>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-[10px] text-muted-foreground uppercase">Statut d'onboarding</span>
            <p className="font-semibold text-foreground mt-0.5">{data.onboardingStatus}</p>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground uppercase">Compte Actif</span>
            <div className="mt-0.5">
              <Badge variant="outline" className={cn(data.isActive ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20")}>
                {data.isActive ? "Actif" : "Suspendu"}
              </Badge>
            </div>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground uppercase">Téléphone (WhatsApp)</span>
            <p className="font-semibold text-foreground mt-0.5">{data.phone || "Non renseigné"}</p>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground uppercase">Pays</span>
            <p className="font-semibold text-foreground mt-0.5">{data.country || "Non renseigné"}</p>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground uppercase">Créé le</span>
            <p className="font-semibold text-foreground mt-0.5">
              {new Date(data.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground uppercase">Rôle</span>
            <p className="font-semibold text-primary mt-0.5">{data.role?.name || "Membre"}</p>
          </div>
        </div>
      </div>

      {onAction && (
        <div className="space-y-4 border-t pt-4">
          <div>
            <span className="text-[10px] text-muted-foreground uppercase block mb-2">Actions de compte</span>
            <div className="flex gap-2">
              {data.isActive ? (
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full gap-1.5"
                  onClick={() => onAction("suspend", { id: data.id })}
                >
                  <Ban className="size-3.5" /> Suspendre
                </Button>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  className="w-full gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white border-0"
                  onClick={() => onAction("reactivate", { id: data.id })}
                >
                  <Check className="size-3.5" /> Réactiver
                </Button>
              )}
              {data.onboardingStatus !== "ACTIVE" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-1.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                  onClick={() => onAction("force_onboarding", { id: data.id })}
                >
                  <Check className="size-3.5" /> Forcer ACTIVE
                </Button>
              )}
            </div>
          </div>

          {/* Alerter l'utilisateur */}
          <div className="space-y-2 border-t pt-4">
            <button
              type="button"
              onClick={() => setShowNotifForm(!showNotifForm)}
              className="w-full flex items-center justify-between text-[10px] text-muted-foreground uppercase hover:text-foreground transition-colors cursor-pointer"
            >
              <span>Alerter l'utilisateur</span>
              <span>{showNotifForm ? "▲" : "▼"}</span>
            </button>
            {showNotifForm && (
              <div className="space-y-2.5 pt-2">
                <Input
                  placeholder="Titre de la notification..."
                  value={notifTitle}
                  onChange={(e) => setNotifTitle(e.target.value)}
                  className="h-8 text-xs bg-background border-border text-foreground"
                />
                <textarea
                  placeholder="Message à envoyer..."
                  value={notifContent}
                  onChange={(e) => setNotifContent(e.target.value)}
                  className="w-full p-2 text-xs rounded-lg border bg-background min-h-16 outline-none border-border text-foreground focus:border-primary/50"
                />
                <Button
                  size="sm"
                  disabled={sendingNotif || !notifTitle.trim() || !notifContent.trim()}
                  className="w-full"
                  onClick={async () => {
                    setSendingNotif(true)
                    await onAction("send_user_notification", {
                      id: data.id,
                      title: notifTitle,
                      content: notifContent,
                    })
                    setNotifTitle("")
                    setNotifContent("")
                    setSendingNotif(false)
                    setShowNotifForm(false)
                  }}
                >
                  {sendingNotif ? "Envoi..." : "Envoyer la notification"}
                </Button>
              </div>
            )}
          </div>

          {/* Traitement direct KYC */}
          {data.kycDocuments && data.kycDocuments[0] && (
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground uppercase">Dernier KYC ({data.kycDocuments[0].documentType})</span>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[9px] uppercase",
                    data.kycDocuments[0].status === "APPROVED" && "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
                    data.kycDocuments[0].status === "REJECTED" && "bg-rose-500/10 text-rose-600 border-rose-500/20",
                    data.kycDocuments[0].status === "PENDING" && "bg-amber-500/10 text-amber-600 border-amber-500/20"
                  )}
                >
                  {data.kycDocuments[0].status}
                </Badge>
              </div>

              <div className="flex gap-1.5 flex-wrap">
                {data.kycDocuments[0].frontFilePath && (
                  <a
                    href={`/api/files/${data.kycDocuments[0].frontFilePath}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[9px] text-primary hover:underline flex items-center gap-1 bg-primary/5 px-2 py-1 rounded border border-primary/20"
                  >
                    <FileText className="size-3" /> Recto
                  </a>
                )}
                {data.kycDocuments[0].backFilePath && (
                  <a
                    href={`/api/files/${data.kycDocuments[0].backFilePath}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[9px] text-primary hover:underline flex items-center gap-1 bg-primary/5 px-2 py-1 rounded border border-primary/20"
                  >
                    <FileText className="size-3" /> Verso
                  </a>
                )}
              </div>

              {data.kycDocuments[0].status === "PENDING" && (
                <div className="space-y-2">
                  <Input
                    placeholder="Motif en cas de refus..."
                    value={kycNotes}
                    onChange={(e) => setKycNotes(e.target.value)}
                    className="h-8 text-xs bg-background border-border text-foreground"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white border-0"
                      onClick={async () => {
                        await onAction("kyc_approve", { id: data.kycDocuments[0].id, notes: kycNotes })
                        setKycNotes("")
                      }}
                    >
                      Approuver
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full"
                      onClick={async () => {
                        await onAction("kyc_reject", { id: data.kycDocuments[0].id, notes: kycNotes || "Documents incorrects" })
                        setKycNotes("")
                      }}
                    >
                      Refuser
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Traitement direct Broker */}
          {data.brokerVerifications && data.brokerVerifications[0] && (
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground uppercase">Dernier Broker ({data.brokerVerifications[0].brokerName})</span>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[9px] uppercase",
                    data.brokerVerifications[0].status === "APPROVED" && "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
                    data.brokerVerifications[0].status === "REJECTED" && "bg-rose-500/10 text-rose-600 border-rose-500/20",
                    data.brokerVerifications[0].status === "PENDING" && "bg-amber-500/10 text-amber-600 border-amber-500/20"
                  )}
                >
                  {data.brokerVerifications[0].status}
                </Badge>
              </div>

              {data.brokerVerifications[0].videoFilePath && (
                <a
                  href={`/api/files/${data.brokerVerifications[0].videoFilePath}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[9px] text-primary hover:underline flex items-center gap-1 bg-primary/5 px-2 py-1 rounded border border-primary/20 w-fit"
                >
                  <ExternalLink className="size-3" /> Visionner la vidéo
                </a>
              )}

              {data.brokerVerifications[0].status === "PENDING" && (
                <div className="space-y-2">
                  <Input
                    placeholder="Motif en cas de refus..."
                    value={brokerNotes}
                    onChange={(e) => setBrokerNotes(e.target.value)}
                    className="h-8 text-xs bg-background border-border text-foreground"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white border-0"
                      onClick={async () => {
                        await onAction("broker_approve", { id: data.brokerVerifications[0].id, notes: brokerNotes })
                        setBrokerNotes("")
                      }}
                    >
                      Approuver
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full"
                      onClick={async () => {
                        await onAction("broker_reject", { id: data.brokerVerifications[0].id, notes: brokerNotes || "Liaison non conforme" })
                        setBrokerNotes("")
                      }}
                    >
                      Refuser
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          <span className="text-[10px] text-muted-foreground uppercase mt-3 block border-t pt-4">Changer le rôle</span>
          <div className="grid grid-cols-1 gap-1.5">
            {ROLES.map((role) => (
              <button
                key={role.name}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors cursor-pointer border",
                  data.role?.name === role.name
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : "bg-neutral-100/40 dark:bg-neutral-900/40 border-neutral-200/40 dark:border-neutral-800/40 hover:bg-neutral-200/40 dark:hover:bg-neutral-800/40"
                )}
                onClick={() => onAction("change_role", { id: data.id, roleName: role.name })}
                disabled={data.role?.name === role.name}
              >
                <Shield className="size-3.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold">{role.label}</p>
                  <p className="text-[9px] text-muted-foreground truncate">{role.description}</p>
                </div>
                {data.role?.name === role.name && (
                  <Check className="size-3.5 text-primary shrink-0" />
                )}
              </button>
            ))}
          </div>

          {/* Danger Zone (Suppression) */}
          <div className="space-y-2 border-t border-destructive/20 pt-4">
            <span className="text-[10px] text-destructive uppercase font-bold block">Zone de danger</span>
            <Button
              variant="destructive"
              size="sm"
              className="w-full gap-1.5 bg-rose-950/20 hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-500/20"
              onClick={() => {
                if (confirm("Voulez-vous vraiment supprimer définitivement cet utilisateur ? Cette action est irréversible (suppression logique).")) {
                  onAction("delete_user", { id: data.id })
                }
              }}
            >
              <Trash2 className="size-3.5" /> Supprimer le compte
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
