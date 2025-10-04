import { createClient } from '@/lib/supabase/client'
import { Platform } from '@/lib/types/posts'
import {
  AnalyticsSummary,
  PlatformPerformance,
  PostingTimeAnalytics,
  TopPost,
  PostsOverTime,
  DateRange,
  ExportData
} from '@/lib/types/analytics'
import { format } from 'date-fns'

/**
 * Calculate date range in days
 */
function getDateRangeDays(dateRange: DateRange): number {
  return Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24))
}

/**
 * Fetch analytics summary
 */
export async function fetchAnalyticsSummary(
  userId: string,
  dateRange: DateRange,
  platform?: Platform
): Promise<AnalyticsSummary | null> {
  const supabase = createClient()
  const days = getDateRangeDays(dateRange)

  const { data, error } = await supabase
    .rpc('get_analytics_summary', {
      p_user_id: userId,
      p_platform: platform || null,
      p_date_range_days: days
    })
    .single()

  if (error) {
    console.error('Error fetching analytics summary:', error)
    return null
  }

  return data
}

/**
 * Fetch platform performance metrics
 */
export async function fetchPlatformPerformance(
  userId: string,
  dateRange: DateRange
): Promise<PlatformPerformance[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('platform_performance')
    .select('*')
    .eq('user_id', userId)

  if (error) {
    console.error('Error fetching platform performance:', error)
    return []
  }

  // Filter by date range
  const filtered = (data || []).filter(p => {
    if (!p.last_post_at) return false
    const lastPost = new Date(p.last_post_at)
    return lastPost >= dateRange.start && lastPost <= dateRange.end
  })

  return filtered
}

/**
 * Get best posting times
 */
export async function getBestPostingTimes(
  userId: string,
  dateRange: DateRange,
  platform?: Platform
): Promise<PostingTimeAnalytics[]> {
  const supabase = createClient()
  const days = getDateRangeDays(dateRange)

  const { data, error } = await supabase.rpc('get_best_posting_times', {
    p_user_id: userId,
    p_platform: platform || null,
    p_date_range_days: days
  })

  if (error) {
    console.error('Error fetching best posting times:', error)
    return []
  }

  return data || []
}

/**
 * Get top performing posts
 */
export async function getTopPosts(
  userId: string,
  dateRange: DateRange,
  platform?: Platform,
  limit: number = 10
): Promise<TopPost[]> {
  const supabase = createClient()
  const days = getDateRangeDays(dateRange)

  const { data, error } = await supabase.rpc('get_top_posts', {
    p_user_id: userId,
    p_platform: platform || null,
    p_date_range_days: days,
    p_limit: limit
  })

  if (error) {
    console.error('Error fetching top posts:', error)
    return []
  }

  return data || []
}

/**
 * Get posts over time for line chart
 */
export async function getPostsOverTime(
  userId: string,
  dateRange: DateRange,
  platform?: Platform
): Promise<PostsOverTime[]> {
  const supabase = createClient()

  let query = supabase
    .from('post_analytics')
    .select('scheduled_for, total_engagement, status')
    .eq('user_id', userId)
    .eq('status', 'published')
    .gte('scheduled_for', dateRange.start.toISOString())
    .lte('scheduled_for', dateRange.end.toISOString())
    .order('scheduled_for', { ascending: true })

  const { data, error } = await query

  if (error) {
    console.error('Error fetching posts over time:', error)
    return []
  }

  if (!data || data.length === 0) return []

  // Group by date
  const groupedByDate = new Map<string, { count: number; engagement: number }>()

  data.forEach(post => {
    const date = format(new Date(post.scheduled_for), 'yyyy-MM-dd')
    const existing = groupedByDate.get(date) || { count: 0, engagement: 0 }
    groupedByDate.set(date, {
      count: existing.count + 1,
      engagement: existing.engagement + (post.total_engagement || 0)
    })
  })

  // Convert to array
  return Array.from(groupedByDate.entries()).map(([date, stats]) => ({
    date,
    count: stats.count,
    engagement: stats.engagement
  }))
}

/**
 * Calculate engagement metrics from post results
 */
export function calculateEngagement(metrics: any): number {
  if (!metrics) return 0

  return (
    (parseInt(metrics.likes) || 0) +
    (parseInt(metrics.shares) || 0) +
    (parseInt(metrics.comments) || 0) +
    (parseInt(metrics.retweets) || 0) +
    (parseInt(metrics.reactions) || 0)
  )
}

/**
 * Export analytics data to CSV
 */
export function exportToCSV(data: ExportData): string {
  const { summary, platformPerformance, topPosts, postsOverTime } = data

  let csv = 'DeepStation Analytics Export\n\n'

  // Summary section
  csv += 'Summary\n'
  csv += 'Metric,Value\n'
  csv += `Total Posts,${summary.total_posts}\n`
  csv += `Published Posts,${summary.published_posts}\n`
  csv += `Failed Posts,${summary.failed_posts}\n`
  csv += `Total Engagement,${summary.total_engagement}\n`
  csv += `Avg Engagement Per Post,${summary.avg_engagement_per_post}\n`
  csv += `Success Rate,${summary.success_rate}%\n`
  csv += `Most Engaged Platform,${summary.most_engaged_platform || 'N/A'}\n`
  csv += `Least Engaged Platform,${summary.least_engaged_platform || 'N/A'}\n`
  csv += '\n'

  // Platform Performance section
  csv += 'Platform Performance\n'
  csv += 'Platform,Total Posts,Successful Posts,Failed Posts,Success Rate,Total Engagement,Avg Engagement\n'
  platformPerformance.forEach(p => {
    csv += `${p.platform},${p.total_posts},${p.successful_posts},${p.failed_posts},${p.success_rate}%,${p.total_engagement},${p.avg_engagement_per_post}\n`
  })
  csv += '\n'

  // Top Posts section
  csv += 'Top Performing Posts\n'
  csv += 'Post ID,Scheduled For,Platforms,Total Engagement,Likes,Shares,Comments,Success Rate\n'
  topPosts.forEach(p => {
    csv += `${p.post_id},${p.scheduled_for},${p.platforms.join(';')},${p.total_engagement},${p.total_likes},${p.total_shares},${p.total_comments},${p.success_rate}%\n`
  })
  csv += '\n'

  // Posts Over Time section
  csv += 'Posts Over Time\n'
  csv += 'Date,Post Count,Total Engagement\n'
  postsOverTime.forEach(p => {
    csv += `${p.date},${p.count},${p.engagement}\n`
  })

  return csv
}

/**
 * Download CSV file
 */
export function downloadCSV(csv: string, filename: string = 'deepstation-analytics.csv') {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}

/**
 * Get platform color for charts
 */
export function getPlatformColor(platform: Platform): string {
  const colors: Record<Platform, string> = {
    linkedin: '#0A66C2',
    instagram: '#E4405F',
    twitter: '#1DA1F2',
    discord: '#5865F2'
  }
  return colors[platform] || '#6B7280'
}

/**
 * Get day of week name
 */
export function getDayName(dayOfWeek: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return days[dayOfWeek] || ''
}

/**
 * Format hour for display
 */
export function formatHour(hour: number): string {
  if (hour === 0) return '12 AM'
  if (hour < 12) return `${hour} AM`
  if (hour === 12) return '12 PM'
  return `${hour - 12} PM`
}
