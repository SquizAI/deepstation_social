'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import type { ScheduledPost, Platform } from '@/lib/types/posts'

interface PostResultsModalProps {
  post: ScheduledPost | null
  open: boolean
  onClose: () => void
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

interface PlatformResult {
  platform: Platform
  success: boolean
  error?: string
  postUrl?: string
  metrics?: {
    likes?: number
    shares?: number
    comments?: number
    reach?: number
  }
}

export function PostResultsModal({ post, open, onClose }: PostResultsModalProps) {
  const results = React.useMemo(() => {
    if (!post || !post.publish_results) return []

    return Object.entries(post.publish_results).map(([platform, result]) => ({
      platform: platform as Platform,
      ...result
    })) as PlatformResult[]
  }, [post])

  if (!post) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Post Results</DialogTitle>
          <DialogDescription>
            Publication status and metrics for each platform
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {results.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No results available yet</p>
            </div>
          ) : (
            results.map((result) => (
              <div
                key={result.platform}
                className="border border-gray-200 rounded-lg p-4 space-y-3"
              >
                {/* Platform header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{PLATFORM_ICONS[result.platform]}</span>
                    <span className="font-semibold text-gray-900">
                      {PLATFORM_LABELS[result.platform]}
                    </span>
                  </div>
                  <Badge variant={result.success ? 'success' : 'error'}>
                    {result.success ? 'Published' : 'Failed'}
                  </Badge>
                </div>

                {/* Success - show link and metrics */}
                {result.success && (
                  <div className="space-y-2">
                    {result.postUrl && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Post URL:</p>
                        <a
                          href={result.postUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline break-all"
                        >
                          {result.postUrl}
                        </a>
                      </div>
                    )}

                    {result.metrics && Object.keys(result.metrics).length > 0 && (
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Metrics:</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {result.metrics.likes !== undefined && (
                            <div className="bg-gray-50 rounded p-2">
                              <p className="text-xs text-gray-500">Likes</p>
                              <p className="text-lg font-semibold text-gray-900">
                                {result.metrics.likes}
                              </p>
                            </div>
                          )}
                          {result.metrics.shares !== undefined && (
                            <div className="bg-gray-50 rounded p-2">
                              <p className="text-xs text-gray-500">Shares</p>
                              <p className="text-lg font-semibold text-gray-900">
                                {result.metrics.shares}
                              </p>
                            </div>
                          )}
                          {result.metrics.comments !== undefined && (
                            <div className="bg-gray-50 rounded p-2">
                              <p className="text-xs text-gray-500">Comments</p>
                              <p className="text-lg font-semibold text-gray-900">
                                {result.metrics.comments}
                              </p>
                            </div>
                          )}
                          {result.metrics.reach !== undefined && (
                            <div className="bg-gray-50 rounded p-2">
                              <p className="text-xs text-gray-500">Reach</p>
                              <p className="text-lg font-semibold text-gray-900">
                                {result.metrics.reach}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {!result.postUrl && !result.metrics && (
                      <p className="text-sm text-gray-500 italic">
                        Post published successfully. Metrics not yet available.
                      </p>
                    )}
                  </div>
                )}

                {/* Error - show error message */}
                {!result.success && result.error && (
                  <div className="bg-red-50 border border-red-200 rounded p-3">
                    <p className="text-sm font-medium text-red-900 mb-1">Error:</p>
                    <p className="text-sm text-red-700">{result.error}</p>
                  </div>
                )}
              </div>
            ))
          )}

          {/* Post metadata */}
          {post.published_at && (
            <div className="border-t pt-4 mt-4">
              <p className="text-sm text-gray-600">
                Published on:{' '}
                <span className="font-medium text-gray-900">
                  {new Date(post.published_at).toLocaleString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit'
                  })}
                </span>
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
