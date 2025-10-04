import { Platform } from './posts'

export interface AnalyticsSummary {
  total_posts: number
  published_posts: number
  failed_posts: number
  total_engagement: number
  avg_engagement_per_post: number
  success_rate: number
  most_engaged_platform: Platform | null
  least_engaged_platform: Platform | null
}

export interface PlatformPerformance {
  user_id: string
  platform: Platform
  total_posts: number
  successful_posts: number
  failed_posts: number
  success_rate: number
  total_likes: number
  total_shares: number
  total_comments: number
  total_retweets: number
  total_reactions: number
  total_engagement: number
  avg_engagement_per_post: number
  first_post_at: string | null
  last_post_at: string | null
}

export interface PostingTimeAnalytics {
  day_of_week: number
  hour_of_day: number
  post_count: number
  avg_engagement: number
  success_rate: number
}

export interface TopPost {
  post_id: string
  content: Record<Platform, string>
  platforms: Platform[]
  scheduled_for: string
  total_engagement: number
  total_likes: number
  total_shares: number
  total_comments: number
  successful_platforms: number
  success_rate: number
  posted_at: string
}

export interface PostsOverTime {
  date: string
  count: number
  engagement: number
}

export interface DateRange {
  start: Date
  end: Date
}

export type DateRangePreset = '7d' | '30d' | '90d' | 'custom'

export interface AnalyticsFilters {
  dateRange: DateRangePreset
  customStart?: Date
  customEnd?: Date
  platform?: Platform | 'all'
}

export interface ChartDataPoint {
  name: string
  value: number
  [key: string]: string | number
}

export interface HeatmapDataPoint {
  day: number
  hour: number
  value: number
  postCount: number
}

export interface ExportData {
  summary: AnalyticsSummary
  platformPerformance: PlatformPerformance[]
  topPosts: TopPost[]
  postsOverTime: PostsOverTime[]
}
