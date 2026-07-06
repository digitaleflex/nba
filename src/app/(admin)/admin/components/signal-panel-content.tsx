"use client"

import { Badge, cn } from "@nba/design-system"

interface SignalPanelContentProps {
  data: any
  onZoomImage: (url: string) => void
}

export function SignalPanelContent({ data, onZoomImage }: SignalPanelContentProps) {
  return (
    <div className="space-y-6 text-xs">
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
              onClick={() => onZoomImage(data.imageUrl)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
