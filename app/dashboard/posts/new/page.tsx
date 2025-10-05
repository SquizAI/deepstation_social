'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PostContent } from '@/components/posts/post-editor'
import { PlatformPreview } from '@/components/posts/platform-preview'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'

type Platform = 'linkedin' | 'instagram' | 'twitter' | 'discord'

interface ConnectedPlatform {
  platform: Platform
  isConnected: boolean
}

type Step = 'platforms' | 'content' | 'media' | 'schedule'

const PLATFORM_LIMITS = {
  linkedin: 3000,
  instagram: 2200,
  twitter: 280,
  discord: 4000
} as const

export default function NewPostPage() {
  const router = useRouter()
  const supabase = createClient()

  // Wizard state
  const [currentStep, setCurrentStep] = React.useState<Step>('platforms')
  const [completedSteps, setCompletedSteps] = React.useState<Step[]>([])

  // Data state
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
  const [activeContentPlatform, setActiveContentPlatform] = React.useState<Platform>('linkedin')
  const [scheduledDate, setScheduledDate] = React.useState<Date | null>(null)
  const [timezone, setTimezone] = React.useState('America/New_York')

  // UI state
  const [isSaving, setIsSaving] = React.useState(false)
  const [userId, setUserId] = React.useState<string | null>(null)
  const [alert, setAlert] = React.useState<{
    variant: 'success' | 'error' | 'warning'
    title: string
    message: string
  } | null>(null)
  const [isAIAssistantOpen, setIsAIAssistantOpen] = React.useState(false)

  const fileInputRefs = React.useRef<Record<string, HTMLInputElement | null>>({})

  // Fetch user and connected platforms
  React.useEffect(() => {
    async function fetchUserAndPlatforms() {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      setUserId(user.id)

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
      }
    }

    fetchUserAndPlatforms()
  }, [])

  const platformConfig = [
    {
      key: 'linkedin' as Platform,
      label: 'LinkedIn',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
      textColor: 'text-blue-400',
      description: 'Professional network for business content'
    },
    {
      key: 'instagram' as Platform,
      label: 'Instagram',
      color: 'from-pink-500 to-purple-600',
      bgColor: 'bg-pink-500/10',
      borderColor: 'border-pink-500/20',
      textColor: 'text-pink-400',
      description: 'Visual platform for lifestyle and brand content'
    },
    {
      key: 'twitter' as Platform,
      label: 'X (Twitter)',
      color: 'from-blue-400 to-cyan-500',
      bgColor: 'bg-blue-400/10',
      borderColor: 'border-blue-400/20',
      textColor: 'text-blue-300',
      description: 'Real-time updates and conversations'
    },
    {
      key: 'discord' as Platform,
      label: 'Discord',
      color: 'from-indigo-500 to-purple-600',
      bgColor: 'bg-indigo-500/10',
      borderColor: 'border-indigo-500/20',
      textColor: 'text-indigo-400',
      description: 'Community announcements and engagement'
    }
  ]

  const steps = [
    { key: 'platforms' as Step, label: 'Select Platforms', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { key: 'content' as Step, label: 'Create Content', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
    { key: 'media' as Step, label: 'Add Media', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { key: 'schedule' as Step, label: 'Schedule & Publish', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' }
  ]

  const togglePlatform = (platform: Platform) => {
    setSelectedPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    )
  }

  const canProgressFromStep = (step: Step): boolean => {
    switch (step) {
      case 'platforms':
        return selectedPlatforms.length > 0
      case 'content':
        return selectedPlatforms.some(p => postContent[p].trim() !== '')
      case 'media':
        return true // Media is optional
      case 'schedule':
        return true
      default:
        return false
    }
  }

  const nextStep = () => {
    if (!canProgressFromStep(currentStep)) {
      setAlert({
        variant: 'warning',
        title: 'Cannot Continue',
        message: currentStep === 'platforms'
          ? 'Please select at least one platform'
          : 'Please add content for at least one selected platform'
      })
      return
    }

    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps(prev => [...prev, currentStep])
    }

    const stepOrder: Step[] = ['platforms', 'content', 'media', 'schedule']
    const currentIndex = stepOrder.indexOf(currentStep)
    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1])
      setAlert(null)
    }
  }

  const previousStep = () => {
    const stepOrder: Step[] = ['platforms', 'content', 'media', 'schedule']
    const currentIndex = stepOrder.indexOf(currentStep)
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1])
      setAlert(null)
    }
  }

  const handleImageUpload = async (platform: string, file: File) => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}/${Date.now()}.${fileExt}`
      const { data, error } = await supabase.storage
        .from('post-images')
        .upload(fileName, file)

      if (error) throw error

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

  const handleSaveDraft = async () => {
    if (!userId) return

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
          status: 'draft'
        })

      if (error) throw error

      setAlert({
        variant: 'success',
        title: 'Draft Saved',
        message: 'Your post has been saved as a draft.'
      })

      setTimeout(() => router.push('/dashboard'), 2000)
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

  const handleSchedulePost = async () => {
    if (!userId || !scheduledDate) return

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
          scheduled_for: scheduledDate.toISOString(),
          timezone,
          status: 'scheduled'
        })

      if (error) throw error

      setAlert({
        variant: 'success',
        title: 'Post Scheduled',
        message: `Your post has been scheduled for ${scheduledDate.toLocaleString()}`
      })

      setTimeout(() => router.push('/dashboard/schedule'), 2000)
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
    if (!userId) return

    setIsSaving(true)
    try {
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

      setTimeout(() => router.push('/dashboard'), 2000)
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

  const getCharacterCount = (platform: Platform) => {
    const current = postContent[platform].length
    const max = PLATFORM_LIMITS[platform]
    const percentage = (current / max) * 100
    const isOverLimit = current > max

    return { current, max, percentage, isOverLimit }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#201033] via-[#15092b] to-[#0a0513]">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-fuchsia-500/10 rounded-full blur-3xl animate-[float_20s_ease-in-out_infinite]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-3xl animate-[float_25s_ease-in-out_infinite_reverse]"></div>
      </div>

      <div className="relative max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="group flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back to Dashboard</span>
          </button>

          <h1 className="text-4xl font-bold text-white mb-2">Create New Post</h1>
          <p className="text-slate-400">
            Follow the steps below to create and publish your social media content
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const isActive = step.key === currentStep
                const isCompleted = completedSteps.includes(step.key)
                const isClickable = index === 0 || completedSteps.includes(steps[index - 1].key)

                return (
                  <React.Fragment key={step.key}>
                    <button
                      onClick={() => isClickable && setCurrentStep(step.key)}
                      disabled={!isClickable}
                      className={`flex flex-col items-center gap-2 flex-1 transition-all ${
                        isClickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-fuchsia-500 to-purple-600 shadow-lg shadow-fuchsia-500/50'
                          : isCompleted
                          ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                          : 'bg-white/10 border border-white/20'
                      }`}>
                        {isCompleted ? (
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={step.icon} />
                          </svg>
                        )}
                      </div>
                      <span className={`text-sm font-medium transition-colors ${
                        isActive ? 'text-white' : isCompleted ? 'text-green-400' : 'text-slate-400'
                      }`}>
                        {step.label}
                      </span>
                    </button>
                    {index < steps.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-2 transition-colors ${
                        completedSteps.includes(step.key) ? 'bg-green-500' : 'bg-white/10'
                      }`} />
                    )}
                  </React.Fragment>
                )
              })}
            </div>
          </div>
        </div>

        {/* Alert */}
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

        {/* Step Content */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 mb-6">
          {/* Step 1: Platform Selection */}
          {currentStep === 'platforms' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Select Your Platforms</h2>
                <p className="text-slate-400">Choose where you want to publish your content</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {platformConfig.map((platform) => {
                  const platformData = connectedPlatforms.find(p => p.platform === platform.key)
                  const isConnected = platformData?.isConnected ?? false
                  const isSelected = selectedPlatforms.includes(platform.key)

                  return (
                    <button
                      key={platform.key}
                      onClick={() => isConnected && togglePlatform(platform.key)}
                      disabled={!isConnected}
                      className={`relative p-6 rounded-xl border-2 transition-all text-left ${
                        isSelected
                          ? `border-fuchsia-500 ${platform.bgColor} shadow-lg shadow-fuchsia-500/20`
                          : isConnected
                          ? 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                          : 'border-white/5 bg-white/5 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      {/* Selection Indicator */}
                      {isSelected && (
                        <div className="absolute top-4 right-4 w-6 h-6 bg-gradient-to-r from-fuchsia-500 to-purple-600 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}

                      <div className="flex items-start gap-4">
                        {/* Platform Icon */}
                        <div className={`w-14 h-14 rounded-lg bg-gradient-to-r ${platform.color} flex items-center justify-center flex-shrink-0`}>
                          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                            {platform.key === 'linkedin' && <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>}
                            {platform.key === 'instagram' && <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>}
                            {platform.key === 'twitter' && <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>}
                            {platform.key === 'discord' && <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>}
                          </svg>
                        </div>

                        {/* Platform Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-semibold text-white">{platform.label}</h3>
                            {isConnected ? (
                              <Badge variant="success" className="text-xs">Connected</Badge>
                            ) : (
                              <Badge variant="error" className="text-xs">Not Connected</Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-400">{platform.description}</p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Connection Warning */}
              {connectedPlatforms.some(p => !p.isConnected) && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-yellow-300">Some platforms are not connected</p>
                      <p className="text-sm text-yellow-400/80 mt-1">
                        <a href="/dashboard/settings/social-credentials" className="underline hover:text-yellow-300">
                          Connect your platforms
                        </a>
                        {' '}to enable posting to all platforms.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Selected Count */}
              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <p className="text-slate-400">
                  {selectedPlatforms.length} platform{selectedPlatforms.length !== 1 ? 's' : ''} selected
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Content Creation */}
          {currentStep === 'content' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Create Your Content</h2>
                <p className="text-slate-400">Write tailored content for each platform</p>
              </div>

              {/* AI Assistant Toggle */}
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-fuchsia-500/10 to-purple-500/10 border border-fuchsia-500/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-fuchsia-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <div>
                    <p className="text-white font-medium">AI Assistant</p>
                    <p className="text-sm text-slate-400">Get help writing and optimizing your content</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAIAssistantOpen(!isAIAssistantOpen)}
                  className="px-4 py-2 bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white rounded-lg hover:shadow-lg hover:shadow-fuchsia-500/30 transition-all font-medium"
                >
                  {isAIAssistantOpen ? 'Hide' : 'Show'} Assistant
                </button>
              </div>

              {/* Platform Tabs */}
              <div className="space-y-4">
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {selectedPlatforms.map((platformKey) => {
                    const platform = platformConfig.find(p => p.key === platformKey)
                    if (!platform) return null

                    return (
                      <button
                        key={platformKey}
                        onClick={() => setActiveContentPlatform(platformKey)}
                        className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                          activeContentPlatform === platformKey
                            ? `bg-gradient-to-r ${platform.color} text-white shadow-lg`
                            : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {platform.label}
                      </button>
                    )
                  })}
                </div>

                {/* Content Editor for Active Platform */}
                {selectedPlatforms.map((platformKey) => {
                  if (platformKey !== activeContentPlatform) return null

                  const platform = platformConfig.find(p => p.key === platformKey)
                  if (!platform) return null

                  const charInfo = getCharacterCount(platformKey)

                  return (
                    <div key={platformKey} className="space-y-4">
                      {/* Character Count */}
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-white">
                          {platform.label} Post Content
                        </label>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${
                            charInfo.isOverLimit ? 'text-red-400' :
                            charInfo.percentage > 90 ? 'text-yellow-400' :
                            'text-slate-400'
                          }`}>
                            {charInfo.current} / {charInfo.max}
                          </span>
                        </div>
                      </div>

                      {/* Text Area */}
                      <Textarea
                        name={`content_${platformKey}`}
                        value={postContent[platformKey]}
                        onChange={(e) => setPostContent(prev => ({ ...prev, [platformKey]: e.target.value }))}
                        rows={10}
                        placeholder={`Write your ${platform.label} post here...`}
                        className={`bg-white/5 border-white/10 text-white placeholder:text-slate-500 ${
                          charInfo.isOverLimit ? 'border-red-500' : ''
                        }`}
                      />

                      {/* Progress Bar */}
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            charInfo.isOverLimit ? 'bg-red-500' :
                            charInfo.percentage > 90 ? 'bg-yellow-500' :
                            `bg-gradient-to-r ${platform.color}`
                          }`}
                          style={{ width: `${Math.min(charInfo.percentage, 100)}%` }}
                        />
                      </div>

                      {/* Platform Tips */}
                      <div className={`p-4 rounded-lg border ${platform.bgColor} ${platform.borderColor}`}>
                        <p className={`text-sm font-medium ${platform.textColor} mb-2`}>
                          Tips for {platform.label}:
                        </p>
                        <ul className="text-sm text-slate-400 space-y-1">
                          {platformKey === 'linkedin' && (
                            <>
                              <li>• Use professional tone and focus on business value</li>
                              <li>• Include 3-5 relevant hashtags</li>
                              <li>• Tag company pages for better reach</li>
                            </>
                          )}
                          {platformKey === 'instagram' && (
                            <>
                              <li>• Use emojis for visual appeal</li>
                              <li>• Include 20-30 relevant hashtags</li>
                              <li>• Lead with a compelling hook</li>
                            </>
                          )}
                          {platformKey === 'twitter' && (
                            <>
                              <li>• Keep it concise and punchy</li>
                              <li>• Use threads for longer content</li>
                              <li>• Include trending hashtags</li>
                            </>
                          )}
                          {platformKey === 'discord' && (
                            <>
                              <li>• Use markdown formatting</li>
                              <li>• Include @everyone or @here for announcements</li>
                              <li>• Add clear call-to-action</li>
                            </>
                          )}
                        </ul>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Step 3: Media Upload */}
          {currentStep === 'media' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Add Media</h2>
                <p className="text-slate-400">Upload images or videos for your posts (optional)</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedPlatforms.map((platformKey) => {
                  const platform = platformConfig.find(p => p.key === platformKey)
                  if (!platform) return null

                  return (
                    <div key={platformKey} className={`p-6 rounded-xl border ${platform.borderColor} ${platform.bgColor}`}>
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${platform.color} flex items-center justify-center`}>
                          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <h3 className="font-semibold text-white">{platform.label}</h3>
                      </div>

                      {images[platformKey] ? (
                        <div className="relative">
                          <img
                            src={images[platformKey]}
                            alt={`${platform.label} preview`}
                            className="w-full h-48 object-cover rounded-lg"
                          />
                          <button
                            onClick={() => handleImageRemove(platformKey)}
                            className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-lg p-2 transition-colors shadow-lg"
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
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleImageUpload(platformKey, file)
                            }}
                            ref={(el) => { fileInputRefs.current[platformKey] = el }}
                            className="hidden"
                          />
                          <button
                            onClick={() => fileInputRefs.current[platformKey]?.click()}
                            className="w-full h-48 border-2 border-dashed border-white/20 rounded-lg hover:border-white/40 hover:bg-white/5 transition-all flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-white"
                          >
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <span className="text-sm font-medium">Click to upload image</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-blue-300">Media Tips</p>
                    <p className="text-sm text-blue-400/80 mt-1">
                      Images should be high-quality and relevant to your content. Recommended sizes: LinkedIn (1200x627), Instagram (1080x1080), Twitter (1200x675)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Schedule & Publish */}
          {currentStep === 'schedule' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Schedule & Publish</h2>
                <p className="text-slate-400">Choose when to publish your content</p>
              </div>

              {/* Preview */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Preview</h3>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {selectedPlatforms.map((platformKey) => {
                    const platform = platformConfig.find(p => p.key === platformKey)
                    if (!platform) return null

                    return (
                      <button
                        key={platformKey}
                        onClick={() => setActiveContentPlatform(platformKey)}
                        className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                          activeContentPlatform === platformKey
                            ? `bg-gradient-to-r ${platform.color} text-white shadow-lg`
                            : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {platform.label}
                      </button>
                    )
                  })}
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <PlatformPreview
                    platform={activeContentPlatform}
                    content={postContent[activeContentPlatform]}
                    imageUrl={images[activeContentPlatform]}
                  />
                </div>
              </div>

              {/* Scheduling Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="text-sm font-medium text-white">Date & Time</label>
                  <input
                    type="datetime-local"
                    value={scheduledDate ? scheduledDate.toISOString().slice(0, 16) : ''}
                    onChange={(e) => setScheduledDate(new Date(e.target.value))}
                    className="w-full h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-white">Timezone</label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                  >
                    <option value="America/New_York">Eastern Time (ET)</option>
                    <option value="America/Chicago">Central Time (CT)</option>
                    <option value="America/Denver">Mountain Time (MT)</option>
                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                  </select>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={handleSaveDraft}
                  disabled={isSaving}
                  className="p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-white/20 transition-all text-left group"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <svg className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    <span className="font-semibold text-white">Save Draft</span>
                  </div>
                  <p className="text-sm text-slate-400">Save for later editing</p>
                </button>

                <button
                  onClick={handleSchedulePost}
                  disabled={isSaving || !scheduledDate}
                  className="p-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl hover:border-blue-500/40 transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="font-semibold text-white">Schedule</span>
                  </div>
                  <p className="text-sm text-slate-400">Post at scheduled time</p>
                </button>

                <button
                  onClick={handlePostNow}
                  disabled={isSaving}
                  className="p-4 bg-gradient-to-r from-fuchsia-500/10 to-purple-500/10 border border-fuchsia-500/20 rounded-xl hover:border-fuchsia-500/40 transition-all text-left group"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <svg className="w-6 h-6 text-fuchsia-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className="font-semibold text-white">Post Now</span>
                  </div>
                  <p className="text-sm text-slate-400">Publish immediately</p>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={previousStep}
            disabled={currentStep === 'platforms'}
            className="flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </Button>

          {currentStep !== 'schedule' && (
            <Button
              onClick={nextStep}
              disabled={!canProgressFromStep(currentStep)}
              className="flex items-center gap-2 bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:shadow-lg hover:shadow-fuchsia-500/30"
            >
              Next
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
