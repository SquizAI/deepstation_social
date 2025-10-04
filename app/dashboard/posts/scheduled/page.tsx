'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PostCard } from '@/components/posts/post-card'
import { RescheduleModal } from '@/components/posts/reschedule-modal'
import { PostResultsModal } from '@/components/posts/post-results-modal'
import { Search } from '@/components/ui/search'
import { Pagination } from '@/components/ui/pagination'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import type { ScheduledPost } from '@/lib/types/posts'

type StatusFilter = 'all' | 'draft' | 'scheduled' | 'published' | 'failed'
type SortOrder = 'newest' | 'oldest'

const ITEMS_PER_PAGE = 20

export default function ScheduledPostsPage() {
  const router = useRouter()
  const [posts, setPosts] = React.useState<ScheduledPost[]>([])
  const [filteredPosts, setFilteredPosts] = React.useState<ScheduledPost[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  // Filters and pagination
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('all')
  const [sortOrder, setSortOrder] = React.useState<SortOrder>('newest')
  const [searchQuery, setSearchQuery] = React.useState('')
  const [currentPage, setCurrentPage] = React.useState(1)

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

  // Apply filters, search, and sorting
  React.useEffect(() => {
    let filtered = [...posts]

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((post) => post.status === statusFilter)
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

    // Sort
    filtered.sort((a, b) => {
      const dateA = new Date(a.scheduled_for || a.created_at).getTime()
      const dateB = new Date(b.scheduled_for || b.created_at).getTime()
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB
    })

    setFilteredPosts(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }, [posts, statusFilter, searchQuery, sortOrder])

  // Pagination
  const totalPages = Math.ceil(filteredPosts.length / ITEMS_PER_PAGE)
  const paginatedPosts = React.useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredPosts.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredPosts, currentPage])

  // Handlers
  const handleEdit = (id: string) => {
    router.push(`/dashboard/posts/${id}/edit`)
  }

  const handleDelete = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('scheduled_posts')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      // Remove from local state
      setPosts((prev) => prev.filter((post) => post.id !== id))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete post')
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

  const handleRescheduleSuccess = () => {
    fetchPosts()
  }

  // Status counts for badges
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

      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white">Scheduled Posts</h1>
            <p className="text-slate-400 mt-1 text-sm sm:text-base">Manage your scheduled social media posts</p>
          </div>
          <button
            onClick={() => router.push('/dashboard/posts/new')}
            className="w-full sm:w-auto bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-fuchsia-600 hover:to-purple-700 transition-all shadow-lg shadow-fuchsia-500/25"
          >
            Create New Post
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 sm:p-6 mb-6 hover:border-white/20 transition-all">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <Search
              placeholder="Search posts..."
              onSearch={setSearchQuery}
            />
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-300 whitespace-nowrap">
              Sort by:
            </label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as SortOrder)}
              className="h-10 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500 transition-all"
            >
              <option value="newest" className="bg-[#201033]">Newest First</option>
              <option value="oldest" className="bg-[#201033]">Oldest First</option>
            </select>
          </div>
        </div>

        {/* Status filters */}
        <div className="flex gap-2 mt-4 flex-wrap">
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
              <span className="ml-1.5 text-xs opacity-80">
                ({statusCounts[status]})
              </span>
            </button>
          ))}
        </div>
      </div>

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

      {/* Posts list */}
      {!loading && (
        <>
          {filteredPosts.length === 0 ? (
            <div className="text-center py-12 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl">
              <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-white">
                {searchQuery || statusFilter !== 'all' ? 'No posts found' : 'No posts yet'}
              </h3>
              <p className="mt-2 text-sm text-slate-400">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your filters or search query'
                  : 'Get started by creating your first post'}
              </p>
              {!searchQuery && statusFilter === 'all' && (
                <button
                  onClick={() => router.push('/dashboard/posts/new')}
                  className="mt-4 bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-fuchsia-600 hover:to-purple-700 transition-all shadow-lg"
                >
                  Create Post
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="space-y-4 mb-6">
                {paginatedPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onReschedule={handleReschedule}
                    onViewResults={handleViewResults}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={filteredPosts.length}
                    itemsPerPage={ITEMS_PER_PAGE}
                    onPageChange={setCurrentPage}
                  />
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
        onSuccess={handleRescheduleSuccess}
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
