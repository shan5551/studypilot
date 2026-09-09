export function Skeleton({ className = '' }) {
  return (
    <div className={`animate-pulse rounded-lg bg-slate-200/70 dark:bg-slate-800 ${className}`} role="status" aria-label="Loading content" />
  );
}

export function CardSkeleton() {
  return (
    <div className="card p-5 space-y-3">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-3 w-2/3" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card p-4 space-y-2">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-7 w-16" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-5 space-y-3">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-48 w-full" />
        </div>
        <div className="card p-5 space-y-3">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    </div>
  );
}