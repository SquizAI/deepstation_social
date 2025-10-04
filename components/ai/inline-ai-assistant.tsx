'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'

interface InlineAIAssistantProps {
  platform?: 'linkedin' | 'instagram' | 'twitter' | 'discord'
  onContentGenerated: (content: string) => void
  onImageGenerated: (imageUrl: string) => void
  onVideoGenerated: (videoUrl: string) => void
}

export function InlineAIAssistant({
  platform = 'linkedin',
  onContentGenerated,
  onImageGenerated,
  onVideoGenerated,
}: InlineAIAssistantProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [input, setInput] = React.useState('')
  const [isGenerating, setIsGenerating] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState<'text' | 'image' | 'video'>('text')

  const handleGenerate = async () => {
    if (!input.trim() || isGenerating) return

    setIsGenerating(true)
    try {
      if (activeTab === 'text') {
        const response = await fetch('/api/ai/generate-prompt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userPrompt: input,
            platform,
            optimize: true,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          onContentGenerated(data.generatedPrompt || data.prompt)
          setInput('')
          setIsOpen(false)
        }
      } else if (activeTab === 'image') {
        const response = await fetch('/api/ai/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: input,
            model: 'gemini-2.5-flash-image',
            aspectRatio: platform === 'instagram' ? '1:1' : '16:9',
            numberOfImages: 1,
            platform,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          if (data.images?.[0]?.url) {
            onImageGenerated(data.images[0].url)
            setInput('')
            setIsOpen(false)
          }
        }
      } else if (activeTab === 'video') {
        const response = await fetch('/api/ai/generate-video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: input,
            resolution: '1080p',
            duration: 5,
            aspectRatio: platform === 'instagram' ? '9:16' : '16:9',
            style: 'cinematic',
            withAudio: false,
            fps: 30,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          if (data.video?.url) {
            onVideoGenerated(data.video.url)
            setInput('')
            setIsOpen(false)
          }
        }
      }
    } catch (error) {
      console.error('AI generation error:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="relative">
      {/* AI Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-400 hover:text-fuchsia-400 transition-colors"
      >
        <svg
          className="w-4 h-4 group-hover:scale-110 transition-transform"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
        <span>AI</span>
      </button>

      {/* AI Panel */}
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-[400px] bg-slate-900/95 backdrop-blur-md border border-purple-500/20 rounded-xl shadow-2xl overflow-hidden z-50">
          {/* Tabs */}
          <div className="flex border-b border-white/10">
            <button
              onClick={() => setActiveTab('text')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${
                activeTab === 'text'
                  ? 'bg-purple-500/20 text-purple-300 border-b-2 border-purple-500'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              ✍️ Text
            </button>
            <button
              onClick={() => setActiveTab('image')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${
                activeTab === 'image'
                  ? 'bg-purple-500/20 text-purple-300 border-b-2 border-purple-500'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              🎨 Image
            </button>
            <button
              onClick={() => setActiveTab('video')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${
                activeTab === 'video'
                  ? 'bg-purple-500/20 text-purple-300 border-b-2 border-purple-500'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              🎬 Video
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">
                {activeTab === 'text'
                  ? 'What should your post be about?'
                  : activeTab === 'image'
                  ? 'Describe the image you want'
                  : 'Describe the video you want'}
              </label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  activeTab === 'text'
                    ? 'e.g., Share tips for remote work productivity'
                    : activeTab === 'image'
                    ? 'e.g., Modern office setup with plants'
                    : 'e.g., Time-lapse of sunset over city'
                }
                rows={3}
                className="w-full px-3 py-2 bg-white/5 border border-purple-500/20 rounded-lg text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.metaKey) {
                    handleGenerate()
                  }
                }}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="text-xs text-slate-500">
                ⌘ + Enter to generate
              </div>
              <Button
                onClick={handleGenerate}
                disabled={!input.trim() || isGenerating}
                size="sm"
                className="bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white hover:opacity-90 disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                    Generate
                  </>
                )}
              </Button>
            </div>

            {/* Quick Actions */}
            <div className="pt-3 border-t border-white/10">
              <div className="text-xs font-medium text-slate-400 mb-2">Quick Actions</div>
              <div className="flex flex-wrap gap-2">
                {activeTab === 'text' ? (
                  <>
                    <button
                      onClick={() => setInput('Create an engaging post about my latest project')}
                      className="text-xs px-3 py-1 bg-white/5 border border-white/10 rounded-md hover:bg-white/10 text-slate-300 transition-all"
                    >
                      Project Update
                    </button>
                    <button
                      onClick={() => setInput('Share industry insights and tips')}
                      className="text-xs px-3 py-1 bg-white/5 border border-white/10 rounded-md hover:bg-white/10 text-slate-300 transition-all"
                    >
                      Industry Tips
                    </button>
                    <button
                      onClick={() => setInput('Announce a new feature or product')}
                      className="text-xs px-3 py-1 bg-white/5 border border-white/10 rounded-md hover:bg-white/10 text-slate-300 transition-all"
                    >
                      Announcement
                    </button>
                  </>
                ) : activeTab === 'image' ? (
                  <>
                    <button
                      onClick={() => setInput('Professional headshot with modern office background')}
                      className="text-xs px-3 py-1 bg-white/5 border border-white/10 rounded-md hover:bg-white/10 text-slate-300 transition-all"
                    >
                      Headshot
                    </button>
                    <button
                      onClick={() => setInput('Abstract tech background with gradient colors')}
                      className="text-xs px-3 py-1 bg-white/5 border border-white/10 rounded-md hover:bg-white/10 text-slate-300 transition-all"
                    >
                      Background
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setInput('Product demo showing key features')}
                      className="text-xs px-3 py-1 bg-white/5 border border-white/10 rounded-md hover:bg-white/10 text-slate-300 transition-all"
                    >
                      Product Demo
                    </button>
                    <button
                      onClick={() => setInput('Social media intro with logo animation')}
                      className="text-xs px-3 py-1 bg-white/5 border border-white/10 rounded-md hover:bg-white/10 text-slate-300 transition-all"
                    >
                      Intro
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
