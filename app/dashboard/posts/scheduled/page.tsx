'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { RescheduleModal } from '@/components/posts/reschedule-modal'
import { PostResultsModal } from '@/components/posts/post-results-modal'
import { Search } from '@/components/ui/search'
import { Checkbox } from '@/components/ui/checkbox'
import type { ScheduledPost, Platform } from '@/lib/types/posts'

type StatusFilter = 'all' | 'draft' | 'scheduled' | 'published' | 'failed'
type ViewMode = 'list' | 'calendar' | 'timeline'

const ITEMS_PER_PAGE = 12

const PLATFORM_COLORS: Record<Platform, string> = {
  linkedin: 'bg-blue-600',
  instagram: 'bg-gradient-to-r from-purple-600 to-pink-600',
  twitter: 'bg-sky-500',
  discord: 'bg-indigo-600'
}

const PLATFORM_LABELS: Record<Platform, string> = {
  linkedin: 'LinkedIn',
  instagram: 'Instagram',
  twitter: 'Twitter',
  discord: 'Discord'
}

export default function ScheduledPostsPage() {
  const router = useRouter()
  const [posts, setPosts] = React.useState<ScheduledPost[]>([])
  const [filteredPosts, setFilteredPosts] = React.useState<ScheduledPost[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  // View mode
  const [viewMode, setViewMode] = React.useState<ViewMode>('list')

  // Filters
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('all')
  const [platformFilters, setPlatformFilters] = React.useState<Platform[]>([])
  const [dateRange, setDateRange] = React.useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null
  })
  const [searchQuery, setSearchQuery] = React.useState('')
  const [currentPage, setCurrentPage] = React.useState(1)

  // Bulk actions
  const [selectedPosts, setSelectedPosts] = React.useState<Set<string>>(new Set())
  const [showBulkActions, setShowBulkActions] = React.useState(false)

  // Modals
  const [reschedulePost, setReschedulePost] = React.useState<ScheduledPost | null>(null)
  const [resultsPost, setResultsPost] = React.useState<ScheduledPost | null>(null)

  const supabase = createClient()

  // Fetch posts
  const fetchPosts = React.useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data, error: fetchError } = await supabase
        .from('scheduled_posts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      setPosts(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch posts')
    } finally {
      setLoading(false)
    }
  }, [router, supabase])

  React.useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  // Apply filters
  React.useEffect(() => {
    let filtered = [...posts]

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((post) => post.status === statusFilter)
    }

    // Platform filters
    if (platformFilters.length > 0) {
      filtered = filtered.filter((post) =>
        post.platforms.some((p) => platformFilters.includes(p))
      )
    }

    // Date range filter
    if (dateRange.start || dateRange.end) {
      filtered = filtered.filter((post) => {
        if (!post.scheduled_for) return false
        const postDate = new Date(post.scheduled_for)
        if (dateRange.start && postDate < dateRange.start) return false
        if (dateRange.end && postDate > dateRange.end) return false
        return true
      })
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((post) => {
        const contentString = Object.values(post.content).join(' ').toLowerCase()
        const platformString = post.platforms.join(' ').toLowerCase()
        return contentString.includes(query) || platformString.includes(query)
      })
    }

    // Sort by scheduled date
    filtered.sort((a, b) => {
      const dateA = new Date(a.scheduled_for || a.created_at).getTime()
      const dateB = new Date(b.scheduled_for || b.created_at).getTime()
      return dateA - dateB
    })

    setFilteredPosts(filtered)
    setCurrentPage(1)
  }, [posts, statusFilter, platformFilters, dateRange, searchQuery])

  // Pagination
  const totalPages = Math.ceil(filteredPosts.length / ITEMS_PER_PAGE)
  const paginatedPosts = React.useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredPosts.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredPosts, currentPage])

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedPosts.size === paginatedPosts.length) {
      setSelectedPosts(new Set())
    } else {
      setSelectedPosts(new Set(paginatedPosts.map((p) => p.id)))
    }
  }

  const toggleSelectPost = (id: string) => {
    const newSelected = new Set(selectedPosts)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedPosts(newSelected)
  }

  // Handlers
  const handleEdit = (id: string) => {
    router.push(`/dashboard/posts/${id}/edit`)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return

    try {
      const { error: deleteError } = await supabase
        .from('scheduled_posts')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      setPosts((prev) => prev.filter((post) => post.id !== id))
      setSelectedPosts((prev) => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete post')
    }
  }

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedPosts.size} posts?`)) return

    try {
      const { error: deleteError } = await supabase
        .from('scheduled_posts')
        .delete()
        .in('id', Array.from(selectedPosts))

      if (deleteError) throw deleteError

      setPosts((prev) => prev.filter((post) => !selectedPosts.has(post.id)))
      setSelectedPosts(new Set())
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete posts')
    }
  }

  const handleDuplicate = async (id: string) => {
    try {
      const post = posts.find((p) => p.id === id)
      if (!post) return

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error: insertError } = await supabase
        .from('scheduled_posts')
        .insert({
          user_id: user.id,
          content: post.content,
          images: post.images,
          platforms: post.platforms,
          scheduled_for: null,
          timezone: post.timezone,
          recurring: post.recurring,
          status: 'draft'
        })

      if (insertError) throw insertError

      fetchPosts()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to duplicate post')
    }
  }

  const handleReschedule = (id: string) => {
    const post = posts.find((p) => p.id === id)
    if (post) setReschedulePost(post)
  }

  const handleViewResults = (id: string) => {
    const post = posts.find((p) => p.id === id)
    if (post) setResultsPost(post)
  }

  const togglePlatformFilter = (platform: Platform) => {
    setPlatformFilters((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    )
  }

  const clearAllFilters = () => {
    setStatusFilter('all')
    setPlatformFilters([])
    setDateRange({ start: null, end: null })
    setSearchQuery('')
  }

  const hasActiveFilters =
    statusFilter !== 'all' ||
    platformFilters.length > 0 ||
    dateRange.start !== null ||
    dateRange.end !== null ||
    searchQuery !== ''

  // Status counts
  const statusCounts = React.useMemo(() => {
    return {
      all: posts.length,
      draft: posts.filter((p) => p.status === 'draft').length,
      scheduled: posts.filter((p) => p.status === 'scheduled').length,
      published: posts.filter((p) => p.status === 'published').length,
      failed: posts.filter((p) => p.status === 'failed').length
    }
  }, [posts])

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#201033] via-[#15092b] to-[#0a0513] p-4 sm:p-6 lg:p-8">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] bg-fuchsia-500/10 rounded-full blur-3xl animate-[float_20s_ease-in-out_infinite]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] bg-purple-500/10 rounded-full blur-3xl animate-[float_25s_ease-in-out_infinite_reverse]"></div>
      </div>

      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-fuchsia-400 to-purple-400 bg-clip-text text-transparent">
              Scheduled Posts
            </h1>
            <p className="text-slate-400 mt-1 text-sm sm:text-base">
              {filteredPosts.length} {filteredPosts.length === 1 ? 'post' : 'posts'}
              {selectedPosts.size > 0 && ` • ${selectedPosts.size} selected`}
            </p>
          </div>
          <button
            onClick={() => router.push('/dashboard/posts/new')}
            className="w-full sm:w-auto bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-fuchsia-600 hover:to-purple-700 transition-all shadow-lg shadow-fuchsia-500/25 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create New Post
          </button>
        </div>

        {/* View Mode Toggle */}
        <div className="mb-6">
          <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-1 w-fit">
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                viewMode === 'list'
                  ? 'bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white shadow-lg'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              List
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                viewMode === 'calendar'
                  ? 'bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white shadow-lg'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Calendar
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                viewMode === 'timeline'
                  ? 'bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white shadow-lg'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Timeline
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 sm:p-6 mb-6 hover:border-white/20 transition-all">
          {/* Search and Actions Row */}
          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            <div className="flex-1">
              <Search placeholder="Search posts..." onSearch={setSearchQuery} />
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-all flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear Filters
              </button>
            )}
          </div>

          {/* Status Filters */}
          <div className="mb-4">
            <label className="text-xs font-medium text-slate-400 mb-2 block">Status</label>
            <div className="flex gap-2 flex-wrap">
              {(['all', 'draft', 'scheduled', 'published', 'failed'] as StatusFilter[]).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    statusFilter === status
                      ? 'bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white shadow-lg'
                      : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                  <span className="ml-1.5 text-xs opacity-80">({statusCounts[status]})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Platform Filters */}
          <div className="mb-4">
            <label className="text-xs font-medium text-slate-400 mb-2 block">Platforms</label>
            <div className="flex gap-2 flex-wrap">
              {(['linkedin', 'instagram', 'twitter', 'discord'] as Platform[]).map((platform) => (
                <button
                  key={platform}
                  onClick={() => togglePlatformFilter(platform)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                    platformFilters.includes(platform)
                      ? 'bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white shadow-lg'
                      : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full ${PLATFORM_COLORS[platform]}`} />
                  {PLATFORM_LABELS[platform]}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range Filter */}
          <div>
            <label className="text-xs font-medium text-slate-400 mb-2 block">Scheduled Date Range</label>
            <div className="flex gap-2 flex-wrap items-center">
              <input
                type="date"
                value={dateRange.start ? dateRange.start.toISOString().split('T')[0] : ''}
                onChange={(e) =>
                  setDateRange((prev) => ({
                    ...prev,
                    start: e.target.value ? new Date(e.target.value) : null
                  }))
                }
                className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500 transition-all"
              />
              <span className="text-slate-400">to</span>
              <input
                type="date"
                value={dateRange.end ? dateRange.end.toISOString().split('T')[0] : ''}
                onChange={(e) =>
                  setDateRange((prev) => ({
                    ...prev,
                    end: e.target.value ? new Date(e.target.value) : null
                  }))
                }
                className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500 transition-all"
              />
              {(dateRange.start || dateRange.end) && (
                <button
                  onClick={() => setDateRange({ start: null, end: null })}
                  className="px-3 py-2 rounded-lg text-xs font-medium bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-all"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedPosts.size > 0 && (
          <div className="bg-gradient-to-r from-fuchsia-500/10 to-purple-600/10 backdrop-blur-sm border border-fuchsia-500/20 rounded-xl p-4 mb-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-fuchsia-500 to-purple-600 flex items-center justify-center text-white font-bold">
                {selectedPosts.size}
              </div>
              <span className="text-white font-medium">
                {selectedPosts.size} {selectedPosts.size === 1 ? 'post' : 'posts'} selected
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-500/30 transition-all flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
              <button
                onClick={() => setSelectedPosts(new Set())}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-all"
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 backdrop-blur-sm">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-fuchsia-500 border-t-transparent rounded-full animate-spin" />
            <p className="mt-4 text-slate-400">Loading posts...</p>
          </div>
        )}

        {/* Content based on view mode */}
        {!loading && (
          <>
            {filteredPosts.length === 0 ? (
              <div className="text-center py-12 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl">
                <svg className="mx-auto h-16 w-16 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-white">
                  {hasActiveFilters ? 'No posts found' : 'No posts yet'}
                </h3>
                <p className="mt-2 text-sm text-slate-400">
                  {hasActiveFilters
                    ? 'Try adjusting your filters or search query'
                    : 'Get started by creating your first post'}
                </p>
                {!hasActiveFilters && (
                  <button
                    onClick={() => router.push('/dashboard/posts/new')}
                    className="mt-6 bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-fuchsia-600 hover:to-purple-700 transition-all shadow-lg"
                  >
                    Create Post
                  </button>
                )}
              </div>
            ) : (
              <>
                {viewMode === 'list' && (
                  <ListView
                    posts={paginatedPosts}
                    selectedPosts={selectedPosts}
                    onToggleSelect={toggleSelectPost}
                    onToggleSelectAll={toggleSelectAll}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onDuplicate={handleDuplicate}
                    onReschedule={handleReschedule}
                    onViewResults={handleViewResults}
                    allSelected={selectedPosts.size === paginatedPosts.length && paginatedPosts.length > 0}
                  />
                )}

                {viewMode === 'calendar' && (
                  <CalendarView
                    posts={filteredPosts}
                    onEdit={handleEdit}
                    onReschedule={handleReschedule}
                  />
                )}

                {viewMode === 'timeline' && (
                  <TimelineView
                    posts={filteredPosts}
                    onEdit={handleEdit}
                    onReschedule={handleReschedule}
                  />
                )}

                {/* Pagination (only for list view) */}
                {viewMode === 'list' && totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-between bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                    <div className="text-sm text-slate-400">
                      Page {currentPage} of {totalPages} • {filteredPosts.length} total posts
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 rounded-lg text-sm font-medium bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 rounded-lg text-sm font-medium bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Modals */}
        <RescheduleModal
          post={reschedulePost}
          open={reschedulePost !== null}
          onClose={() => setReschedulePost(null)}
          onSuccess={fetchPosts}
        />

        <PostResultsModal
          post={resultsPost}
          open={resultsPost !== null}
          onClose={() => setResultsPost(null)}
        />
      </div>
    </div>
  )
}

// ==================== LIST VIEW ====================

interface ListViewProps {
  posts: ScheduledPost[]
  selectedPosts: Set<string>
  onToggleSelect: (id: string) => void
  onToggleSelectAll: () => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
  onReschedule: (id: string) => void
  onViewResults: (id: string) => void
  allSelected: boolean
}

function ListView({
  posts,
  selectedPosts,
  onToggleSelect,
  onToggleSelectAll,
  onEdit,
  onDelete,
  onDuplicate,
  onReschedule,
  onViewResults,
  allSelected
}: ListViewProps) {
  return (
    <div>
      {/* Select All */}
      <div className="mb-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
        <Checkbox
          checked={allSelected}
          onChange={onToggleSelectAll}
          className="accent-fuchsia-500"
        />
        <label className="ml-3 text-sm font-medium text-slate-300 cursor-pointer" onClick={onToggleSelectAll}>
          Select all on this page
        </label>
      </div>

      {/* Posts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {posts.map((post) => (
          <EnhancedPostCard
            key={post.id}
            post={post}
            selected={selectedPosts.has(post.id)}
            onToggleSelect={() => onToggleSelect(post.id)}
            onEdit={() => onEdit(post.id)}
            onDelete={() => onDelete(post.id)}
            onDuplicate={() => onDuplicate(post.id)}
            onReschedule={() => onReschedule(post.id)}
            onViewResults={() => onViewResults(post.id)}
          />
        ))}
      </div>
    </div>
  )
}

// ==================== ENHANCED POST CARD ====================

interface EnhancedPostCardProps {
  post: ScheduledPost
  selected: boolean
  onToggleSelect: () => void
  onEdit: () => void
  onDelete: () => void
  onDuplicate: () => void
  onReschedule: () => void
  onViewResults: () => void
}

function EnhancedPostCard({
  post,
  selected,
  onToggleSelect,
  onEdit,
  onDelete,
  onDuplicate,
  onReschedule,
  onViewResults
}: EnhancedPostCardProps) {
  const [showActions, setShowActions] = React.useState(false)

  const previewContent = React.useMemo(() => {
    for (const platform of post.platforms) {
      const content = post.content[platform]
      if (content && content.trim()) {
        return content.length > 150 ? content.substring(0, 150) + '...' : content
      }
    }
    return 'No content available'
  }, [post])

  const previewImage = React.useMemo(() => {
    return post.images && post.images.length > 0 ? post.images[0].url : null
  }, [post.images])

  const scheduledTime = React.useMemo(() => {
    if (!post.scheduled_for) return 'Not scheduled'
    const date = new Date(post.scheduled_for)
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    }).format(date)
  }, [post.scheduled_for])

  const statusColors = {
    draft: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    scheduled: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    publishing: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    published: 'bg-green-500/20 text-green-300 border-green-500/30',
    failed: 'bg-red-500/20 text-red-300 border-red-500/30'
  }

  return (
    <div
      className={`group relative bg-white/5 backdrop-blur-sm border rounded-xl overflow-hidden transition-all hover:border-white/30 ${
        selected ? 'border-fuchsia-500/50 ring-2 ring-fuchsia-500/20' : 'border-white/10'
      }`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Checkbox */}
      <div className="absolute top-4 left-4 z-10">
        <Checkbox
          checked={selected}
          onChange={onToggleSelect}
          className="accent-fuchsia-500 w-5 h-5"
        />
      </div>

      {/* Preview Image */}
      {previewImage && (
        <div className="relative h-48 overflow-hidden">
          <img
            src={previewImage}
            alt="Post preview"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#201033] via-transparent to-transparent" />
        </div>
      )}

      {/* Content */}
      <div className={`p-6 ${previewImage ? 'pt-4' : 'pt-12'}`}>
        {/* Status Badge */}
        <div className="flex items-center justify-between mb-3">
          <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[post.status]}`}>
            {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
          </div>
          {post.recurring && post.recurring.frequency !== 'none' && (
            <div className="flex items-center gap-1 text-xs text-purple-300">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {post.recurring.frequency}
            </div>
          )}
        </div>

        {/* Platform Badges */}
        <div className="flex flex-wrap gap-2 mb-3">
          {post.platforms.map((platform) => (
            <div
              key={platform}
              className={`px-2 py-1 rounded-md text-xs font-medium text-white ${PLATFORM_COLORS[platform]}`}
            >
              {PLATFORM_LABELS[platform]}
            </div>
          ))}
        </div>

        {/* Content Preview */}
        <p className="text-sm text-slate-300 line-clamp-3 mb-4">{previewContent}</p>

        {/* Schedule Info */}
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-4">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {scheduledTime}
        </div>

        {/* Quick Actions (show on hover) */}
        {showActions && (
          <div className="flex items-center gap-2 border-t border-white/10 pt-4 animate-fadeIn">
            <button
              onClick={onEdit}
              className="flex-1 px-3 py-2 rounded-lg text-xs font-medium bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-all flex items-center justify-center gap-1"
              title="Edit"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
            {post.status !== 'published' && (
              <button
                onClick={onReschedule}
                className="flex-1 px-3 py-2 rounded-lg text-xs font-medium bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-all flex items-center justify-center gap-1"
                title="Reschedule"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Reschedule
              </button>
            )}
            <button
              onClick={onDuplicate}
              className="flex-1 px-3 py-2 rounded-lg text-xs font-medium bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-all flex items-center justify-center gap-1"
              title="Duplicate"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Duplicate
            </button>
            {post.status === 'published' && (
              <button
                onClick={onViewResults}
                className="flex-1 px-3 py-2 rounded-lg text-xs font-medium bg-green-500/20 border border-green-500/30 text-green-300 hover:bg-green-500/30 transition-all flex items-center justify-center gap-1"
                title="View Results"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Results
              </button>
            )}
            <button
              onClick={onDelete}
              className="px-3 py-2 rounded-lg text-xs font-medium bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-500/30 transition-all"
              title="Delete"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ==================== CALENDAR VIEW ====================

interface CalendarViewProps {
  posts: ScheduledPost[]
  onEdit: (id: string) => void
  onReschedule: (id: string) => void
}

function CalendarView({ posts, onEdit, onReschedule }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = React.useState(new Date())

  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate()

  const firstDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  ).getDay()

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
  }

  // Group posts by day
  const postsByDay = React.useMemo(() => {
    const grouped: Record<number, ScheduledPost[]> = {}
    posts.forEach((post) => {
      if (!post.scheduled_for) return
      const date = new Date(post.scheduled_for)
      if (
        date.getMonth() === currentMonth.getMonth() &&
        date.getFullYear() === currentMonth.getFullYear()
      ) {
        const day = date.getDate()
        if (!grouped[day]) grouped[day] = []
        grouped[day].push(post)
      }
    })
    return grouped
  }, [posts, currentMonth])

  const days = []
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="min-h-[120px] bg-white/5 rounded-lg" />)
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dayPosts = postsByDay[day] || []
    const isToday =
      new Date().getDate() === day &&
      new Date().getMonth() === currentMonth.getMonth() &&
      new Date().getFullYear() === currentMonth.getFullYear()

    days.push(
      <div
        key={day}
        className={`min-h-[120px] bg-white/5 rounded-lg p-2 border transition-all hover:border-white/20 ${
          isToday ? 'border-fuchsia-500/50 ring-2 ring-fuchsia-500/20' : 'border-white/10'
        }`}
      >
        <div className={`text-sm font-semibold mb-2 ${isToday ? 'text-fuchsia-400' : 'text-slate-300'}`}>
          {day}
        </div>
        <div className="space-y-1">
          {dayPosts.slice(0, 3).map((post) => (
            <button
              key={post.id}
              onClick={() => onEdit(post.id)}
              className="w-full text-left px-2 py-1 rounded text-xs bg-white/10 hover:bg-white/20 transition-all truncate"
            >
              <div className="flex items-center gap-1 mb-1">
                {post.platforms.map((platform) => (
                  <div
                    key={platform}
                    className={`w-2 h-2 rounded-full ${PLATFORM_COLORS[platform]}`}
                  />
                ))}
              </div>
              <span className="text-slate-300 line-clamp-1">
                {post.content[post.platforms[0]]?.substring(0, 30) || 'No content'}
              </span>
            </button>
          ))}
          {dayPosts.length > 3 && (
            <div className="text-xs text-slate-400 pl-2">+{dayPosts.length - 3} more</div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={previousMonth}
          className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-slate-300"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-2xl font-bold text-white">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h2>
        <button
          onClick={nextMonth}
          className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-slate-300"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((name) => (
          <div key={name} className="text-center text-sm font-medium text-slate-400 py-2">
            {name}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-2">{days}</div>
    </div>
  )
}

// ==================== TIMELINE VIEW ====================

interface TimelineViewProps {
  posts: ScheduledPost[]
  onEdit: (id: string) => void
  onReschedule: (id: string) => void
}

function TimelineView({ posts, onEdit, onReschedule }: TimelineViewProps) {
  // Group posts by date
  const postsByDate = React.useMemo(() => {
    const grouped: Record<string, ScheduledPost[]> = {}
    posts.forEach((post) => {
      if (!post.scheduled_for) return
      const date = new Date(post.scheduled_for).toISOString().split('T')[0]
      if (!grouped[date]) grouped[date] = []
      grouped[date].push(post)
    })
    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b))
  }, [posts])

  // Get next 30 days for timeline
  const timelineDays = React.useMemo(() => {
    const days = []
    const today = new Date()
    for (let i = 0; i < 30; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      days.push(date.toISOString().split('T')[0])
    }
    return days
  }, [])

  return (
    <div className="space-y-6">
      {/* Timeline Header */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
        <h3 className="text-lg font-semibold text-white mb-2">30-Day Timeline</h3>
        <p className="text-sm text-slate-400">Visual timeline of your upcoming scheduled posts</p>
      </div>

      {/* Timeline */}
      <div className="space-y-4">
        {timelineDays.map((dateStr) => {
          const date = new Date(dateStr)
          const dayPosts = postsByDate.find(([d]) => d === dateStr)?.[1] || []
          const isToday = dateStr === new Date().toISOString().split('T')[0]

          return (
            <div
              key={dateStr}
              className={`bg-white/5 backdrop-blur-sm border rounded-xl p-4 transition-all ${
                isToday ? 'border-fuchsia-500/50 ring-2 ring-fuchsia-500/20' : 'border-white/10'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Date Badge */}
                <div className={`flex-shrink-0 w-16 text-center py-2 rounded-lg ${
                  isToday ? 'bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white' : 'bg-white/10 text-slate-300'
                }`}>
                  <div className="text-xs font-medium">{date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}</div>
                  <div className="text-2xl font-bold">{date.getDate()}</div>
                  <div className="text-xs">{date.toLocaleDateString('en-US', { month: 'short' })}</div>
                </div>

                {/* Posts for this day */}
                <div className="flex-1">
                  {dayPosts.length === 0 ? (
                    <div className="text-sm text-slate-500 italic py-2">No posts scheduled</div>
                  ) : (
                    <div className="space-y-2">
                      {dayPosts.map((post) => (
                        <div
                          key={post.id}
                          className="bg-white/5 border border-white/10 rounded-lg p-3 hover:border-white/20 transition-all cursor-pointer"
                          onClick={() => onEdit(post.id)}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              {/* Platforms */}
                              <div className="flex gap-2 mb-2">
                                {post.platforms.map((platform) => (
                                  <div
                                    key={platform}
                                    className={`px-2 py-0.5 rounded text-xs font-medium text-white ${PLATFORM_COLORS[platform]}`}
                                  >
                                    {PLATFORM_LABELS[platform]}
                                  </div>
                                ))}
                              </div>
                              {/* Content preview */}
                              <p className="text-sm text-slate-300 line-clamp-2">
                                {post.content[post.platforms[0]]?.substring(0, 100) || 'No content'}
                              </p>
                              {/* Time */}
                              <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {new Date(post.scheduled_for!).toLocaleTimeString('en-US', {
                                  hour: 'numeric',
                                  minute: '2-digit'
                                })}
                              </div>
                            </div>
                            {/* Status badge */}
                            <div className={`px-2 py-1 rounded text-xs font-semibold whitespace-nowrap ${
                              post.status === 'draft' ? 'bg-slate-500/20 text-slate-300' :
                              post.status === 'scheduled' ? 'bg-blue-500/20 text-blue-300' :
                              post.status === 'published' ? 'bg-green-500/20 text-green-300' :
                              'bg-red-500/20 text-red-300'
                            }`}>
                              {post.status}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
