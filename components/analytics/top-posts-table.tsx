'use client'

import { useState } from 'react'
import { TopPost } from '@/lib/types/analytics'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'

interface TopPostsTableProps {
  posts: TopPost[]
  title?: string
}

type SortKey = 'total_engagement' | 'total_likes' | 'total_shares' | 'total_comments' | 'success_rate'
type SortDirection = 'asc' | 'desc'

export function TopPostsTable({ posts, title }: TopPostsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('total_engagement')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  if (!posts || posts.length === 0) {
    return (
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8">
        <p className="text-center text-slate-400">No posts available</p>
      </div>
    )
  }

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDirection('desc')
    }
  }

  const sortedPosts = [...posts].sort((a, b) => {
    const aValue = a[sortKey]
    const bValue = b[sortKey]
    const multiplier = sortDirection === 'asc' ? 1 : -1
    return (aValue - bValue) * multiplier
  })

  const SortIcon = ({ active, direction }: { active: boolean; direction: SortDirection }) => (
    <svg
      className={`w-4 h-4 ml-1 inline ${active ? 'text-fuchsia-400' : 'text-slate-400'}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      {direction === 'asc' ? (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      )}
    </svg>
  )

  const getPreviewContent = (post: TopPost): string => {
    // Get first available platform content
    const platform = post.platforms[0]
    return post.content[platform] || ''
  }

  const getPlatformBadgeColor = (platform: string) => {
    const colors: Record<string, string> = {
      linkedin: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
      instagram: 'bg-pink-500/20 text-pink-400 border border-pink-500/30',
      twitter: 'bg-sky-500/20 text-sky-400 border border-sky-500/30',
      discord: 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
    }
    return colors[platform] || 'bg-white/10 text-slate-400 border border-white/10'
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden hover:bg-white/10 transition-all">
      {title && (
        <div className="px-6 py-4 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-white/10">
          <thead className="bg-white/5">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Post
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Date
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-white/5"
                onClick={() => handleSort('total_engagement')}
              >
                Engagement
                <SortIcon active={sortKey === 'total_engagement'} direction={sortDirection} />
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-white/5"
                onClick={() => handleSort('total_likes')}
              >
                Likes
                <SortIcon active={sortKey === 'total_likes'} direction={sortDirection} />
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-white/5"
                onClick={() => handleSort('total_shares')}
              >
                Shares
                <SortIcon active={sortKey === 'total_shares'} direction={sortDirection} />
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-white/5"
                onClick={() => handleSort('total_comments')}
              >
                Comments
                <SortIcon active={sortKey === 'total_comments'} direction={sortDirection} />
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-white/5"
                onClick={() => handleSort('success_rate')}
              >
                Success Rate
                <SortIcon active={sortKey === 'success_rate'} direction={sortDirection} />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {sortedPosts.map((post) => (
              <tr key={post.post_id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4">
                  <div className="max-w-xs">
                    <p className="text-sm text-white line-clamp-2">
                      {getPreviewContent(post)}
                    </p>
                    <div className="mt-1 flex gap-1">
                      {post.platforms.map(platform => (
                        <span
                          key={platform}
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPlatformBadgeColor(platform)}`}
                        >
                          {platform}
                        </span>
                      ))}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                  {format(new Date(post.posted_at), 'MMM d, yyyy')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                  {post.total_engagement.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                  {post.total_likes.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                  {post.total_shares.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                  {post.total_comments.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    post.success_rate === 100
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : post.success_rate >= 50
                      ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {post.success_rate}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
