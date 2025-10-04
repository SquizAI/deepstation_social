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
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <p className="text-center text-gray-500">No posts available</p>
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
      className={`w-4 h-4 ml-1 inline ${active ? 'text-blue-600' : 'text-gray-400'}`}
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
      linkedin: 'bg-blue-100 text-blue-700',
      instagram: 'bg-pink-100 text-pink-700',
      twitter: 'bg-sky-100 text-sky-700',
      discord: 'bg-indigo-100 text-indigo-700'
    }
    return colors[platform] || 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {title && (
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Post
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('total_engagement')}
              >
                Engagement
                <SortIcon active={sortKey === 'total_engagement'} direction={sortDirection} />
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('total_likes')}
              >
                Likes
                <SortIcon active={sortKey === 'total_likes'} direction={sortDirection} />
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('total_shares')}
              >
                Shares
                <SortIcon active={sortKey === 'total_shares'} direction={sortDirection} />
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('total_comments')}
              >
                Comments
                <SortIcon active={sortKey === 'total_comments'} direction={sortDirection} />
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('success_rate')}
              >
                Success Rate
                <SortIcon active={sortKey === 'success_rate'} direction={sortDirection} />
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedPosts.map((post) => (
              <tr key={post.post_id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="max-w-xs">
                    <p className="text-sm text-gray-900 line-clamp-2">
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
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {format(new Date(post.posted_at), 'MMM d, yyyy')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {post.total_engagement.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {post.total_likes.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {post.total_shares.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {post.total_comments.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    post.success_rate === 100
                      ? 'bg-green-100 text-green-800'
                      : post.success_rate >= 50
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
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
