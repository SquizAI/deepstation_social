'use client'

import { getDayName, formatHour } from '@/lib/analytics/analytics-client'
import { PostingTimeAnalytics } from '@/lib/types/analytics'

interface HeatmapProps {
  data: PostingTimeAnalytics[]
  title?: string
}

export function Heatmap({ data, title }: HeatmapProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-white/5 rounded-lg">
        <p className="text-slate-400">No data available</p>
      </div>
    )
  }

  // Create a matrix of hours (0-23) by days (0-6)
  const hours = Array.from({ length: 24 }, (_, i) => i)
  const days = Array.from({ length: 7 }, (_, i) => i)

  // Create lookup map for quick access
  const dataMap = new Map<string, PostingTimeAnalytics>()
  data.forEach(item => {
    const key = `${item.day_of_week}-${item.hour_of_day}`
    dataMap.set(key, item)
  })

  // Get max engagement for color scaling
  const maxEngagement = Math.max(...data.map(d => d.avg_engagement), 1)

  // Get color intensity based on engagement
  const getColorIntensity = (engagement: number): string => {
    if (engagement === 0) return 'bg-white/5'
    const intensity = Math.round((engagement / maxEngagement) * 5)
    const colors = [
      'bg-fuchsia-500/20',
      'bg-fuchsia-500/30',
      'bg-fuchsia-500/40',
      'bg-fuchsia-500/50',
      'bg-fuchsia-500/60',
      'bg-fuchsia-500/70'
    ]
    return colors[intensity] || colors[0]
  }

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      )}

      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Header with day names */}
          <div className="flex mb-2">
            <div className="w-16"></div>
            {days.map(day => (
              <div
                key={day}
                className="flex-1 min-w-[60px] text-center text-xs font-medium text-slate-400"
              >
                {getDayName(day).slice(0, 3)}
              </div>
            ))}
          </div>

          {/* Heatmap grid */}
          <div className="space-y-1">
            {hours.map(hour => (
              <div key={hour} className="flex items-center">
                <div className="w-16 text-xs text-slate-400 pr-2 text-right">
                  {formatHour(hour)}
                </div>
                {days.map(day => {
                  const key = `${day}-${hour}`
                  const item = dataMap.get(key)
                  const hasData = item && item.avg_engagement > 0

                  return (
                    <div
                      key={key}
                      className="flex-1 min-w-[60px] px-0.5"
                    >
                      <div
                        className={`
                          h-8 rounded border
                          ${hasData ? getColorIntensity(item.avg_engagement) : 'bg-white/5'}
                          ${hasData ? 'border-fuchsia-500/30 cursor-pointer hover:ring-2 hover:ring-fuchsia-500' : 'border-white/10'}
                          transition-all duration-150
                        `}
                        title={
                          hasData
                            ? `${getDayName(day)} at ${formatHour(hour)}\nAvg Engagement: ${item.avg_engagement.toFixed(1)}\nPosts: ${item.post_count}`
                            : 'No data'
                        }
                      >
                        {hasData && (
                          <div className="h-full flex items-center justify-center text-xs font-medium text-white">
                            {item.post_count > 1 ? item.post_count : ''}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-6 flex items-center justify-center gap-4">
            <span className="text-xs text-slate-400">Less engagement</span>
            <div className="flex gap-1">
              {['bg-white/5', 'bg-fuchsia-500/30', 'bg-fuchsia-500/40', 'bg-fuchsia-500/50', 'bg-fuchsia-500/60', 'bg-fuchsia-500/70'].map((color, i) => (
                <div
                  key={i}
                  className={`w-6 h-6 rounded border border-white/10 ${color}`}
                />
              ))}
            </div>
            <span className="text-xs text-slate-400">More engagement</span>
          </div>

          {/* Best time indicator */}
          {data.length > 0 && (
            <div className="mt-4 p-4 bg-fuchsia-500/10 border border-fuchsia-500/20 rounded-lg">
              <p className="text-sm font-medium text-white">
                Best posting time:{' '}
                <span className="font-bold text-fuchsia-400">
                  {getDayName(data[0].day_of_week)}s at {formatHour(data[0].hour_of_day)}
                </span>
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Average engagement: {data[0].avg_engagement.toFixed(1)} ({data[0].post_count} posts)
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
