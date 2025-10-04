'use client'

import * as React from 'react'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { formatDateInTimezone } from '@/lib/utils/timezone'
import type { ScheduledPost, Platform } from '@/lib/types/posts'

interface PostCardProps {
  post: ScheduledPost
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onReschedule: (id: string) => void
  onViewResults: (id: string) => void
}

const PLATFORM_ICONS: Record<Platform, string> = {
  linkedin: '💼',
  instagram: '📷',
  twitter: '🐦',
  discord: '💬'
}

const PLATFORM_LABELS: Record<Platform, string> = {
  linkedin: 'LinkedIn',
  instagram: 'Instagram',
  twitter: 'Twitter',
  discord: 'Discord'
}

const STATUS_VARIANTS: Record<ScheduledPost['status'], 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  draft: 'default',
  scheduled: 'info',
  publishing: 'warning',
  published: 'success',
  failed: 'error'
}

export function PostCard({ post, onEdit, onDelete, onReschedule, onViewResults }: PostCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false)

  // Get first non-empty content for preview
  const previewContent = React.useMemo(() => {
    for (const platform of post.platforms) {
      const content = post.content[platform]
      if (content && content.trim()) {
        const trimmed = content.length > 100 ? content.substring(0, 100) + '...' : content
        return trimmed
      }
    }
    return 'No content available'
  }, [post])

  // Get first image if available
  const previewImage = React.useMemo(() => {
    return post.images && post.images.length > 0 ? post.images[0].url : null
  }, [post.images])

  // Format scheduled time
  const scheduledTime = React.useMemo(() => {
    if (!post.scheduled_for) return 'Not scheduled'
    const date = new Date(post.scheduled_for)
    return formatDateInTimezone(date, post.timezone || 'America/New_York')
  }, [post.scheduled_for, post.timezone])

  // Get error message if failed
  const errorMessage = React.useMemo(() => {
    if (post.status !== 'failed' || !post.publish_results) return null

    const errors = Object.entries(post.publish_results)
      .filter(([_, result]) => !result.success && result.error)
      .map(([platform, result]) => `${PLATFORM_LABELS[platform as Platform]}: ${result.error}`)

    return errors.length > 0 ? errors[0] : null
  }, [post.status, post.publish_results])

  const handleDelete = () => {
    if (showDeleteConfirm) {
      onDelete(post.id)
      setShowDeleteConfirm(false)
    } else {
      setShowDeleteConfirm(true)
      setTimeout(() => setShowDeleteConfirm(false), 3000)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Post preview */}
          <div className="flex items-start gap-3 mb-3">
            {previewImage && (
              <img
                src={previewImage}
                alt="Post thumbnail"
                className="w-16 h-16 object-cover rounded flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900 line-clamp-2 mb-2">{previewContent}</p>

              {/* Platform badges */}
              <div className="flex flex-wrap gap-1 mb-2">
                {post.platforms.map((platform) => (
                  <Badge key={platform} variant="default" className="text-xs">
                    {PLATFORM_ICONS[platform]} {PLATFORM_LABELS[platform]}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Status and schedule info */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={STATUS_VARIANTS[post.status]}>
                {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
              </Badge>

              {post.recurring && post.recurring.frequency !== 'none' && (
                <Badge variant="info" className="text-xs">
                  🔄 {post.recurring.frequency.charAt(0).toUpperCase() + post.recurring.frequency.slice(1)}
                </Badge>
              )}
            </div>

            <p className="text-xs text-gray-500">
              {post.status === 'published' && post.published_at ? (
                <>Published: {formatDateInTimezone(new Date(post.published_at), post.timezone || 'America/New_York')}</>
              ) : (
                <>Scheduled: {scheduledTime}</>
              )}
            </p>

            {errorMessage && (
              <p className="text-xs text-red-600 mt-1">
                ⚠️ {errorMessage}
              </p>
            )}
          </div>
        </div>

        {/* Actions dropdown */}
        <DropdownMenu
          trigger={
            <button className="text-gray-400 hover:text-gray-600 p-1">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
              </svg>
            </button>
          }
        >
          <DropdownMenuItem
            onClick={() => onEdit(post.id)}
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            }
          >
            Edit
          </DropdownMenuItem>

          {post.status !== 'published' && (
            <DropdownMenuItem
              onClick={() => onReschedule(post.id)}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
            >
              Reschedule
            </DropdownMenuItem>
          )}

          {post.status === 'published' && (
            <DropdownMenuItem
              onClick={() => onViewResults(post.id)}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              }
            >
              View Results
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={handleDelete}
            className="text-red-600 hover:bg-red-50"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            }
          >
            {showDeleteConfirm ? 'Click again to confirm' : 'Delete'}
          </DropdownMenuItem>
        </DropdownMenu>
      </div>
    </div>
  )
}
