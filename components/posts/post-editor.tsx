'use client'

import * as React from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { createClient } from '@/lib/supabase/client'

export interface PostContent {
  linkedin: string
  instagram: string
  twitter: string
  discord: string
}

interface PostEditorProps {
  onSave: (content: PostContent) => void
  initialContent?: Partial<PostContent>
  onChange?: (content: PostContent) => void
  images?: Record<string, string>
  onImageUpload?: (platform: string, file: File) => void
  onImageRemove?: (platform: string) => void
}

const PLATFORM_LIMITS = {
  linkedin: 3000,
  instagram: 2200,
  twitter: 280,
  discord: 4000
} as const

const PLATFORM_COLORS = {
  linkedin: 'bg-blue-600',
  instagram: 'bg-gradient-to-r from-purple-600 to-pink-600',
  twitter: 'bg-blue-400',
  discord: 'bg-indigo-600'
} as const

export function PostEditor({
  onSave,
  initialContent = {},
  onChange,
  images = {},
  onImageUpload,
  onImageRemove
}: PostEditorProps) {
  const [content, setContent] = React.useState<PostContent>({
    linkedin: initialContent.linkedin || '',
    instagram: initialContent.instagram || '',
    twitter: initialContent.twitter || '',
    discord: initialContent.discord || ''
  })

  const [activeTab, setActiveTab] = React.useState<keyof PostContent>('linkedin')
  const [isSaving, setIsSaving] = React.useState(false)
  const fileInputRefs = React.useRef<Record<string, HTMLInputElement | null>>({})

  const platforms = [
    { key: 'linkedin' as const, label: 'LinkedIn', icon: '💼' },
    { key: 'instagram' as const, label: 'Instagram', icon: '📷' },
    { key: 'twitter' as const, label: 'X (Twitter)', icon: '🐦' },
    { key: 'discord' as const, label: 'Discord', icon: '💬' }
  ]

  const handleContentChange = (platform: keyof PostContent, value: string) => {
    const newContent = { ...content, [platform]: value }
    setContent(newContent)
    onChange?.(newContent)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(content)
    } finally {
      setIsSaving(false)
    }
  }

  const handleImageUpload = async (platform: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && onImageUpload) {
      onImageUpload(platform, file)
    }
  }

  const getCharacterCount = (platform: keyof PostContent) => {
    const current = content[platform].length
    const max = PLATFORM_LIMITS[platform]
    const percentage = (current / max) * 100
    const isOverLimit = current > max

    return {
      current,
      max,
      percentage,
      isOverLimit,
      color: isOverLimit ? 'text-red-600' : percentage > 90 ? 'text-yellow-600' : 'text-gray-500'
    }
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="linkedin" onValueChange={(value) => setActiveTab(value as keyof PostContent)}>
        <TabsList className="w-full justify-start overflow-x-auto">
          {platforms.map(({ key, label, icon }) => (
            <TabsTrigger key={key} value={key} className="flex items-center gap-2">
              <span>{icon}</span>
              <span>{label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {platforms.map(({ key, label }) => {
          const charInfo = getCharacterCount(key)

          return (
            <TabsContent key={key} value={key} className="mt-4 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-gray-900">
                    {label} Post Content
                  </label>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${charInfo.color}`}>
                      {charInfo.current} / {charInfo.max}
                    </span>
                    {charInfo.isOverLimit && (
                      <span className="text-xs text-red-600 font-medium">
                        Over limit by {charInfo.current - charInfo.max}
                      </span>
                    )}
                  </div>
                </div>

                <div className="relative">
                  <Textarea
                    value={content[key]}
                    onChange={(e) => handleContentChange(key, e.target.value)}
                    rows={8}
                    placeholder={`Enter your ${label} post content here...`}
                    className={charInfo.isOverLimit ? 'border-red-500 focus:ring-red-500' : ''}
                  />

                  {/* Character indicator bar */}
                  <div className="mt-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        charInfo.isOverLimit
                          ? 'bg-red-600'
                          : charInfo.percentage > 90
                          ? 'bg-yellow-600'
                          : 'bg-blue-600'
                      }`}
                      style={{ width: `${Math.min(charInfo.percentage, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Image Upload Section */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900">Image (optional)</label>

                  {images[key] ? (
                    <div className="relative inline-block">
                      <img
                        src={images[key]}
                        alt={`${label} preview`}
                        className="max-w-xs max-h-48 rounded-lg border border-gray-300"
                      />
                      <button
                        onClick={() => onImageRemove?.(key)}
                        className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 transition-colors"
                        type="button"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(key, e)}
                        ref={(el) => { fileInputRefs.current[key] = el }}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRefs.current[key]?.click()}
                      >
                        Upload Image
                      </Button>
                    </div>
                  )}
                </div>

                {/* Platform-specific tips */}
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <p className="text-sm text-blue-900 font-medium mb-1">Tips for {label}:</p>
                  <ul className="text-xs text-blue-800 space-y-1">
                    {key === 'linkedin' && (
                      <>
                        <li>• Use professional tone and focus on business value</li>
                        <li>• Include relevant hashtags (3-5 recommended)</li>
                        <li>• Tag company pages for better reach</li>
                      </>
                    )}
                    {key === 'instagram' && (
                      <>
                        <li>• Use emojis for visual appeal and scannability</li>
                        <li>• Include 20-30 relevant hashtags</li>
                        <li>• Lead with compelling hook in first line</li>
                      </>
                    )}
                    {key === 'twitter' && (
                      <>
                        <li>• Keep it concise and punchy</li>
                        <li>• Use threads for longer content</li>
                        <li>• Tag relevant accounts and use trending hashtags</li>
                      </>
                    )}
                    {key === 'discord' && (
                      <>
                        <li>• Use markdown formatting for better readability</li>
                        <li>• Include @everyone or @here for announcements</li>
                        <li>• Add direct links and call-to-action</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </TabsContent>
          )
        })}
      </Tabs>

      <div className="flex justify-end pt-4 border-t">
        <Button onClick={handleSave} disabled={isSaving} size="lg">
          {isSaving ? 'Saving...' : 'Save Post'}
        </Button>
      </div>
    </div>
  )
}
