import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

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
    <div className="min-h-screen bg-gradient-to-br from-[#201033] via-[#15092b] to-[#0a0513]">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-[float_20s_ease-in-out_infinite]"></div>
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-fuchsia-500/20 rounded-full blur-3xl animate-[float_25s_ease-in-out_infinite_reverse]"></div>
      </div>

      <div className="relative space-y-8 p-8">
        {/* Welcome Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-fuchsia-200 to-purple-200 bg-clip-text text-transparent">
              Welcome back, {userName}!
            </h1>
            <p className="text-slate-400 mt-2 text-lg">
              Here's what's happening with your social media today.
            </p>
          </div>
          <Link href="/dashboard/posts/new">
            <button className="group relative overflow-hidden bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-fuchsia-500/50 hover:scale-105 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Post
              <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-600 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard/accounts">
            <button className="bg-white/5 backdrop-blur-sm text-white px-5 py-2.5 rounded-lg font-medium border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Connect Account
            </button>
          </Link>
          <Link href="/dashboard/speakers">
            <button className="bg-white/5 backdrop-blur-sm text-white px-5 py-2.5 rounded-lg font-medium border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              Speaker Announcement
            </button>
          </Link>
          <Link href="/dashboard/analytics">
            <button className="bg-white/5 backdrop-blur-sm text-white px-5 py-2.5 rounded-lg font-medium border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Analytics
            </button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Scheduled Posts */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-fuchsia-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-2xl hover:border-white/20 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-fuchsia-500 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-xs text-slate-400 uppercase tracking-wider">Scheduled</span>
              </div>
              <div className="text-3xl font-bold text-white mb-1">{stats.scheduledPosts}</div>
              <p className="text-sm text-slate-400">Ready to publish</p>
            </div>
          </div>

          {/* Published This Week */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500/20 to-cyan-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-2xl hover:border-white/20 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-fuchsia-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-xs text-slate-400 uppercase tracking-wider">Published</span>
              </div>
              <div className="text-3xl font-bold text-white mb-1">{stats.publishedThisWeek}</div>
              <p className="text-sm text-slate-400">Last 7 days</p>
            </div>
          </div>

          {/* Connected Platforms */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-2xl hover:border-white/20 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-indigo-500 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <span className="text-xs text-slate-400 uppercase tracking-wider">Platforms</span>
              </div>
              <div className="text-3xl font-bold text-white mb-1">{stats.connectedPlatforms}</div>
              <p className="text-sm text-slate-400">Active connections</p>
            </div>
          </div>

          {/* Engagement Rate */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-2xl hover:border-white/20 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <span className="text-xs text-slate-400 uppercase tracking-wider">Engagement</span>
              </div>
              <div className="text-3xl font-bold text-white mb-1">{stats.engagementRate}</div>
              <p className="text-sm text-slate-400">Average rate</p>
            </div>
          </div>
        </div>

        {/* Recent and Upcoming Posts */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Posts */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">Recent Posts</h2>
                <p className="text-sm text-slate-400 mt-1">Your latest social media activity</p>
              </div>
              <Link href="/dashboard/posts/scheduled">
                <button className="text-fuchsia-400 hover:text-fuchsia-300 text-sm font-medium transition-colors">
                  View all →
                </button>
              </Link>
            </div>

            {recentPosts && recentPosts.length > 0 ? (
              <div className="space-y-4">
                {recentPosts.map((post: RecentPost) => (
                  <div
                    key={post.id}
                    className="bg-white/5 rounded-lg p-4 border border-white/5 hover:border-white/10 transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate mb-2">
                          {Object.values(post.content)[0]?.substring(0, 60)}
                          {Object.values(post.content)[0]?.length > 60 ? '...' : ''}
                        </p>
                        <div className="flex items-center gap-3">
                          <p className="text-xs text-slate-500">
                            {new Date(post.created_at).toLocaleDateString()}
                          </p>
                          <div className="flex gap-1">
                            {post.platforms?.map((platform) => (
                              <span
                                key={platform}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30"
                              >
                                {platform}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                          post.status === 'published'
                            ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                            : post.status === 'scheduled'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : 'bg-slate-500/20 text-slate-300 border border-slate-500/30'
                        }`}
                      >
                        {post.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-white/5 rounded-2xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-slate-400 mb-4">No posts yet</p>
                <Link href="/dashboard/posts/new">
                  <button className="bg-white/5 text-white px-6 py-2.5 rounded-lg font-medium border border-white/10 hover:bg-white/10 transition-all">
                    Create Your First Post
                  </button>
                </Link>
              </div>
            )}
          </div>

          {/* Upcoming Scheduled Posts */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">Upcoming Scheduled</h2>
                <p className="text-sm text-slate-400 mt-1">Posts ready to publish</p>
              </div>
              <Link href="/dashboard/posts/scheduled">
                <button className="text-fuchsia-400 hover:text-fuchsia-300 text-sm font-medium transition-colors">
                  View all →
                </button>
              </Link>
            </div>

            {upcomingPosts && upcomingPosts.length > 0 ? (
              <div className="space-y-4">
                {upcomingPosts.map((post: RecentPost) => (
                  <div
                    key={post.id}
                    className="bg-white/5 rounded-lg p-4 border border-white/5 hover:border-white/10 transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate mb-2">
                          {Object.values(post.content)[0]?.substring(0, 60)}
                          {Object.values(post.content)[0]?.length > 60 ? '...' : ''}
                        </p>
                        <div className="flex items-center gap-3">
                          <p className="text-xs text-slate-500">
                            {new Date(post.scheduled_for).toLocaleString()}
                          </p>
                          <div className="flex gap-1">
                            {post.platforms?.map((platform) => (
                              <span
                                key={platform}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30"
                              >
                                {platform}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <Link href={`/dashboard/posts/${post.id}`}>
                        <button className="text-slate-400 hover:text-white transition-colors text-sm font-medium">
                          Edit
                        </button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-white/5 rounded-2xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-slate-400 mb-4">No scheduled posts</p>
                <Link href="/dashboard/posts/new">
                  <button className="bg-white/5 text-white px-6 py-2.5 rounded-lg font-medium border border-white/10 hover:bg-white/10 transition-all">
                    Schedule a Post
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
