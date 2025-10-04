'use client'

import * as React from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Alert } from '@/components/ui/alert'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { PlatformPreview } from '@/components/posts/platform-preview'
import { createClient } from '@/lib/supabase/client'
import { generateSpeakerAnnouncement, regeneratePlatformAnnouncement } from '@/lib/ai/speaker-announcement'
import { generateSpeakerCardHTML } from '@/lib/images/speaker-card'
import type { Speaker } from '@/lib/types/speakers'
import type { Platform } from '@/lib/types/posts'

export default function SpeakerPreviewPage() {
  const router = useRouter()
  const params = useParams()
  const speakerId = params.id as string

  const [speaker, setSpeaker] = React.useState<Speaker | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isGenerating, setIsGenerating] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [activeTab, setActiveTab] = React.useState<Platform>('linkedin')
  const [isRegenerating, setIsRegenerating] = React.useState<Record<string, boolean>>({})
  const [isSaving, setIsSaving] = React.useState(false)

  const [generatedContent, setGeneratedContent] = React.useState<Record<Platform, string>>({
    linkedin: '',
    instagram: '',
    twitter: '',
    discord: ''
  })

  const [editedContent, setEditedContent] = React.useState<Record<Platform, string>>({
    linkedin: '',
    instagram: '',
    twitter: '',
    discord: ''
  })

  const [isEditing, setIsEditing] = React.useState<Record<Platform, boolean>>({
    linkedin: false,
    instagram: false,
    twitter: false,
    discord: false
  })

  const [speakerCardHtml, setSpeakerCardHtml] = React.useState<Record<string, string>>({})

  // Load speaker data
  React.useEffect(() => {
    loadSpeaker()
  }, [speakerId])

  const loadSpeaker = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('speakers')
        .select('*')
        .eq('id', speakerId)
        .single()

      if (error) throw error

      setSpeaker(data)

      // Check if announcements already exist
      const { data: existingAnnouncement } = await supabase
        .from('speaker_announcements')
        .select('*')
        .eq('speaker_id', speakerId)
        .single()

      if (existingAnnouncement) {
        // Load existing content
        setGeneratedContent(existingAnnouncement.generated_content)
        setEditedContent(existingAnnouncement.generated_content)
      } else {
        // Generate new announcements
        await generateAnnouncements(data)
      }

      setIsLoading(false)
    } catch (err) {
      console.error('Error loading speaker:', err)
      setError(err instanceof Error ? err.message : 'Failed to load speaker')
      setIsLoading(false)
    }
  }

  const generateAnnouncements = async (speakerData: Speaker) => {
    setIsGenerating(true)
    setError(null)

    try {
      const eventLink = `https://deepstation.ai/events/${speakerData.id}` // Replace with actual event link

      const results = await generateSpeakerAnnouncement(speakerData, eventLink)

      const content: Record<Platform, string> = {
        linkedin: results.linkedin?.content || '',
        instagram: results.instagram?.content || '',
        twitter: results.twitter?.content || '',
        discord: results.discord?.content || ''
      }

      setGeneratedContent(content)
      setEditedContent(content)

      // Generate speaker card HTML
      const cardHtml = {
        linkedin: generateSpeakerCardHTML(speakerData, 'linkedin'),
        twitter: generateSpeakerCardHTML(speakerData, 'twitter'),
        instagram: generateSpeakerCardHTML(speakerData, 'instagram'),
        discord: generateSpeakerCardHTML(speakerData, 'discord')
      }
      setSpeakerCardHtml(cardHtml)

      // Save to database
      const supabase = createClient()
      await supabase.from('speaker_announcements').upsert({
        speaker_id: speakerData.id,
        generated_content: content,
        status: 'draft'
      })
    } catch (err) {
      console.error('Error generating announcements:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate announcements')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRegeneratePlatform = async (platform: Platform) => {
    if (!speaker) return

    setIsRegenerating({ ...isRegenerating, [platform]: true })
    setError(null)

    try {
      const eventLink = `https://deepstation.ai/events/${speaker.id}`
      const result = await regeneratePlatformAnnouncement(speaker, platform, eventLink)

      const newContent = { ...editedContent, [platform]: result.content }
      setEditedContent(newContent)
      setGeneratedContent(newContent)

      // Update in database
      const supabase = createClient()
      await supabase
        .from('speaker_announcements')
        .update({ generated_content: newContent })
        .eq('speaker_id', speaker.id)
    } catch (err) {
      console.error(`Error regenerating ${platform}:`, err)
      setError(err instanceof Error ? err.message : `Failed to regenerate ${platform}`)
    } finally {
      setIsRegenerating({ ...isRegenerating, [platform]: false })
    }
  }

  const handleToggleEdit = (platform: Platform) => {
    setIsEditing({ ...isEditing, [platform]: !isEditing[platform] })
  }

  const handleSaveEdit = async (platform: Platform) => {
    if (!speaker) return

    setIsSaving(true)
    try {
      const supabase = createClient()
      await supabase
        .from('speaker_announcements')
        .update({ generated_content: editedContent })
        .eq('speaker_id', speaker.id)

      setIsEditing({ ...isEditing, [platform]: false })
    } catch (err) {
      console.error('Error saving edit:', err)
      setError(err instanceof Error ? err.message : 'Failed to save changes')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelEdit = (platform: Platform) => {
    setEditedContent({ ...editedContent, [platform]: generatedContent[platform] })
    setIsEditing({ ...isEditing, [platform]: false })
  }

  const handleSchedulePost = () => {
    // Navigate to post creation with pre-filled content
    router.push(
      `/dashboard/posts/new?speakerId=${speakerId}&linkedin=${encodeURIComponent(editedContent.linkedin)}&instagram=${encodeURIComponent(editedContent.instagram)}&twitter=${encodeURIComponent(editedContent.twitter)}&discord=${encodeURIComponent(editedContent.discord)}`
    )
  }

  const platforms: Array<{ key: Platform; label: string; icon: string }> = [
    { key: 'linkedin', label: 'LinkedIn', icon: '💼' },
    { key: 'instagram', label: 'Instagram', icon: '📷' },
    { key: 'twitter', label: 'X (Twitter)', icon: '🐦' },
    { key: 'discord', label: 'Discord', icon: '💬' }
  ]

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading speaker...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!speaker) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="error">Speaker not found</Alert>
      </div>
    )
  }

  if (isGenerating) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg font-semibold text-gray-900 mb-2">
              Generating Announcements...
            </p>
            <p className="text-gray-600">
              Creating platform-optimized content for all social channels
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-7xl p-6">
      <div className="mb-6">
        <Button variant="outline" onClick={() => router.push('/dashboard/speakers')}>
          ← Back to Speakers
        </Button>
      </div>

      {error && (
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
      )}

      {/* Speaker Info */}
      <Card className="p-6 mb-6">
        <div className="flex items-start gap-6">
          {speaker.profile_photo_url && (
            <img
              src={speaker.profile_photo_url}
              alt={speaker.full_name}
              className="w-24 h-24 rounded-full object-cover"
            />
          )}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{speaker.full_name}</h1>
            <p className="text-lg text-gray-600 mb-2">
              {speaker.title} at {speaker.company}
            </p>
            <p className="text-gray-700 mb-3">{speaker.bio}</p>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>📅 {new Date(speaker.event_date).toLocaleDateString()}</span>
              <span>📍 {speaker.event_location}</span>
              <span>🎤 {speaker.presentation_type}</span>
            </div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t">
          <h3 className="font-semibold text-gray-900 mb-2">
            "{speaker.presentation_title}"
          </h3>
          <p className="text-gray-700">{speaker.presentation_description}</p>
        </div>
      </Card>

      {/* Generated Announcements */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Generated Announcements</h2>
          <Button onClick={handleSchedulePost} size="lg">
            Schedule Posts
          </Button>
        </div>

        <Tabs defaultValue={activeTab} onValueChange={(value) => setActiveTab(value as Platform)}>
          <TabsList className="w-full justify-start overflow-x-auto mb-6">
            {platforms.map(({ key, label, icon }) => (
              <TabsTrigger key={key} value={key} className="flex items-center gap-2">
                <span>{icon}</span>
                <span>{label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {platforms.map(({ key, label }) => (
            <TabsContent key={key} value={key} className="space-y-6">
              {/* Content Editor */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Content</h3>
                  <div className="flex gap-2">
                    {isEditing[key] ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelEdit(key)}
                          disabled={isSaving}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleSaveEdit(key)}
                          disabled={isSaving}
                        >
                          {isSaving ? 'Saving...' : 'Save'}
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRegeneratePlatform(key)}
                          disabled={isRegenerating[key]}
                        >
                          {isRegenerating[key] ? 'Regenerating...' : 'Regenerate'}
                        </Button>
                        <Button size="sm" onClick={() => handleToggleEdit(key)}>
                          Edit
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {isEditing[key] ? (
                  <Textarea
                    value={editedContent[key]}
                    onChange={(e) =>
                      setEditedContent({ ...editedContent, [key]: e.target.value })
                    }
                    rows={12}
                    className="font-mono text-sm"
                  />
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <pre className="whitespace-pre-wrap text-sm text-gray-900">
                      {editedContent[key]}
                    </pre>
                  </div>
                )}

                <p className="text-sm text-gray-500">
                  Character count: {editedContent[key].length}
                </p>
              </div>

              {/* Platform Preview */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">Preview</h3>
                <div className="flex justify-center bg-gray-100 p-8 rounded-lg">
                  <PlatformPreview
                    platform={key}
                    content={editedContent[key]}
                    imageUrl={speaker.profile_photo_url}
                  />
                </div>
              </div>

              {/* Speaker Card HTML (for reference) */}
              {speakerCardHtml[key] && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900">Speaker Card HTML</h3>
                  <details className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <summary className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-700">
                      View HTML Template
                    </summary>
                    <pre className="mt-3 text-xs text-gray-700 overflow-x-auto">
                      {speakerCardHtml[key]}
                    </pre>
                  </details>
                  <p className="text-xs text-gray-500">
                    Note: Use this HTML template with an image generation service to create
                    speaker card graphics.
                  </p>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </Card>
    </div>
  )
}
