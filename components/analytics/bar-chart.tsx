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
      <div className="flex items-center justify-center h-64 bg-white/5 rounded-lg">
        <p className="text-slate-400">No data available</p>
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
        <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
          <XAxis
            dataKey="name"
            stroke="rgba(255, 255, 255, 0.5)"
            style={{ fontSize: '12px', fill: '#94a3b8' }}
          />
          <YAxis
            stroke="rgba(255, 255, 255, 0.5)"
            style={{ fontSize: '12px', fill: '#94a3b8' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '12px',
              backdropFilter: 'blur(8px)'
            }}
            labelStyle={{ color: '#ffffff', fontWeight: 600, marginBottom: '4px' }}
            itemStyle={{ color: '#cbd5e1' }}
            cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
          />
          <Legend
            wrapperStyle={{
              paddingTop: '20px',
              color: '#cbd5e1'
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
