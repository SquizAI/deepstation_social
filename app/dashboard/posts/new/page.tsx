'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PostEditor, PostContent } from '@/components/posts/post-editor'
import { PlatformPreview } from '@/components/posts/platform-preview'
import { SchedulePicker } from '@/components/posts/schedule-picker'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Card } from '@/components/ui/card'

type Platform = 'linkedin' | 'instagram' | 'twitter' | 'discord'

interface ConnectedPlatform {
  platform: Platform
  isConnected: boolean
}

export default function NewPostPage() {
  const router = useRouter()
  const supabase = createClient()

  const [selectedPlatforms, setSelectedPlatforms] = React.useState<Platform[]>([])
  const [connectedPlatforms, setConnectedPlatforms] = React.useState<ConnectedPlatform[]>([
    { platform: 'linkedin', isConnected: false },
    { platform: 'instagram', isConnected: false },
    { platform: 'twitter', isConnected: false },
    { platform: 'discord', isConnected: false }
  ])
  const [postContent, setPostContent] = React.useState<PostContent>({
    linkedin: '',
    instagram: '',
    twitter: '',
    discord: ''
  })
  const [images, setImages] = React.useState<Record<string, string>>({})
  const [activePreview, setActivePreview] = React.useState<Platform>('linkedin')
  const [isSaving, setIsSaving] = React.useState(false)
  const [alert, setAlert] = React.useState<{
    variant: 'success' | 'error' | 'warning'
    title: string
    message: string
  } | null>(null)
  const [userId, setUserId] = React.useState<string | null>(null)

  // Fetch user and connected platforms
  React.useEffect(() => {
    async function fetchUserAndPlatforms() {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      setUserId(user.id)

      // Fetch connected platforms
      const { data: accounts } = await supabase
        .from('oauth_accounts')
        .select('platform')
        .eq('user_id', user.id)

      if (accounts) {
        const connected = accounts.map(acc => acc.platform)
        setConnectedPlatforms(prev =>
          prev.map(p => ({
            ...p,
            isConnected: connected.includes(p.platform)
          }))
        )

        // Auto-select connected platforms
        setSelectedPlatforms(connected as Platform[])
      }
    }

    fetchUserAndPlatforms()
  }, [])

  const togglePlatform = (platform: Platform) => {
    setSelectedPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    )
  }

  const handleImageUpload = async (platform: string, file: File) => {
    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}/${Date.now()}.${fileExt}`
      const { data, error } = await supabase.storage
        .from('post-images')
        .upload(fileName, file)

      if (error) throw error

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('post-images')
        .getPublicUrl(fileName)

      setImages(prev => ({ ...prev, [platform]: publicUrl }))
    } catch (error) {
      console.error('Error uploading image:', error)
      setAlert({
        variant: 'error',
        title: 'Upload Failed',
        message: 'Failed to upload image. Please try again.'
      })
    }
  }

  const handleImageRemove = (platform: string) => {
    setImages(prev => {
      const newImages = { ...prev }
      delete newImages[platform]
      return newImages
    })
  }

  const validatePost = (): boolean => {
    if (selectedPlatforms.length === 0) {
      setAlert({
        variant: 'warning',
        title: 'No Platforms Selected',
        message: 'Please select at least one platform to publish to.'
      })
      return false
    }

    // Check if any selected platform has content
    const hasContent = selectedPlatforms.some(platform => postContent[platform].trim() !== '')
    if (!hasContent) {
      setAlert({
        variant: 'warning',
        title: 'No Content',
        message: 'Please add content for at least one selected platform.'
      })
      return false
    }

    // Check character limits
    const LIMITS = { linkedin: 3000, instagram: 2200, twitter: 280, discord: 4000 }
    for (const platform of selectedPlatforms) {
      if (postContent[platform].length > LIMITS[platform]) {
        setAlert({
          variant: 'error',
          title: 'Content Too Long',
          message: `Your ${platform} post exceeds the ${LIMITS[platform]} character limit.`
        })
        return false
      }
    }

    return true
  }

  const handleSaveDraft = async (content: PostContent) => {
    if (!userId) return

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('scheduled_posts')
        .insert({
          user_id: userId,
          content,
          images: Object.entries(images).map(([platform, url]) => ({
            platform,
            url
          })),
          platforms: selectedPlatforms,
          status: 'draft'
        })

      if (error) throw error

      setAlert({
        variant: 'success',
        title: 'Draft Saved',
        message: 'Your post has been saved as a draft.'
      })
    } catch (error) {
      console.error('Error saving draft:', error)
      setAlert({
        variant: 'error',
        title: 'Save Failed',
        message: 'Failed to save draft. Please try again.'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSchedule = async (date: Date, timezone: string, recurring?: any) => {
    if (!validatePost() || !userId) return

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('scheduled_posts')
        .insert({
          user_id: userId,
          content: postContent,
          images: Object.entries(images).map(([platform, url]) => ({
            platform,
            url
          })),
          platforms: selectedPlatforms,
          scheduled_for: date.toISOString(),
          timezone,
          recurring,
          status: 'scheduled'
        })

      if (error) throw error

      setAlert({
        variant: 'success',
        title: 'Post Scheduled',
        message: `Your post has been scheduled for ${date.toLocaleString()}`
      })

      setTimeout(() => {
        router.push('/dashboard/schedule')
      }, 2000)
    } catch (error) {
      console.error('Error scheduling post:', error)
      setAlert({
        variant: 'error',
        title: 'Schedule Failed',
        message: 'Failed to schedule post. Please try again.'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handlePostNow = async () => {
    if (!validatePost() || !userId) return

    setIsSaving(true)
    try {
      // Save to database with immediate publish status
      const { data, error } = await supabase
        .from('scheduled_posts')
        .insert({
          user_id: userId,
          content: postContent,
          images: Object.entries(images).map(([platform, url]) => ({
            platform,
            url
          })),
          platforms: selectedPlatforms,
          scheduled_for: new Date().toISOString(),
          status: 'publishing'
        })
        .select()
        .single()

      if (error) throw error

      // Call publish API
      const response = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: data.id,
          platforms: selectedPlatforms
        })
      })

      if (!response.ok) throw new Error('Publishing failed')

      setAlert({
        variant: 'success',
        title: 'Publishing',
        message: 'Your post is being published to selected platforms.'
      })

      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch (error) {
      console.error('Error publishing post:', error)
      setAlert({
        variant: 'error',
        title: 'Publish Failed',
        message: 'Failed to publish post. Please try again.'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const platformConfig = [
    { key: 'linkedin' as Platform, label: 'LinkedIn', icon: '💼', color: 'text-blue-600' },
    { key: 'instagram' as Platform, label: 'Instagram', icon: '📷', color: 'text-pink-600' },
    { key: 'twitter' as Platform, label: 'X (Twitter)', icon: '🐦', color: 'text-blue-400' },
    { key: 'discord' as Platform, label: 'Discord', icon: '💬', color: 'text-indigo-600' }
  ]

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Create New Post</h1>
        <p className="text-gray-600 mt-2">
          Compose and schedule your social media posts across multiple platforms
        </p>
      </div>

      {alert && (
        <Alert variant={alert.variant} className="mb-6">
          <AlertTitle>{alert.title}</AlertTitle>
          <AlertDescription>{alert.message}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Platform Selection */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Select Platforms
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {platformConfig.map(({ key, label, icon, color }) => {
                const platformData = connectedPlatforms.find(p => p.platform === key)
                const isConnected = platformData?.isConnected ?? false

                return (
                  <div
                    key={key}
                    className={`relative border rounded-lg p-4 transition-all ${
                      selectedPlatforms.includes(key)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 bg-white'
                    } ${!isConnected ? 'opacity-50' : 'cursor-pointer hover:border-blue-400'}`}
                    onClick={() => isConnected && togglePlatform(key)}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedPlatforms.includes(key)}
                        disabled={!isConnected}
                        onChange={() => {}}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{icon}</span>
                          <span className={`font-medium ${color}`}>{label}</span>
                        </div>
                        {!isConnected && (
                          <p className="text-xs text-red-600 mt-1">Not connected</p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            {connectedPlatforms.filter(p => !p.isConnected).length > 0 && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  Some platforms are not connected.{' '}
                  <a href="/dashboard/accounts" className="underline font-medium">
                    Connect platforms
                  </a>
                </p>
              </div>
            )}
          </Card>

          {/* Post Editor */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Post Content
            </h2>
            <PostEditor
              onSave={handleSaveDraft}
              initialContent={postContent}
              onChange={setPostContent}
              images={images}
              onImageUpload={handleImageUpload}
              onImageRemove={handleImageRemove}
            />
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Preview */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Preview</h2>
            <div className="space-y-2 mb-4">
              <label className="text-sm font-medium text-gray-700">Platform</label>
              <select
                value={activePreview}
                onChange={(e) => setActivePreview(e.target.value as Platform)}
                className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                {platformConfig.map(({ key, label, icon }) => (
                  <option key={key} value={key}>
                    {icon} {label}
                  </option>
                ))}
              </select>
            </div>
            <PlatformPreview
              platform={activePreview}
              content={postContent[activePreview]}
              imageUrl={images[activePreview]}
            />
          </Card>

          {/* Schedule Picker */}
          <Card className="p-6">
            <SchedulePicker
              onSchedule={handleSchedule}
              onPostNow={handlePostNow}
            />
          </Card>

          {/* Action Buttons */}
          <Card className="p-6">
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleSaveDraft(postContent)}
                disabled={isSaving}
              >
                Save as Draft
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => router.push('/dashboard')}
              >
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
