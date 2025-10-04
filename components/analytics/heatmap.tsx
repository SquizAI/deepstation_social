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
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No data available</p>
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
    if (engagement === 0) return 'bg-gray-100'
    const intensity = Math.round((engagement / maxEngagement) * 5)
    const colors = [
      'bg-blue-100',
      'bg-blue-200',
      'bg-blue-300',
      'bg-blue-400',
      'bg-blue-500',
      'bg-blue-600'
    ]
    return colors[intensity] || colors[0]
  }

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      )}

      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Header with day names */}
          <div className="flex mb-2">
            <div className="w-16"></div>
            {days.map(day => (
              <div
                key={day}
                className="flex-1 min-w-[60px] text-center text-xs font-medium text-gray-600"
              >
                {getDayName(day).slice(0, 3)}
              </div>
            ))}
          </div>

          {/* Heatmap grid */}
          <div className="space-y-1">
            {hours.map(hour => (
              <div key={hour} className="flex items-center">
                <div className="w-16 text-xs text-gray-600 pr-2 text-right">
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
                          h-8 rounded
                          ${hasData ? getColorIntensity(item.avg_engagement) : 'bg-gray-100'}
                          ${hasData ? 'cursor-pointer hover:ring-2 hover:ring-blue-600' : ''}
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
            <span className="text-xs text-gray-600">Less engagement</span>
            <div className="flex gap-1">
              {['bg-gray-100', 'bg-blue-200', 'bg-blue-300', 'bg-blue-400', 'bg-blue-500', 'bg-blue-600'].map((color, i) => (
                <div
                  key={i}
                  className={`w-6 h-6 rounded ${color}`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-600">More engagement</span>
          </div>

          {/* Best time indicator */}
          {data.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-900">
                Best posting time:{' '}
                <span className="font-bold">
                  {getDayName(data[0].day_of_week)}s at {formatHour(data[0].hour_of_day)}
                </span>
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Average engagement: {data[0].avg_engagement.toFixed(1)} ({data[0].post_count} posts)
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
