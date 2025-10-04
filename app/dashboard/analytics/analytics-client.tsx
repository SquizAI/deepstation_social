'use client'

import { useState, useEffect } from 'react'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { MetricsCard } from '@/components/analytics/metrics-card'
import { LineChart } from '@/components/analytics/line-chart'
import { BarChart } from '@/components/analytics/bar-chart'
import { Heatmap } from '@/components/analytics/heatmap'
import { TopPostsTable } from '@/components/analytics/top-posts-table'
import { AnalyticsLoadingSkeleton } from '@/components/analytics/loading-skeleton'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Platform } from '@/lib/types/posts'
import { DateRangePreset } from '@/lib/types/analytics'
import {
  fetchAnalyticsSummary,
  fetchPlatformPerformance,
  getBestPostingTimes,
  getTopPosts,
  getPostsOverTime,
  exportToCSV,
  downloadCSV
} from '@/lib/analytics/analytics-client'
import { getDateRangeFromPreset } from '@/lib/analytics/utils'

interface AnalyticsClientProps {
  userId: string
}

export function AnalyticsClient({ userId }: AnalyticsClientProps) {
  const [dateRange, setDateRange] = useState<DateRangePreset>('30d')
  const [customStart, setCustomStart] = useState<Date>()
  const [customEnd, setCustomEnd] = useState<Date>()
  const [platform, setPlatform] = useState<Platform | 'all'>('all')
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  const [summary, setSummary] = useState<any>(null)
  const [platformPerformance, setPlatformPerformance] = useState<any[]>([])
  const [postingTimes, setPostingTimes] = useState<any[]>([])
  const [topPosts, setTopPosts] = useState<any[]>([])
  const [postsOverTime, setPostsOverTime] = useState<any[]>([])

  useEffect(() => {
    loadAnalytics()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange, customStart, customEnd, platform])

  const loadAnalytics = async () => {
    setLoading(true)
    try {
      const range = getDateRangeFromPreset(dateRange, customStart, customEnd)
      const platformFilter = platform === 'all' ? undefined : platform

      const [summaryData, platformData, timesData, topPostsData, timeData] = await Promise.all([
        fetchAnalyticsSummary(userId, range, platformFilter),
        fetchPlatformPerformance(userId, range),
        getBestPostingTimes(userId, range, platformFilter),
        getTopPosts(userId, range, platformFilter, 10),
        getPostsOverTime(userId, range, platformFilter)
      ])

      setSummary(summaryData)
      setPlatformPerformance(platformFilter ? platformData.filter(p => p.platform === platformFilter) : platformData)
      setPostingTimes(timesData)
      setTopPosts(topPostsData)
      setPostsOverTime(timeData)
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const range = getDateRangeFromPreset(dateRange, customStart, customEnd)
      const platformFilter = platform === 'all' ? undefined : platform

      const [summaryData, platformData, topPostsData, timeData] = await Promise.all([
        fetchAnalyticsSummary(userId, range, platformFilter),
        fetchPlatformPerformance(userId, range),
        getTopPosts(userId, range, platformFilter, 50),
        getPostsOverTime(userId, range, platformFilter)
      ])

      const exportData = {
        summary: summaryData || {
          total_posts: 0,
          published_posts: 0,
          failed_posts: 0,
          total_engagement: 0,
          avg_engagement_per_post: 0,
          success_rate: 0,
          most_engaged_platform: null,
          least_engaged_platform: null
        },
        platformPerformance: platformData,
        topPosts: topPostsData,
        postsOverTime: timeData
      }

      const csv = exportToCSV(exportData)
      downloadCSV(csv, `deepstation-analytics-${dateRange}.csv`)
    } catch (error) {
      console.error('Error exporting data:', error)
    } finally {
      setExporting(false)
    }
  }

  if (loading && !summary) {
    return <AnalyticsLoadingSkeleton />
  }

  return (
    <div className="space-y-8">
      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex-1">
            <DateRangePicker
              value={dateRange}
              customStart={customStart}
              customEnd={customEnd}
              onChange={(preset, start, end) => {
                setDateRange(preset)
                setCustomStart(start)
                setCustomEnd(end)
              }}
            />
          </div>

          <div className="flex items-center gap-4">
            <Select
              value={platform}
              onChange={(e) => setPlatform(e.target.value as Platform | 'all')}
            >
              <option value="all">All Platforms</option>
              <option value="linkedin">LinkedIn</option>
              <option value="instagram">Instagram</option>
              <option value="twitter">Twitter</option>
              <option value="discord">Discord</option>
            </Select>

            <Button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {exporting ? 'Exporting...' : 'Export CSV'}
            </Button>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricsCard
          title="Total Posts"
          value={summary?.total_posts || 0}
          subtitle={`${summary?.published_posts || 0} published`}
          color="blue"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
          }
        />

        <MetricsCard
          title="Total Engagement"
          value={summary?.total_engagement?.toLocaleString() || 0}
          subtitle="Likes, shares & comments"
          color="green"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          }
        />

        <MetricsCard
          title="Avg Engagement"
          value={summary?.avg_engagement_per_post?.toFixed(1) || '0.0'}
          subtitle="Per post"
          color="purple"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        />

        <MetricsCard
          title="Success Rate"
          value={`${summary?.success_rate?.toFixed(1) || '0.0'}%`}
          subtitle={`${summary?.failed_posts || 0} failed`}
          color={summary?.success_rate >= 90 ? 'green' : summary?.success_rate >= 70 ? 'orange' : 'red'}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <LineChart
            data={postsOverTime}
            title="Posts Over Time"
            height={300}
          />
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <BarChart
            data={platformPerformance}
            title="Engagement by Platform"
            height={300}
            dataKey="total_engagement"
          />
        </div>
      </div>

      {/* Best Posting Times Heatmap */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <Heatmap
          data={postingTimes}
          title="Best Posting Times"
        />
      </div>

      {/* Top Performing Posts */}
      <TopPostsTable
        posts={topPosts}
        title="Top Performing Posts"
      />

      {/* Platform Performance Details */}
      {platformPerformance.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Performance Details</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Platform
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Posts
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Success Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Likes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Shares
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Comments
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Engagement
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {platformPerformance.map((p) => (
                  <tr key={p.platform}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900 capitalize">
                        {p.platform}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {p.total_posts}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        p.success_rate >= 90
                          ? 'bg-green-100 text-green-800'
                          : p.success_rate >= 70
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {p.success_rate}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {p.total_likes.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {p.total_shares.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {p.total_comments.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {p.avg_engagement_per_post.toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && (!summary || summary.total_posts === 0) && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No analytics data</h3>
          <p className="mt-1 text-sm text-gray-500">
            Start publishing posts to see your analytics here.
          </p>
        </div>
      )}
    </div>
  )
}
