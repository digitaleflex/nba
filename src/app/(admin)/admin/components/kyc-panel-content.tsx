"use client"

import { Check, Ban, FileText } from "lucide-react"
import { Button, Badge, cn } from "@nba/design-system"

interface KycPanelContentProps {
  data: any
  onAction?: (actionType: string, extraData?: any) => void
  onZoomImage: (url: string) => void
}

export function KycPanelContent({ data, onAction, onZoomImage }: KycPanelContentProps) {
  return (
    <div className="space-y-6 text-xs">
      <div className="space-y-2">
        <span className="text-[10px] text-muted-foreground uppercase">Dossier utilisateur</span>
        <h4 className="text-sm font-bold text-foreground">{data.user?.name}</h4>
        <p className="text-muted-foreground">{data.user?.email}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 border-t border-b py-4">
        <div>
          <span className="text-[10px] text-muted-foreground uppercase">Type de document</span>
          <p className="font-semibold text-foreground mt-0.5">{data.type || data.documentType}</p>
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
        <div className="space-y-3">
          {data.frontFilePath && (
            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                Recto (Document principal)
              </span>
              <div className="border rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-900">
                {data.frontFilePath.endsWith(".pdf") ? (
                  <div className="p-4 flex items-center gap-2 justify-center text-muted-foreground">
                    <FileText className="size-5" />
                    <span>Fichier PDF justificatif</span>
                  </div>
                ) : (
                  <img
                    src={`/api/files/${data.frontFilePath}`}
                    alt="KYC Recto"
                    className="w-full h-auto max-h-48 object-contain cursor-zoom-in hover:opacity-90 transition-opacity"
                    onClick={() => onZoomImage(`/api/files/${data.frontFilePath}`)}
                  />
                )}
              </div>
            </div>
          )}

          {data.backFilePath && (
            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                Verso (Secondaire)
              </span>
              <div className="border rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-900">
                {data.backFilePath.endsWith(".pdf") ? (
                  <div className="p-4 flex items-center gap-2 justify-center text-muted-foreground">
                    <FileText className="size-5" />
                    <span>Fichier PDF justificatif</span>
                  </div>
                ) : (
                  <img
                    src={`/api/files/${data.backFilePath}`}
                    alt="KYC Verso"
                    className="w-full h-auto max-h-48 object-contain cursor-zoom-in hover:opacity-90 transition-opacity"
                    onClick={() => onZoomImage(`/api/files/${data.backFilePath}`)}
                  />
                )}
              </div>
            </div>
          )}

          {!data.frontFilePath && !data.backFilePath && (
            <div className="py-6 text-center border border-dashed rounded-xl text-muted-foreground">
              Aucun fichier associé à ce dossier.
            </div>
          )}
        </div>
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
  )
}
