'use client'

import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'
import { getPlatformColor } from '@/lib/analytics/analytics-client'
import { Platform } from '@/lib/types/posts'

interface BarChartProps {
  data: Array<{
    platform: Platform
    total_engagement: number
    total_posts: number
    avg_engagement_per_post: number
  }>
  title?: string
  height?: number
  dataKey?: string
}

export function BarChart({ data, title, height = 300, dataKey = 'total_engagement' }: BarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No data available</p>
      </div>
    )
  }

  // Format platform names for display
  const chartData = data.map(item => ({
    ...item,
    name: item.platform.charAt(0).toUpperCase() + item.platform.slice(1)
  }))

  // Get label for dataKey
  const getLabel = () => {
    switch (dataKey) {
      case 'total_engagement':
        return 'Total Engagement'
      case 'total_posts':
        return 'Total Posts'
      case 'avg_engagement_per_post':
        return 'Avg Engagement'
      default:
        return 'Value'
    }
  }

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="name"
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '12px'
            }}
            labelStyle={{ color: '#111827', fontWeight: 600, marginBottom: '4px' }}
            cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
          />
          <Legend
            wrapperStyle={{
              paddingTop: '20px'
            }}
          />
          <Bar
            dataKey={dataKey}
            name={getLabel()}
            radius={[8, 8, 0, 0]}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getPlatformColor(entry.platform)} />
            ))}
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  )
}
