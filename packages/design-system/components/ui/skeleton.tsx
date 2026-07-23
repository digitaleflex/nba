import { cn } from "../../lib/utils"

interface SkeletonProps extends React.ComponentProps<"div"> {
  variant?: "pulse" | "shimmer"
}

function Skeleton({ className, variant = "pulse", ...props }: SkeletonProps) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "rounded-md bg-muted",
        variant === "shimmer" ? "animate-shimmer" : "animate-pulse",
        className,
      )}
      {...props}
    />
  )
}

export { Skeleton }
