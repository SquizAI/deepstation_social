export function AnalyticsLoadingSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Filters Skeleton */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 flex gap-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-10 w-32 bg-white/10 rounded-lg"></div>
            ))}
          </div>
          <div className="flex gap-4">
            <div className="h-10 w-40 bg-white/10 rounded-lg"></div>
            <div className="h-10 w-32 bg-white/10 rounded-lg"></div>
          </div>
        </div>
      </div>

      {/* Metrics Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <div className="space-y-3">
              <div className="h-12 w-12 bg-white/10 rounded-lg"></div>
              <div className="h-4 w-24 bg-white/10 rounded"></div>
              <div className="h-8 w-20 bg-white/10 rounded"></div>
              <div className="h-3 w-32 bg-white/10 rounded"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <div className="h-6 w-40 bg-white/10 rounded mb-4"></div>
            <div className="h-64 bg-white/5 rounded"></div>
          </div>
        ))}
      </div>

      {/* Heatmap Skeleton */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <div className="h-6 w-48 bg-white/10 rounded mb-4"></div>
        <div className="h-96 bg-white/5 rounded"></div>
      </div>

      {/* Table Skeleton */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <div className="h-6 w-48 bg-white/10 rounded mb-4"></div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-white/5 rounded"></div>
          ))}
        </div>
      </div>
    </div>
  )
}
