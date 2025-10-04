'use client'

import * as React from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PostEditor, PostContent } from '@/components/posts/post-editor'
import { PlatformPreview } from '@/components/posts/platform-preview'
import { SchedulePicker } from '@/components/posts/schedule-picker'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Alert } from '@/components/ui/alert'
import type { ScheduledPost, Platform, RecurringOptions } from '@/lib/types/posts'

export default function EditPostPage() {
  const router = useRouter()
  const params = useParams()
  const postId = params.id as string

  const [post, setPost] = React.useState<ScheduledPost | null>(null)
  const [content, setContent] = React.useState<PostContent>({
    linkedin: '',
    instagram: '',
    twitter: '',
    discord: ''
  })
  const [images, setImages] = React.useState<Record<string, string>>({})
  const [selectedPlatforms, setSelectedPlatforms] = React.useState<Platform[]>([])
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false)

  const supabase = createClient()

  // Fetch post data
  React.useEffect(() => {
    const fetchPost = async () => {
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
          .eq('id', postId)
          .eq('user_id', user.id)
          .single()

        if (fetchError) throw fetchError
        if (!data) throw new Error('Post not found')

        setPost(data)
        setContent(data.content)
        setSelectedPlatforms(data.platforms)

        // Load images
        if (data.images && data.images.length > 0) {
          const imageMap: Record<string, string> = {}
          data.images.forEach((img: { platform: string; url: string }) => {
            imageMap[img.platform] = img.url
          })
          setImages(imageMap)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch post')
      } finally {
        setLoading(false)
      }
    }

    fetchPost()
  }, [postId, router, supabase])

  // Handlers
  const handleContentChange = (newContent: PostContent) => {
    setContent(newContent)
  }

  const handlePlatformToggle = (platform: Platform) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    )
  }

  const handleImageUpload = async (platform: string, file: File) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${postId}/${platform}-${Date.now()}.${fileExt}`

      const { error: uploadError, data } = await supabase.storage
        .from('post-images')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('post-images')
        .getPublicUrl(fileName)

      setImages((prev) => ({ ...prev, [platform]: publicUrl }))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to upload image')
    }
  }

  const handleImageRemove = (platform: string) => {
    setImages((prev) => {
      const updated = { ...prev }
      delete updated[platform]
      return updated
    })
  }

  const handleSave = async (newContent: PostContent) => {
    if (selectedPlatforms.length === 0) {
      setError('Please select at least one platform')
      return
    }

    setSaving(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const imageArray = Object.entries(images).map(([platform, url]) => ({
        platform,
        url
      }))

      const { error: updateError } = await supabase
        .from('scheduled_posts')
        .update({
          content: newContent,
          images: imageArray,
          platforms: selectedPlatforms,
          updated_at: new Date().toISOString()
        })
        .eq('id', postId)

      if (updateError) throw updateError

      setSuccessMessage('Post updated successfully!')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update post')
    } finally {
      setSaving(false)
    }
  }

  const handleSchedule = async (
    date: Date,
    timezone: string,
    recurring?: RecurringOptions
  ) => {
    if (selectedPlatforms.length === 0) {
      setError('Please select at least one platform')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const imageArray = Object.entries(images).map(([platform, url]) => ({
        platform,
        url
      }))

      const { error: updateError } = await supabase
        .from('scheduled_posts')
        .update({
          content,
          images: imageArray,
          platforms: selectedPlatforms,
          scheduled_for: date.toISOString(),
          timezone,
          recurring,
          status: 'scheduled',
          updated_at: new Date().toISOString()
        })
        .eq('id', postId)

      if (updateError) throw updateError

      router.push('/dashboard/posts/scheduled')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to schedule post')
    } finally {
      setSaving(false)
    }
  }

  const handlePostNow = async () => {
    if (selectedPlatforms.length === 0) {
      setError('Please select at least one platform')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const imageArray = Object.entries(images).map(([platform, url]) => ({
        platform,
        url
      }))

      // Update post content and set to publishing
      const { error: updateError } = await supabase
        .from('scheduled_posts')
        .update({
          content,
          images: imageArray,
          platforms: selectedPlatforms,
          status: 'publishing',
          updated_at: new Date().toISOString()
        })
        .eq('id', postId)

      if (updateError) throw updateError

      // Trigger immediate publish
      const response = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId })
      })

      if (!response.ok) {
        throw new Error('Failed to publish post')
      }

      router.push('/dashboard/posts/scheduled')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish post')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true)
      setTimeout(() => setShowDeleteConfirm(false), 3000)
      return
    }

    try {
      const { error: deleteError } = await supabase
        .from('scheduled_posts')
        .delete()
        .eq('id', postId)

      if (deleteError) throw deleteError

      router.push('/dashboard/posts/scheduled')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete post')
    }
  }

  const platforms: Platform[] = ['linkedin', 'instagram', 'twitter', 'discord']

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#201033] via-[#15092b] to-[#0a0513] p-4 sm:p-6 lg:p-8">
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-fuchsia-500 border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-slate-400">Loading post...</p>
        </div>
      </div>
    )
  }

  if (error && !post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#201033] via-[#15092b] to-[#0a0513] p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 backdrop-blur-sm mb-4">
            <p className="text-red-300">{error}</p>
          </div>
          <button
            onClick={() => router.push('/dashboard/posts/scheduled')}
            className="bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-fuchsia-600 hover:to-purple-700 transition-all shadow-lg"
          >
            Back to Posts
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#201033] via-[#15092b] to-[#0a0513] p-4 sm:p-6 lg:p-8">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] bg-fuchsia-500/10 rounded-full blur-3xl animate-[float_20s_ease-in-out_infinite]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] bg-purple-500/10 rounded-full blur-3xl animate-[float_25s_ease-in-out_infinite_reverse]"></div>
      </div>

      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div>
            <button
              onClick={() => router.push('/dashboard/posts/scheduled')}
              className="mb-2 bg-white/5 border border-white/10 text-slate-300 px-4 py-2 rounded-lg font-medium hover:bg-white/10 transition-all"
            >
              ← Back to Posts
            </button>
            <h1 className="text-3xl sm:text-4xl font-bold text-white">Edit Post</h1>
          </div>
          <button
            onClick={handleDelete}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              showDeleteConfirm
                ? 'bg-red-500/20 border border-red-500/50 text-red-300'
                : 'bg-red-500/10 border border-red-500/20 text-red-300 hover:bg-red-500/20'
            }`}
          >
            {showDeleteConfirm ? 'Click again to confirm delete' : 'Delete Post'}
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 backdrop-blur-sm">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 bg-green-500/10 border border-green-500/20 rounded-xl p-4 backdrop-blur-sm">
            <p className="text-green-300">{successMessage}</p>
          </div>
        )}

        {/* Platform Selection */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 sm:p-6 mb-6 hover:border-white/20 transition-all">
          <h2 className="text-lg font-semibold text-white mb-3">Select Platforms</h2>
        <div className="flex flex-wrap gap-3">
          {platforms.map((platform) => (
            <label
              key={platform}
              className="flex items-center gap-2 px-4 py-2 border border-white/10 rounded-lg cursor-pointer hover:bg-white/5 transition-all bg-white/5"
            >
              <Checkbox
                checked={selectedPlatforms.includes(platform)}
                onChange={() => handlePlatformToggle(platform)}
              />
              <span className="text-sm font-medium text-white capitalize">
                {platform}
              </span>
            </label>
          ))}
        </div>
        {selectedPlatforms.length === 0 && (
          <p className="text-sm text-red-400 mt-2">Please select at least one platform</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Left column - Editor and Schedule */}
        <div className="space-y-4 sm:space-y-6">
          {/* Post Editor */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 sm:p-6 hover:border-white/20 transition-all">
            <h2 className="text-lg font-semibold text-white mb-4">Post Content</h2>
            <PostEditor
              initialContent={content}
              onChange={handleContentChange}
              onSave={handleSave}
              images={images}
              onImageUpload={handleImageUpload}
              onImageRemove={handleImageRemove}
            />
          </div>

          {/* Schedule Picker */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 sm:p-6 hover:border-white/20 transition-all">
            <SchedulePicker onSchedule={handleSchedule} onPostNow={handlePostNow} />
          </div>
        </div>

        {/* Right column - Preview */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 sm:p-6 hover:border-white/20 transition-all">
          <h2 className="text-lg font-semibold text-white mb-4">Preview</h2>
          <Tabs defaultValue={selectedPlatforms[0] || 'linkedin'}>
            <TabsList className="w-full justify-start overflow-x-auto mb-4">
              {platforms.map((platform) => (
                <TabsTrigger
                  key={platform}
                  value={platform}
                  disabled={!selectedPlatforms.includes(platform)}
                  className="capitalize"
                >
                  {platform}
                </TabsTrigger>
              ))}
            </TabsList>

            {platforms.map((platform) => (
              <TabsContent key={platform} value={platform}>
                <div className="overflow-auto">
                  <PlatformPreview
                    platform={platform}
                    content={content[platform]}
                    imageUrl={images[platform]}
                  />
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
      </div>
    </div>
  )
}
