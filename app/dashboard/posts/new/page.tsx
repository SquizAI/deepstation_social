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
import { WorkflowGenerator } from '@/components/ai/workflow-generator'

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
  const [isAIWorkflowOpen, setIsAIWorkflowOpen] = React.useState(false)

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

  const handleAIContentGenerated = (generatedContent: any) => {
    if (generatedContent.type === 'text') {
      // Add generated text to current platform or all selected platforms
      const updatedContent = { ...postContent }
      selectedPlatforms.forEach(platform => {
        if (!updatedContent[platform]) {
          updatedContent[platform] = generatedContent.content
        }
      })
      setPostContent(updatedContent)

      setAlert({
        variant: 'success',
        title: 'AI Content Added',
        message: 'Generated text has been added to your post.'
      })
    } else if (generatedContent.type === 'image' && generatedContent.imageUrl) {
      // Add generated image to all selected platforms
      const updatedImages = { ...images }
      selectedPlatforms.forEach(platform => {
        updatedImages[platform] = generatedContent.imageUrl!
      })
      setImages(updatedImages)

      setAlert({
        variant: 'success',
        title: 'AI Image Added',
        message: 'Generated image has been added to your post.'
      })
    } else if (generatedContent.type === 'video' && generatedContent.videoUrl) {
      // Video would typically be handled similarly to images
      setAlert({
        variant: 'success',
        title: 'AI Video Generated',
        message: 'Generated video is ready to use. (Video upload not yet implemented)'
      })
    }
  }

  const platformConfig = [
    { key: 'linkedin' as Platform, label: 'LinkedIn', icon: '💼', color: 'text-blue-600' },
    { key: 'instagram' as Platform, label: 'Instagram', icon: '📷', color: 'text-pink-600' },
    { key: 'twitter' as Platform, label: 'X (Twitter)', icon: '🐦', color: 'text-blue-400' },
    { key: 'discord' as Platform, label: 'Discord', icon: '💬', color: 'text-indigo-600' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#201033] via-[#15092b] to-[#0a0513] p-4 sm:p-6 lg:p-8">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] bg-fuchsia-500/10 rounded-full blur-3xl animate-[float_20s_ease-in-out_infinite]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] bg-purple-500/10 rounded-full blur-3xl animate-[float_25s_ease-in-out_infinite_reverse]"></div>
      </div>

      <div className="relative max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Create New Post</h1>
          <p className="text-slate-400 text-sm sm:text-base">
            Compose and schedule your social media posts across multiple platforms
          </p>
        </div>

      {alert && (
        <div className={`mb-6 backdrop-blur-sm border rounded-xl p-4 ${
          alert.variant === 'success' ? 'bg-green-500/10 border-green-500/20' :
          alert.variant === 'error' ? 'bg-red-500/10 border-red-500/20' :
          'bg-yellow-500/10 border-yellow-500/20'
        }`}>
          <h3 className={`font-medium ${
            alert.variant === 'success' ? 'text-green-300' :
            alert.variant === 'error' ? 'text-red-300' :
            'text-yellow-300'
          }`}>{alert.title}</h3>
          <p className={`text-sm mt-1 ${
            alert.variant === 'success' ? 'text-green-400/80' :
            alert.variant === 'error' ? 'text-red-400/80' :
            'text-yellow-400/80'
          }`}>{alert.message}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Platform Selection */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 sm:p-6 hover:border-white/20 transition-all">
            <h2 className="text-lg font-semibold text-white mb-4">
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
                        ? 'border-fuchsia-500 bg-fuchsia-500/10'
                        : 'border-white/10 bg-white/5'
                    } ${!isConnected ? 'opacity-50' : 'cursor-pointer hover:border-white/20'}`}
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
                          <span className="font-medium text-white">{label}</span>
                        </div>
                        {!isConnected && (
                          <p className="text-xs text-red-400 mt-1">Not connected</p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            {connectedPlatforms.filter(p => !p.isConnected).length > 0 && (
              <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg backdrop-blur-sm">
                <p className="text-sm text-yellow-300">
                  Some platforms are not connected.{' '}
                  <a href="/dashboard/accounts" className="underline font-medium text-yellow-200">
                    Connect platforms
                  </a>
                </p>
              </div>
            )}
          </div>

          {/* Post Editor */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 sm:p-6 hover:border-white/20 transition-all">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">
                Post Content
              </h2>
              <button
                onClick={() => setIsAIWorkflowOpen(true)}
                className="group flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white rounded-lg hover:from-purple-600 hover:to-fuchsia-600 shadow-lg shadow-purple-500/30 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="font-medium">AI Generate</span>
              </button>
            </div>
            <PostEditor
              onSave={handleSaveDraft}
              initialContent={postContent}
              onChange={setPostContent}
              images={images}
              onImageUpload={handleImageUpload}
              onImageRemove={handleImageRemove}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4 sm:space-y-6">
          {/* Preview */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 sm:p-6 hover:border-white/20 transition-all">
            <h2 className="text-lg font-semibold text-white mb-4">Preview</h2>
            <div className="space-y-2 mb-4">
              <label className="text-sm font-medium text-slate-300">Platform</label>
              <select
                value={activePreview}
                onChange={(e) => setActivePreview(e.target.value as Platform)}
                className="w-full h-10 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500 transition-all"
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
          </div>

          {/* Schedule Picker */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 sm:p-6 hover:border-white/20 transition-all">
            <SchedulePicker
              onSchedule={handleSchedule}
              onPostNow={handlePostNow}
            />
          </div>

          {/* Action Buttons */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 sm:p-6">
            <div className="space-y-3">
              <button
                onClick={() => handleSaveDraft(postContent)}
                disabled={isSaving}
                className="w-full bg-white/5 border border-white/10 text-slate-300 px-4 py-3 rounded-lg font-medium hover:bg-white/10 transition-all disabled:opacity-50"
              >
                Save as Draft
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full bg-white/5 border border-white/10 text-slate-300 px-4 py-3 rounded-lg font-medium hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* AI Workflow Generator Modal */}
      <WorkflowGenerator
        isOpen={isAIWorkflowOpen}
        onClose={() => setIsAIWorkflowOpen(false)}
        onContentGenerated={handleAIContentGenerated}
      />
      </div>
    </div>
  )
}
