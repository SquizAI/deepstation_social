export type Platform = 'linkedin' | 'instagram' | 'twitter' | 'discord'

export type PostStatus = 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed'

export type RecurrenceFrequency = 'none' | 'daily' | 'weekly' | 'monthly' | 'custom'

export interface RecurringPattern {
  frequency: RecurrenceFrequency
  interval?: number // e.g., every 2 weeks
  daysOfWeek?: number[] // 0-6 (Sunday-Saturday) for weekly
  dayOfMonth?: number // 1-31 for monthly
  endDate?: string // ISO date string
  occurrenceCount?: number // number of times to repeat
}

export interface PostContent {
  linkedin: string
  instagram: string
  twitter: string
  discord: string
}

export interface PostImage {
  platform: Platform
  url: string
}

export interface ScheduledPost {
  id: string
  user_id: string
  content: PostContent
  images?: PostImage[]
  platforms: Platform[]
  scheduled_for?: string
  timezone?: string
  recurring_pattern?: RecurringPattern
  parent_recurring_id?: string // Links to the recurring post template
  status: PostStatus
  published_at?: string
  publish_results?: Record<Platform, { success: boolean; error?: string; post_id?: string; post_url?: string }>
  retry_count?: number
  max_retries?: number
  last_error?: string
  created_at: string
  updated_at: string
}

export interface RecurringPost {
  id: string
  user_id: string
  content: PostContent
  images?: PostImage[]
  platforms: Platform[]
  pattern: RecurringPattern
  timezone: string
  next_occurrence: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface PostAnalytics {
  post_id: string
  platform: Platform
  impressions?: number
  engagements?: number
  clicks?: number
  shares?: number
  comments?: number
  likes?: number
  reach?: number
  expected_engagement?: number
  actual_engagement?: number
  fetched_at: string
}

export interface ScheduleFilters {
  platforms?: Platform[]
  status?: PostStatus[]
  search?: string
  dateRange?: {
    start: string
    end: string
  }
}

export interface BulkAction {
  action: 'delete' | 'reschedule' | 'duplicate' | 'post_now'
  postIds: string[]
  newScheduledTime?: string // for reschedule
}

export interface CalendarPost {
  id: string
  title: string // First 50 chars of content
  platforms: Platform[]
  scheduled_for: string
  status: PostStatus
  color: string // Platform color
}

export const PLATFORM_COLORS: Record<Platform, string> = {
  linkedin: '#0A66C2',
  instagram: '#E4405F',
  twitter: '#1DA1F2',
  discord: '#5865F2'
}

export const STATUS_COLORS: Record<PostStatus, string> = {
  draft: '#6B7280',
  scheduled: '#3B82F6',
  publishing: '#F59E0B',
  published: '#10B981',
  failed: '#EF4444'
}

export const PLATFORM_ICONS: Record<Platform, string> = {
  linkedin: '🔗',
  instagram: '📷',
  twitter: '🐦',
  discord: '💬'
}
