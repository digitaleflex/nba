import { Skeleton } from "@nba/design-system"

export default function DashboardLoading() {
  return (
    <div className="space-y-6 p-6 animate-in fade-in duration-500" role="status" aria-label="Chargement du tableau de bord">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton variant="shimmer" className="h-7 w-48" />
          <Skeleton variant="shimmer" className="h-4 w-64" />
        </div>
        <Skeleton variant="shimmer" className="h-9 w-32 rounded-lg" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-3">
            <Skeleton variant="shimmer" className="h-4 w-20" />
            <Skeleton variant="shimmer" className="h-8 w-24" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4 flex items-start gap-3">
            <Skeleton variant="shimmer" className="size-9 rounded-xl shrink-0" />
            <div className="space-y-1.5 flex-1">
              <Skeleton variant="shimmer" className="h-4 w-24" />
              <Skeleton variant="shimmer" className="h-3 w-32" />
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <Skeleton variant="shimmer" className="h-5 w-36" />
          <Skeleton variant="shimmer" className="h-4 w-40" />
          <Skeleton variant="shimmer" className="h-9 w-24 rounded-lg" />
        </div>
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <Skeleton variant="shimmer" className="h-5 w-36" />
          <Skeleton variant="shimmer" className="h-4 w-full" />
          <Skeleton variant="shimmer" className="h-9 w-32 rounded-lg" />
        </div>
      </div>
    </div>
  )
}
