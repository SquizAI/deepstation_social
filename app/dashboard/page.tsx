import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface DashboardStats {
  scheduledPosts: number
  publishedThisWeek: number
  connectedPlatforms: number
  engagementRate: string
}

interface RecentPost {
  id: string
  content: Record<string, string>
  scheduled_for: string
  platforms: string[]
  status: string
  created_at: string
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Fetch scheduled posts count
  const { count: scheduledCount } = await supabase
    .from('scheduled_posts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'scheduled')

  // Fetch published this week count
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

  const { count: publishedCount } = await supabase
    .from('scheduled_posts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'published')
    .gte('scheduled_for', oneWeekAgo.toISOString())

  // Fetch connected platforms
  const { data: connectedAccounts } = await supabase
    .from('oauth_tokens')
    .select('provider')
    .eq('user_id', user.id)

  const connectedPlatforms = connectedAccounts?.length || 0

  // Calculate engagement rate (placeholder - will be calculated from actual analytics)
  const engagementRate = '4.2%'

  // Fetch recent posts
  const { data: recentPosts } = await supabase
    .from('scheduled_posts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  // Fetch upcoming scheduled posts
  const { data: upcomingPosts } = await supabase
    .from('scheduled_posts')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'scheduled')
    .gte('scheduled_for', new Date().toISOString())
    .order('scheduled_for', { ascending: true })
    .limit(5)

  const stats: DashboardStats = {
    scheduledPosts: scheduledCount || 0,
    publishedThisWeek: publishedCount || 0,
    connectedPlatforms,
    engagementRate,
  }

  const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'there'

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {userName}!
        </h1>
        <p className="text-gray-600 mt-1">
          Here's what's happening with your social media today.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Link href="/dashboard/posts/new">
          <Button className="flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Post
          </Button>
        </Link>
        <Link href="/dashboard/accounts">
          <Button variant="outline" className="flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
            Connect Account
          </Button>
        </Link>
        <Link href="/dashboard/speakers">
          <Button variant="outline" className="flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              />
            </svg>
            Speaker Announcement
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled Posts</CardTitle>
            <svg
              className="h-4 w-4 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.scheduledPosts}</div>
            <p className="text-xs text-gray-600 mt-1">Ready to publish</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published This Week</CardTitle>
            <svg
              className="h-4 w-4 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.publishedThisWeek}</div>
            <p className="text-xs text-gray-600 mt-1">Last 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connected Platforms</CardTitle>
            <svg
              className="h-4 w-4 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.connectedPlatforms}</div>
            <p className="text-xs text-gray-600 mt-1">Active connections</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
            <svg
              className="h-4 w-4 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.engagementRate}</div>
            <p className="text-xs text-gray-600 mt-1">Average across platforms</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent and Upcoming Posts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Posts */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Posts</CardTitle>
            <CardDescription>Your latest social media activity</CardDescription>
          </CardHeader>
          <CardContent>
            {recentPosts && recentPosts.length > 0 ? (
              <div className="space-y-4">
                {recentPosts.map((post: RecentPost) => (
                  <div
                    key={post.id}
                    className="flex items-start justify-between border-b border-gray-100 pb-4 last:border-0 last:pb-0"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {Object.values(post.content)[0]?.substring(0, 60)}
                        {Object.values(post.content)[0]?.length > 60 ? '...' : ''}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-gray-500">
                          {new Date(post.created_at).toLocaleDateString()}
                        </p>
                        <div className="flex gap-1">
                          {post.platforms?.map((platform) => (
                            <Badge key={platform} variant="default" className="text-xs">
                              {platform}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <Badge
                      variant={
                        post.status === 'published'
                          ? 'success'
                          : post.status === 'scheduled'
                          ? 'info'
                          : 'default'
                      }
                      className="ml-2"
                    >
                      {post.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
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
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p className="mt-2 text-sm">No posts yet</p>
                <Link href="/dashboard/posts/new">
                  <Button variant="outline" className="mt-4">
                    Create Your First Post
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Scheduled Posts */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Scheduled</CardTitle>
            <CardDescription>Posts ready to publish</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingPosts && upcomingPosts.length > 0 ? (
              <div className="space-y-4">
                {upcomingPosts.map((post: RecentPost) => (
                  <div
                    key={post.id}
                    className="flex items-start justify-between border-b border-gray-100 pb-4 last:border-0 last:pb-0"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {Object.values(post.content)[0]?.substring(0, 60)}
                        {Object.values(post.content)[0]?.length > 60 ? '...' : ''}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-gray-500">
                          {new Date(post.scheduled_for).toLocaleString()}
                        </p>
                        <div className="flex gap-1">
                          {post.platforms?.map((platform) => (
                            <Badge key={platform} variant="default" className="text-xs">
                              {platform}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <Link href={`/dashboard/posts/${post.id}`}>
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
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
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="mt-2 text-sm">No scheduled posts</p>
                <Link href="/dashboard/posts/new">
                  <Button variant="outline" className="mt-4">
                    Schedule a Post
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
