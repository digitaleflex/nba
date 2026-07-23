import { Skeleton } from "@nba/design-system"

export function TabSkeleton() {
  return (
    <div className="space-y-4 p-6 animate-in fade-in duration-300" role="status" aria-label="Chargement de l'onglet">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-2">
            <Skeleton variant="shimmer" className="h-4 w-16" />
            <Skeleton variant="shimmer" className="h-7 w-20" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton variant="shimmer" className="size-8 rounded-full" />
            <div className="space-y-1.5 flex-1">
              <Skeleton variant="shimmer" className="h-3.5 w-1/3" />
              <Skeleton variant="shimmer" className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
