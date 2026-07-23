import { Skeleton } from "@nba/design-system"

export default function AdminLoading() {
  return (
    <div className="space-y-6 p-6 animate-in fade-in duration-500" role="status" aria-label="Chargement de l'administration">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton variant="shimmer" className="h-7 w-48" />
          <Skeleton variant="shimmer" className="h-4 w-56" />
        </div>
        <div className="flex gap-2">
          <Skeleton variant="shimmer" className="h-9 w-28 rounded-lg" />
          <Skeleton variant="shimmer" className="h-9 w-36 rounded-lg" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-3">
            <Skeleton variant="shimmer" className="h-4 w-20" />
            <Skeleton variant="shimmer" className="h-8 w-24" />
            <Skeleton variant="shimmer" className="h-3 w-36" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center gap-4 border-b border-border pb-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} variant="shimmer" className="h-8 w-20 rounded-lg" />
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton variant="shimmer" className="h-3 w-12" />
              <Skeleton variant="shimmer" className="h-3 flex-1" />
              <Skeleton variant="shimmer" className="h-3 w-20" />
              <Skeleton variant="shimmer" className="size-6 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
