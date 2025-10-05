'use client'

import { useState } from 'react'
import { ScheduledPost, PLATFORM_COLORS, STATUS_COLORS, PLATFORM_ICONS } from '@/lib/types/schedule'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'

interface PostListItemProps {
  post: ScheduledPost
  selected: boolean
  onSelect: () => void
  onEdit: () => void
  onDelete: () => void
  onDuplicate: () => void
  onPostNow: () => void
  onRetry?: () => void
}

export function PostListItem({
  post,
  selected,
  onSelect,
  onEdit,
  onDelete,
  onDuplicate,
  onPostNow,
  onRetry
}: PostListItemProps) {
  const [expanded, setExpanded] = useState(false)

  const getPrimaryContent = () => {
    return post.content.linkedin || post.content.twitter || post.content.instagram || post.content.discord || 'No content'
  }

  const formatScheduledTime = () => {
    if (!post.scheduled_for) return 'Not scheduled'

    const date = new Date(post.scheduled_for)
    const now = new Date()
    const diffMs = date.getTime() - now.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

    const timeStr = date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    })

    if (diffMs < 0) {
      return `${timeStr} (Past due)`
    } else if (diffDays > 0) {
      return `${timeStr} (in ${diffDays}d ${diffHours}h)`
    } else if (diffHours > 0) {
      return `${timeStr} (in ${diffHours}h ${diffMins}m)`
    } else if (diffMins > 0) {
      return `${timeStr} (in ${diffMins}m)`
    } else {
      return `${timeStr} (now)`
    }
  }

  const getStatusIcon = () => {
    switch (post.status) {
      case 'published':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        )
      case 'failed':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        )
      case 'publishing':
        return (
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )
      case 'scheduled':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )
    }
  }

  return (
    <div className={`
      bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg overflow-hidden
      transition-all duration-200
      ${selected ? 'ring-2 ring-fuchsia-500 bg-fuchsia-500/10' : 'hover:bg-white/10'}
    `}>
      <div className="p-4">
        <div className="flex items-start gap-4">
          {/* Checkbox */}
          <div className="pt-1">
            <Checkbox
              checked={selected}
              onCheckedChange={onSelect}
              className="border-white/20"
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge
                    style={{ backgroundColor: STATUS_COLORS[post.status] }}
                    className="text-xs font-medium"
                  >
                    <span className="mr-1">{getStatusIcon()}</span>
                    {post.status}
                  </Badge>

                  {post.recurring_pattern && post.recurring_pattern.frequency !== 'none' && (
                    <Badge variant="outline" className="text-xs border-purple-500/30 bg-purple-500/10 text-purple-400">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      {post.recurring_pattern.frequency}
                    </Badge>
                  )}

                  {post.retry_count && post.retry_count > 0 && (
                    <Badge variant="outline" className="text-xs border-orange-500/30 bg-orange-500/10 text-orange-400">
                      Retry {post.retry_count}/{post.max_retries || 3}
                    </Badge>
                  )}
                </div>

                <p className={`text-white mb-2 ${expanded ? '' : 'line-clamp-2'}`}>
                  {getPrimaryContent()}
                </p>

                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {formatScheduledTime()}
                  </div>

                  {post.published_at && (
                    <div className="flex items-center gap-1 text-green-400">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Published {new Date(post.published_at).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Platform Icons */}
                <div className="flex gap-1">
                  {post.platforms.map(platform => (
                    <div
                      key={platform}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                      style={{ backgroundColor: `${PLATFORM_COLORS[platform]}20` }}
                      title={platform}
                    >
                      <span style={{ color: PLATFORM_COLORS[platform] }}>
                        {PLATFORM_ICONS[platform]}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Expand/Collapse Button */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setExpanded(!expanded)}
                  className="p-2"
                >
                  <svg
                    className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </Button>
              </div>
            </div>

            {/* Expanded Details */}
            {expanded && (
              <div className="mt-4 pt-4 border-t border-white/10 space-y-4">
                {/* Platform-specific content */}
                <div className="space-y-3">
                  {post.platforms.map(platform => {
                    const content = post.content[platform]
                    if (!content) return null

                    return (
                      <div key={platform} className="bg-white/5 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <span style={{ color: PLATFORM_COLORS[platform] }}>
                            {PLATFORM_ICONS[platform]}
                          </span>
                          <span className="text-sm font-medium text-white capitalize">
                            {platform}
                          </span>
                        </div>
                        <p className="text-sm text-gray-300">{content}</p>
                      </div>
                    )
                  })}
                </div>

                {/* Images */}
                {post.images && post.images.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Attached Images:</p>
                    <div className="flex gap-2">
                      {post.images.map((img, idx) => (
                        <img
                          key={idx}
                          src={img.url}
                          alt={`Post image ${idx + 1}`}
                          className="w-20 h-20 object-cover rounded-lg border border-white/10"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Publish Results */}
                {post.publish_results && (
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Publish Results:</p>
                    <div className="space-y-1">
                      {Object.entries(post.publish_results).map(([platform, result]) => (
                        <div key={platform} className="flex items-center justify-between text-sm">
                          <span className="text-gray-300 capitalize">{platform}:</span>
                          {result.success ? (
                            <div className="flex items-center gap-2">
                              <span className="text-green-400">Success</span>
                              {result.post_url && (
                                <a
                                  href={result.post_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-fuchsia-400 hover:text-fuchsia-300"
                                >
                                  View Post
                                </a>
                              )}
                            </div>
                          ) : (
                            <span className="text-red-400">
                              Failed: {result.error || 'Unknown error'}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {post.last_error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                    <p className="text-sm text-red-400">{post.last_error}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/10">
          <Button
            size="sm"
            variant="outline"
            onClick={onEdit}
            className="border-white/20 hover:bg-white/10"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={onDuplicate}
            className="border-white/20 hover:bg-white/10"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Duplicate
          </Button>

          {post.status === 'scheduled' && (
            <Button
              size="sm"
              variant="outline"
              onClick={onPostNow}
              className="border-green-500/30 text-green-400 hover:bg-green-500/10"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Post Now
            </Button>
          )}

          {post.status === 'failed' && onRetry && (
            <Button
              size="sm"
              variant="outline"
              onClick={onRetry}
              className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Retry
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={onDelete}
            className="border-red-500/30 text-red-400 hover:bg-red-500/10 ml-auto"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </Button>
        </div>
      </div>
    </div>
  )
}
