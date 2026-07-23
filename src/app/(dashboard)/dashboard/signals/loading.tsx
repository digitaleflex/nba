import { Skeleton } from "@nba/design-system"

export default function SignalsLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500" role="status" aria-label="Chargement des signaux">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton variant="shimmer" className="h-7 w-40" />
          <Skeleton variant="shimmer" className="h-4 w-60" />
        </div>
        <Skeleton variant="shimmer" className="h-9 w-36 rounded-lg" />
      </div>

      <div className="flex gap-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} variant="shimmer" className="h-8 w-24 rounded-lg" />
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton variant="shimmer" className="size-10 rounded-full" />
              <div className="space-y-1.5 flex-1">
                <Skeleton variant="shimmer" className="h-4 w-3/4" />
                <Skeleton variant="shimmer" className="h-3 w-1/2" />
              </div>
            </div>
            <Skeleton variant="shimmer" className="h-3 w-full" />
            <Skeleton variant="shimmer" className="h-3 w-5/6" />
            <div className="flex gap-2 pt-2">
              <Skeleton variant="shimmer" className="h-6 w-16 rounded-md" />
              <Skeleton variant="shimmer" className="h-6 w-20 rounded-md" />
              <Skeleton variant="shimmer" className="h-6 w-14 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
