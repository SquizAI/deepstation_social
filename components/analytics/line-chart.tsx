'use client'

import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { format } from 'date-fns'

interface LineChartProps {
  data: Array<{
    date: string
    count: number
    engagement: number
  }>
  title?: string
  height?: number
}

export function LineChart({ data, title, height = 300 }: LineChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-white/5 rounded-lg">
        <p className="text-slate-400">No data available</p>
      </div>
    )
  }

  // Format data for chart
  const chartData = data.map(item => ({
    ...item,
    formattedDate: format(new Date(item.date), 'MMM d')
  }))

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsLineChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
          <XAxis
            dataKey="formattedDate"
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
          />
          <Legend
            wrapperStyle={{
              paddingTop: '20px',
              color: '#cbd5e1'
            }}
          />
          <Line
            type="monotone"
            dataKey="count"
            stroke="#60a5fa"
            strokeWidth={2}
            dot={{ fill: '#60a5fa', r: 4 }}
            activeDot={{ r: 6 }}
            name="Posts"
          />
          <Line
            type="monotone"
            dataKey="engagement"
            stroke="#34d399"
            strokeWidth={2}
            dot={{ fill: '#34d399', r: 4 }}
            activeDot={{ r: 6 }}
            name="Engagement"
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  )
}
