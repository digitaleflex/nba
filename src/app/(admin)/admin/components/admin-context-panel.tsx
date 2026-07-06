"use client"

import { useEffect, useState } from "react"
import { X, User, Shield, Check, Ban, FileText, Image as ImageIcon, Link2, Bell, ExternalLink, Trash2 } from "lucide-react"
import { Button, Badge, cn, Input } from "@nba/design-system"

interface AdminContextPanelProps {
  isOpen: boolean
  onClose: () => void
  title: string
  type: "user" | "kyc" | "broker" | "signal" | null
  data: any
  onAction?: (actionType: string, extraData?: any) => Promise<void>
}

const ROLES = [
  { name: "MEMBER", label: "Membre", description: "Accès standard" },
  { name: "SUPPORT_AGENT", label: "Support", description: "Support utilisateur" },
  { name: "KYC_AGENT", label: "Agent KYC", description: "Vérification KYC" },
  { name: "ADMIN", label: "Admin", description: "Operations administratives" },
  { name: "SUPER_ADMIN", label: "Super Admin", description: "Accès systeme complet" },
]

export function AdminContextPanel({
  isOpen,
  onClose,
  title,
  type,
  data,
  onAction,
}: AdminContextPanelProps) {
  const [zoomedImage, setZoomedImage] = useState<string | null>(null)
  
  // States pour la notification individuelle
  const [showNotifForm, setShowNotifForm] = useState(false)
  const [notifTitle, setNotifTitle] = useState("")
  const [notifContent, setNotifContent] = useState("")
  const [sendingNotif, setSendingNotif] = useState(false)

  // States pour les notes de traitement KYC / Broker
  const [kycNotes, setKycNotes] = useState("")
  const [brokerNotes, setBrokerNotes] = useState("")

  // Verrouiller le scroll de la page quand ouvert
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  // Gérer la touche Escape pour fermer
  useEffect(() => {
    if (!isOpen) return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [isOpen, onClose])

  if (!isOpen || !type || !data) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-neutral-950/20 dark:bg-neutral-950/40 backdrop-blur-xs select-none">
      {/* Overlay invisible pour fermer */}
      <div className="flex-1" onClick={onClose} />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "w-full max-w-md h-full bg-card text-card-foreground border-l border-neutral-200/60 dark:border-neutral-800/60 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200"
        )}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200/60 dark:border-neutral-800/60 flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-foreground">{title}</h3>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{type}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors cursor-pointer"
            aria-label="Fermer le panneau"
          >
            <X className="size-4.5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* USER MODULE VIEW */}
          {type === "user" && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-neutral-100/40 dark:bg-neutral-900/40 border border-neutral-200/40 dark:border-neutral-800/40">
                <div className="size-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                  {data.image ? (
                    <img src={data.image} alt={data.name} className="size-full rounded-full object-cover" />
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
                      className="w-full flex items-center justify-between text-[10px] text-muted-foreground uppercase hover:text-foreground transition-colors"
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
                        <span className="text-[10px] text-muted-foreground uppercase">Dernier KYC ({data.kycDocuments[0].type})</span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[9px] uppercase",
                            data.kycDocuments[0].status === "APPROVED" && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                            data.kycDocuments[0].status === "REJECTED" && "bg-rose-500/10 text-rose-400 border-rose-500/20",
                            data.kycDocuments[0].status === "PENDING" && "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          )}
                        >
                          {data.kycDocuments[0].status}
                        </Badge>
                      </div>

                      {data.kycDocuments[0].files && data.kycDocuments[0].files.length > 0 && (
                        <div className="flex gap-1.5 flex-wrap">
                          {data.kycDocuments[0].files.map((file: any, index: number) => (
                            <a
                              key={index}
                              href={file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[9px] text-primary hover:underline flex items-center gap-1 bg-primary/5 px-2 py-1 rounded border border-primary/20"
                            >
                              <FileText className="size-3" /> Fichier {index + 1}
                            </a>
                          ))}
                        </div>
                      )}

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
                            data.brokerVerifications[0].status === "APPROVED" && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                            data.brokerVerifications[0].status === "REJECTED" && "bg-rose-500/10 text-rose-400 border-rose-500/20",
                            data.brokerVerifications[0].status === "PENDING" && "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          )}
                        >
                          {data.brokerVerifications[0].status}
                        </Badge>
                      </div>

                      {data.brokerVerifications[0].videoUrl && (
                        <a
                          href={data.brokerVerifications[0].videoUrl}
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
          )}

          {/* KYC MODULE VIEW */}
          {type === "kyc" && (
            <div className="space-y-6">
              <div className="space-y-2">
                <span className="text-[10px] text-muted-foreground uppercase">Dossier utilisateur</span>
                <h4 className="text-sm font-bold text-foreground">{data.user?.name}</h4>
                <p className="text-muted-foreground">{data.user?.email}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-b py-4">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase">Type de document</span>
                  <p className="font-semibold text-foreground mt-0.5">{data.type}</p>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase">Statut KYC</span>
                  <div className="mt-0.5">
                    <Badge
                      variant="outline"
                      className={cn(
                        data.status === "APPROVED" && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                        data.status === "REJECTED" && "bg-rose-500/10 text-rose-400 border-rose-500/20",
                        data.status === "PENDING" && "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      )}
                    >
                      {data.status}
                    </Badge>
                  </div>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] text-muted-foreground uppercase">Soumis le</span>
                  <p className="font-semibold text-foreground mt-0.5">
                    {new Date(data.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Photos & Documents */}
              <div className="space-y-4">
                <h5 className="font-bold text-foreground">Pièces justificatives</h5>
                {data.files && data.files.length > 0 ? (
                  <div className="space-y-3">
                    {data.files.map((file: any, index: number) => (
                      <div key={index} className="space-y-1">
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                          Document {index + 1} ({file.label || "Fichier"})
                        </span>
                        <div className="border rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-900">
                          {file.url.endsWith(".pdf") ? (
                            <div className="p-4 flex items-center gap-2 justify-center text-muted-foreground">
                              <FileText className="size-5" />
                              <span>Fichier PDF justificatif</span>
                            </div>
                          ) : (
                            <img
                              src={file.url}
                              alt={file.label || "KYC Fichier"}
                              className="w-full h-auto max-h-48 object-contain cursor-zoom-in hover:opacity-90 transition-opacity"
                              onClick={() => setZoomedImage(file.url)}
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center border border-dashed rounded-xl text-muted-foreground">
                    Aucun fichier associé à ce dossier.
                  </div>
                )}
              </div>

              {onAction && data.status === "PENDING" && (
                <div className="space-y-2 border-t pt-4">
                  <span className="text-[10px] text-muted-foreground uppercase">Revue administrative</span>
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white border-0"
                      onClick={() => onAction("kyc_approve", { id: data.id })}
                    >
                      <Check className="size-3.5" /> Approuver le KYC
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full gap-1.5"
                      onClick={() => onAction("kyc_reject", { id: data.id })}
                    >
                      <Ban className="size-3.5" /> Refuser
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* BROKER MODULE VIEW */}
          {type === "broker" && (
            <div className="space-y-6">
              <div className="space-y-2">
                <span className="text-[10px] text-muted-foreground uppercase">Utilisateur associé</span>
                <h4 className="text-sm font-bold text-foreground">{data.user?.name}</h4>
                <p className="text-muted-foreground">{data.user?.email}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-b py-4">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase">Broker</span>
                  <p className="font-semibold text-foreground mt-0.5">{data.brokerName}</p>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase">Compte Broker</span>
                  <p className="font-semibold text-foreground mt-0.5">{data.accountId}</p>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase">Statut</span>
                  <div className="mt-0.5">
                    <Badge
                      variant="outline"
                      className={cn(
                        data.status === "APPROVED" && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                        data.status === "REJECTED" && "bg-rose-500/10 text-rose-400 border-rose-500/20",
                        data.status === "PENDING" && "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      )}
                    >
                      {data.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase">Soumis le</span>
                  <p className="font-semibold text-foreground mt-0.5">
                    {new Date(data.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Vidéo de preuve */}
              <div className="space-y-3">
                <h5 className="font-bold text-foreground">Vidéo justificative</h5>
                {data.videoUrl ? (
                  <div className="border rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center">
                    <video src={data.videoUrl} controls className="w-full h-full object-contain" />
                  </div>
                ) : (
                  <div className="py-6 text-center border border-dashed rounded-xl text-muted-foreground">
                    Aucune vidéo de preuve disponible.
                  </div>
                )}
              </div>

              {onAction && data.status === "PENDING" && (
                <div className="space-y-2 border-t pt-4">
                  <span className="text-[10px] text-muted-foreground uppercase">Validation</span>
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white border-0"
                      onClick={() => onAction("broker_approve", { id: data.id })}
                    >
                      <Check className="size-3.5" /> Valider le Broker
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full gap-1.5"
                      onClick={() => onAction("broker_reject", { id: data.id })}
                    >
                      <Ban className="size-3.5" /> Refuser
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SIGNAL MODULE VIEW */}
          {type === "signal" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 border-b pb-4">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase">Créateur</span>
                  <p className="font-semibold text-foreground mt-0.5">{data.creator?.name || "Admin"}</p>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase">Statut du Signal</span>
                  <div className="mt-0.5">
                    <Badge
                      variant="outline"
                      className={cn(
                        data.status === "PUBLISHED" && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                        data.status === "DRAFT" && "bg-neutral-500/10 text-neutral-400 border-neutral-500/20",
                        data.status === "ARCHIVED" && "bg-rose-500/10 text-rose-400 border-rose-500/20"
                      )}
                    >
                      {data.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase">Date de création</span>
                  <p className="font-semibold text-foreground mt-0.5">
                    {new Date(data.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase">Date de publication</span>
                  <p className="font-semibold text-foreground mt-0.5">
                    {data.publishedAt ? new Date(data.publishedAt).toLocaleDateString() : "Non publié"}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] text-muted-foreground uppercase">Contenu du message</span>
                <div className="p-4 rounded-xl bg-neutral-100/50 dark:bg-neutral-900/50 border whitespace-pre-wrap leading-relaxed text-xs">
                  {data.content}
                </div>
              </div>

              {data.imageUrl && (
                <div className="space-y-2">
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold">Graphique attaché</span>
                  <div className="border rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-900">
                    <img 
                      src={data.imageUrl} 
                      alt="Signal graphique" 
                      className="w-full h-auto max-h-56 object-contain cursor-zoom-in hover:opacity-90 transition-opacity" 
                      onClick={() => setZoomedImage(data.imageUrl)}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Visionneuse plein écran de photo zoomée */}
      {zoomedImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in duration-200 select-none"
          onClick={() => setZoomedImage(null)}
        >
          <div className="absolute top-4 right-4 flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
            <a
              href={zoomedImage}
              target="_blank"
              rel="noopener noreferrer"
              className="h-9 px-3 rounded-xl bg-neutral-900/80 border border-neutral-800 text-white flex items-center gap-1.5 text-xs font-bold hover:bg-neutral-850 transition-colors cursor-pointer"
            >
              <ExternalLink className="size-4" />
              Ouvrir dans un onglet
            </a>
            <button
              onClick={() => setZoomedImage(null)}
              className="size-9 rounded-xl bg-neutral-900/80 border border-neutral-800 text-white flex items-center justify-center hover:bg-neutral-850 transition-colors cursor-pointer"
            >
              <X className="size-5" />
            </button>
          </div>
          <div className="max-w-4xl max-h-[85vh] p-2" onClick={(e) => e.stopPropagation()}>
            <img 
              src={zoomedImage} 
              alt="Document KYC Zoom" 
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl border border-neutral-800 animate-in zoom-in-95 duration-200" 
            />
          </div>
        </div>
      )}
    </div>
  )
}
