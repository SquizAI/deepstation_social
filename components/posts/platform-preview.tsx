'use client'

import * as React from 'react'

interface PlatformPreviewProps {
  platform: 'linkedin' | 'instagram' | 'twitter' | 'discord'
  content: string
  imageUrl?: string
}

export function PlatformPreview({ platform, content, imageUrl }: PlatformPreviewProps) {
  const previews = {
    linkedin: (
      <div className="border rounded-lg p-4 bg-white shadow-sm max-w-xl mx-auto">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
            DS
          </div>
          <div>
            <p className="font-semibold text-gray-900">DeepStation</p>
            <p className="text-sm text-gray-500">3,000+ followers</p>
          </div>
        </div>
        <p className="whitespace-pre-wrap text-gray-800 mb-3">{content || 'Start typing to see preview...'}</p>
        {imageUrl && (
          <img
            src={imageUrl}
            alt="Post attachment"
            className="rounded w-full object-cover max-h-96"
          />
        )}
        <div className="flex items-center gap-4 mt-4 pt-3 border-t text-gray-600 text-sm">
          <button className="flex items-center gap-1 hover:text-blue-600">
            <span>👍</span> Like
          </button>
          <button className="flex items-center gap-1 hover:text-blue-600">
            <span>💬</span> Comment
          </button>
          <button className="flex items-center gap-1 hover:text-blue-600">
            <span>🔄</span> Share
          </button>
        </div>
      </div>
    ),
    instagram: (
      <div className="border rounded-lg overflow-hidden max-w-md mx-auto bg-white shadow-sm">
        <div className="flex items-center gap-2 p-3 border-b">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
            DS
          </div>
          <span className="font-semibold text-sm">deepstation</span>
        </div>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="Post"
            className="w-full aspect-square object-cover"
          />
        ) : (
          <div className="w-full aspect-square bg-gray-100 flex items-center justify-center text-gray-400">
            No image
          </div>
        )}
        <div className="p-3">
          <div className="flex items-center gap-4 mb-2">
            <span className="text-2xl">❤️</span>
            <span className="text-2xl">💬</span>
            <span className="text-2xl">📤</span>
          </div>
          <p className="whitespace-pre-wrap text-sm text-gray-800">
            <span className="font-semibold">deepstation</span> {content || 'Start typing to see preview...'}
          </p>
        </div>
      </div>
    ),
    twitter: (
      <div className="border rounded-lg p-4 bg-white max-w-xl mx-auto shadow-sm">
        <div className="flex gap-3">
          <div className="w-10 h-10 bg-blue-400 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold">
            DS
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-gray-900">DeepStation</span>
              <span className="text-gray-500">@deepstation</span>
              <span className="text-gray-500">· now</span>
            </div>
            <p className="whitespace-pre-wrap mb-2 text-gray-900">
              {content || 'Start typing to see preview...'}
            </p>
            {imageUrl && (
              <img
                src={imageUrl}
                alt="Post"
                className="rounded-xl w-full object-cover max-h-96 border"
              />
            )}
            <div className="flex items-center justify-between mt-3 text-gray-500 max-w-md">
              <button className="flex items-center gap-2 hover:text-blue-500">
                <span>💬</span> <span className="text-sm">Reply</span>
              </button>
              <button className="flex items-center gap-2 hover:text-green-500">
                <span>🔄</span> <span className="text-sm">Repost</span>
              </button>
              <button className="flex items-center gap-2 hover:text-red-500">
                <span>❤️</span> <span className="text-sm">Like</span>
              </button>
              <button className="flex items-center gap-2 hover:text-blue-500">
                <span>📊</span> <span className="text-sm">View</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    ),
    discord: (
      <div className="bg-gray-800 text-white p-4 rounded max-w-2xl mx-auto">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex-shrink-0 flex items-center justify-center font-bold">
            DS
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-white">DeepStation Bot</span>
              <span className="text-xs bg-blue-600 px-1.5 py-0.5 rounded text-white">BOT</span>
              <span className="text-xs text-gray-400">Today at 12:00 PM</span>
            </div>
            <div className="text-gray-100 whitespace-pre-wrap">
              {content || 'Start typing to see preview...'}
            </div>
            {imageUrl && (
              <img
                src={imageUrl}
                alt="Post"
                className="mt-2 rounded max-w-sm max-h-96 object-cover"
              />
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-gray-50 rounded-lg">
      <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
        {platform.charAt(0).toUpperCase() + platform.slice(1)} Preview
      </h3>
      {previews[platform]}
    </div>
  )
}
