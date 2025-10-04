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
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-gray-600">Loading post...</p>
        </div>
      </div>
    )
  }

  if (error && !post) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Alert variant="error">
          <p>{error}</p>
        </Alert>
        <Button className="mt-4" onClick={() => router.push('/dashboard/posts/scheduled')}>
          Back to Posts
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/posts/scheduled')}
            className="mb-2"
          >
            ← Back to Posts
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Edit Post</h1>
        </div>
        <Button
          variant="outline"
          onClick={handleDelete}
          className={showDeleteConfirm ? 'bg-red-50 border-red-600 text-red-600' : ''}
        >
          {showDeleteConfirm ? 'Click again to confirm delete' : 'Delete Post'}
        </Button>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="error" className="mb-6">
          <p>{error}</p>
        </Alert>
      )}

      {successMessage && (
        <Alert variant="success" className="mb-6">
          <p>{successMessage}</p>
        </Alert>
      )}

      {/* Platform Selection */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Select Platforms</h2>
        <div className="flex flex-wrap gap-3">
          {platforms.map((platform) => (
            <label
              key={platform}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50"
            >
              <Checkbox
                checked={selectedPlatforms.includes(platform)}
                onChange={() => handlePlatformToggle(platform)}
              />
              <span className="text-sm font-medium text-gray-900 capitalize">
                {platform}
              </span>
            </label>
          ))}
        </div>
        {selectedPlatforms.length === 0 && (
          <p className="text-sm text-red-600 mt-2">Please select at least one platform</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column - Editor and Schedule */}
        <div className="space-y-6">
          {/* Post Editor */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Post Content</h2>
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
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <SchedulePicker onSchedule={handleSchedule} onPostNow={handlePostNow} />
          </div>
        </div>

        {/* Right column - Preview */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Preview</h2>
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
  )
}
