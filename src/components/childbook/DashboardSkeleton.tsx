export const DashboardSkeleton = () => (
  <div className="min-h-screen bg-background">
    {/* Top bar shimmer */}
    <div className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-3 md:max-w-4xl">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 animate-pulse rounded-xl bg-muted" />
          <div className="space-y-1.5">
            <div className="h-2.5 w-20 animate-pulse rounded bg-muted" />
            <div className="h-3 w-32 animate-pulse rounded bg-muted" />
          </div>
        </div>
        <div className="flex gap-1">
          <div className="h-10 w-10 animate-pulse rounded-xl bg-muted" />
          <div className="h-10 w-10 animate-pulse rounded-xl bg-muted" />
          <div className="h-10 w-10 animate-pulse rounded-xl bg-muted" />
        </div>
      </div>
    </div>

    <main className="mx-auto max-w-2xl space-y-6 px-6 py-6 md:max-w-4xl md:py-10">
      {/* Hero */}
      <div className="h-44 animate-pulse rounded-3xl bg-gradient-hero opacity-60" />

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-card shadow-soft" />
        ))}
      </div>

      {/* Recent timeline */}
      <div className="space-y-2">
        <div className="h-5 w-40 animate-pulse rounded bg-muted" />
        <div className="h-32 animate-pulse rounded-2xl bg-card shadow-soft" />
      </div>

      {/* Upcoming */}
      <div className="h-48 animate-pulse rounded-2xl bg-card shadow-soft" />
    </main>
  </div>
);
