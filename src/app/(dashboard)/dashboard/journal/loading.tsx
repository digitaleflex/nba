import { Skeleton } from "@nba/design-system"

export default function JournalLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500" role="status" aria-label="Chargement du journal">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton variant="shimmer" className="h-7 w-32" />
          <Skeleton variant="shimmer" className="h-4 w-48" />
        </div>
        <Skeleton variant="shimmer" className="h-9 w-36 rounded-lg" />
      </div>

      <div className="flex gap-2 border-b border-border pb-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} variant="shimmer" className="h-8 w-28 rounded-lg" />
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton variant="shimmer" className="size-12 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton variant="shimmer" className="h-4 w-1/3" />
            <Skeleton variant="shimmer" className="h-3 w-1/4" />
          </div>
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2 border-t border-border/40 pt-4">
            <Skeleton variant="shimmer" className="h-4 w-2/3" />
            <Skeleton variant="shimmer" className="h-3 w-full" />
            <Skeleton variant="shimmer" className="h-3 w-5/6" />
            <div className="flex gap-2 pt-1">
              <Skeleton variant="shimmer" className="h-6 w-16 rounded-md" />
              <Skeleton variant="shimmer" className="h-6 w-24 rounded-md" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <Skeleton variant="shimmer" className="h-5 w-28" />
          <Skeleton variant="shimmer" className="h-8 w-20" />
          <Skeleton variant="shimmer" className="h-3 w-40" />
        </div>
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <Skeleton variant="shimmer" className="h-5 w-28" />
          <Skeleton variant="shimmer" className="h-8 w-20" />
          <Skeleton variant="shimmer" className="h-3 w-40" />
        </div>
      </div>
    </div>
  )
}
