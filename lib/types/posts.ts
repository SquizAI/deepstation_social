export type Platform = 'linkedin' | 'instagram' | 'twitter' | 'discord'

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

export interface RecurringOptions {
  frequency: 'none' | 'daily' | 'weekly' | 'monthly'
  daysOfWeek?: number[] // 0-6 (Sunday-Saturday)
}

export interface ScheduledPost {
  id: string
  user_id: string
  content: PostContent
  images?: PostImage[]
  platforms: Platform[]
  scheduled_for?: string
  timezone?: string
  recurring?: RecurringOptions
  status: 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed'
  published_at?: string
  publish_results?: Record<Platform, { success: boolean; error?: string }>
  created_at: string
  updated_at: string
}

export interface PlatformLimits {
  linkedin: number
  instagram: number
  twitter: number
  discord: number
}

export const PLATFORM_LIMITS: PlatformLimits = {
  linkedin: 3000,
  instagram: 2200,
  twitter: 280,
  discord: 4000
}

export interface OAuthAccount {
  id: string
  user_id: string
  platform: Platform
  access_token: string
  refresh_token?: string
  expires_at?: string
  webhook_url?: string
  created_at: string
}
