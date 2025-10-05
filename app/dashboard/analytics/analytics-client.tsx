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
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all">
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
              className="dark:bg-white/5 dark:border-white/10 dark:text-white"
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
              className="flex items-center gap-2 bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:opacity-90 text-white border-0"
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
        <div className="bg-white/5 backdrop-blur-sm border border-blue-500/20 rounded-xl p-6 hover:bg-white/10 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            </div>
          </div>
          <h3 className="text-sm font-medium text-slate-400 mb-1">Total Posts</h3>
          <p className="text-3xl font-bold text-white mb-1">{summary?.total_posts || 0}</p>
          <p className="text-xs text-slate-500">{summary?.published_posts || 0} published</p>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-green-500/20 rounded-xl p-6 hover:bg-white/10 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
          </div>
          <h3 className="text-sm font-medium text-slate-400 mb-1">Total Engagement</h3>
          <p className="text-3xl font-bold text-white mb-1">{summary?.total_engagement?.toLocaleString() || 0}</p>
          <p className="text-xs text-slate-500">Likes, shares & comments</p>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6 hover:bg-white/10 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <h3 className="text-sm font-medium text-slate-400 mb-1">Avg Engagement</h3>
          <p className="text-3xl font-bold text-white mb-1">{summary?.avg_engagement_per_post?.toFixed(1) || '0.0'}</p>
          <p className="text-xs text-slate-500">Per post</p>
        </div>

        <div className={`bg-white/5 backdrop-blur-sm border ${
          summary?.success_rate >= 90
            ? 'border-green-500/20'
            : summary?.success_rate >= 70
            ? 'border-orange-500/20'
            : 'border-red-500/20'
        } rounded-xl p-6 hover:bg-white/10 transition-all`}>
          <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 ${
              summary?.success_rate >= 90
                ? 'bg-green-500/20'
                : summary?.success_rate >= 70
                ? 'bg-orange-500/20'
                : 'bg-red-500/20'
            } rounded-lg flex items-center justify-center`}>
              <svg className={`w-6 h-6 ${
                summary?.success_rate >= 90
                  ? 'text-green-400'
                  : summary?.success_rate >= 70
                  ? 'text-orange-400'
                  : 'text-red-400'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <h3 className="text-sm font-medium text-slate-400 mb-1">Success Rate</h3>
          <p className="text-3xl font-bold text-white mb-1">{summary?.success_rate?.toFixed(1) || '0.0'}%</p>
          <p className="text-xs text-slate-500">{summary?.failed_posts || 0} failed</p>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all">
          <LineChart
            data={postsOverTime}
            title="Posts Over Time"
            height={300}
          />
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all">
          <BarChart
            data={platformPerformance}
            title="Engagement by Platform"
            height={300}
            dataKey="total_engagement"
          />
        </div>
      </div>

      {/* Best Posting Times Heatmap */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all">
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
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all">
          <h3 className="text-lg font-semibold text-white mb-4">Platform Performance Details</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Platform
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Posts
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Success Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Likes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Shares
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Comments
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Avg Engagement
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {platformPerformance.map((p) => (
                  <tr key={p.platform} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-white capitalize">
                        {p.platform}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {p.total_posts}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        p.success_rate >= 90
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : p.success_rate >= 70
                          ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        {p.success_rate}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {p.total_likes.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {p.total_shares.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {p.total_comments.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
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
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-12 text-center hover:bg-white/10 transition-all">
          <div className="w-16 h-16 mx-auto bg-fuchsia-500/20 rounded-full flex items-center justify-center mb-4">
            <svg
              className="h-8 w-8 text-fuchsia-400"
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
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No analytics data</h3>
          <p className="text-sm text-slate-400">
            Start publishing posts to see your analytics here.
          </p>
        </div>
      )}
    </div>
  )
}
