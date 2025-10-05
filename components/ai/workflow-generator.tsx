'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'

type ContentType = 'text' | 'image' | 'video'
type Step = 'select-type' | 'configure' | 'review' | 'complete'

interface GeneratedContent {
  id: string
  type: ContentType
  content: string
  imageUrl?: string
  videoUrl?: string
  timestamp: Date
}

interface WorkflowGeneratorProps {
  onContentGenerated: (content: GeneratedContent) => void
  onClose: () => void
  isOpen: boolean
}

export function WorkflowGenerator({ onContentGenerated, onClose, isOpen }: WorkflowGeneratorProps) {
  const [currentStep, setCurrentStep] = React.useState<Step>('select-type')
  const [selectedType, setSelectedType] = React.useState<ContentType | null>(null)
  const [isGenerating, setIsGenerating] = React.useState(false)
  const [generatedContent, setGeneratedContent] = React.useState<GeneratedContent | null>(null)
  const [history, setHistory] = React.useState<GeneratedContent[]>([])

  // Text generation config
  const [prompt, setPrompt] = React.useState('')
  const [tone, setTone] = React.useState<'professional' | 'casual' | 'enthusiastic'>('professional')
  const [platform, setPlatform] = React.useState<'linkedin' | 'instagram' | 'twitter' | 'discord'>('linkedin')

  // Image generation config
  const [imagePrompt, setImagePrompt] = React.useState('')
  const [imageStyle, setImageStyle] = React.useState<'realistic' | 'artistic' | 'abstract'>('realistic')
  const [aspectRatio, setAspectRatio] = React.useState<'1:1' | '16:9' | '9:16'>('1:1')

  // Video generation config
  const [videoPrompt, setVideoPrompt] = React.useState('')
  const [videoDuration, setVideoDuration] = React.useState<5 | 10 | 15>(5)
  const [videoQuality, setVideoQuality] = React.useState<'standard' | 'high'>('high')

  React.useEffect(() => {
    if (isOpen) {
      resetWorkflow()
    }
  }, [isOpen])

  const resetWorkflow = () => {
    setCurrentStep('select-type')
    setSelectedType(null)
    setIsGenerating(false)
    setGeneratedContent(null)
    setPrompt('')
    setImagePrompt('')
    setVideoPrompt('')
  }

  const handleTypeSelect = (type: ContentType) => {
    setSelectedType(type)
    setCurrentStep('configure')
  }

  const handleGenerate = async () => {
    setIsGenerating(true)

    try {
      let content: GeneratedContent | null = null

      if (selectedType === 'text') {
        // Placeholder for AI text generation
        const generatedText = await generateTextContent(prompt, tone, platform)
        content = {
          id: crypto.randomUUID(),
          type: 'text',
          content: generatedText,
          timestamp: new Date()
        }
      } else if (selectedType === 'image') {
        // Placeholder for nano banana image generation
        const imageUrl = await generateImageContent(imagePrompt, imageStyle, aspectRatio)
        content = {
          id: crypto.randomUUID(),
          type: 'image',
          content: imagePrompt,
          imageUrl,
          timestamp: new Date()
        }
      } else if (selectedType === 'video') {
        // Placeholder for VEO3 video generation
        const videoUrl = await generateVideoContent(videoPrompt, videoDuration, videoQuality)
        content = {
          id: crypto.randomUUID(),
          type: 'video',
          content: videoPrompt,
          videoUrl,
          timestamp: new Date()
        }
      }

      if (content) {
        setGeneratedContent(content)
        setHistory(prev => [content!, ...prev])
        setCurrentStep('review')
      }
    } catch (error) {
      console.error('Generation error:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleUseContent = () => {
    if (generatedContent) {
      onContentGenerated(generatedContent)
      setCurrentStep('complete')
      setTimeout(() => {
        onClose()
        resetWorkflow()
      }, 1500)
    }
  }

  const handleBack = () => {
    if (currentStep === 'configure') {
      setCurrentStep('select-type')
    } else if (currentStep === 'review') {
      setCurrentStep('configure')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <Card className="bg-slate-900/95 backdrop-blur-md border border-purple-500/20 shadow-2xl">
          {/* Header */}
          <div className="p-6 border-b border-purple-500/20">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">AI Content Generator</h2>
                <p className="text-slate-400 text-sm mt-1">
                  Create engaging content with AI-powered tools
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white transition-colors"
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center gap-2 mt-6">
              {['Type', 'Configure', 'Review', 'Done'].map((label, idx) => {
                const stepIndex = ['select-type', 'configure', 'review', 'complete'].indexOf(currentStep)
                const isActive = idx === stepIndex
                const isComplete = idx < stepIndex

                return (
                  <React.Fragment key={label}>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                          isActive
                            ? 'bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white shadow-lg shadow-purple-500/50'
                            : isComplete
                            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
                            : 'bg-slate-800 text-slate-500 border border-slate-700'
                        }`}
                      >
                        {isComplete ? '✓' : idx + 1}
                      </div>
                      <span
                        className={`text-sm font-medium ${
                          isActive ? 'text-white' : isComplete ? 'text-purple-400' : 'text-slate-500'
                        }`}
                      >
                        {label}
                      </span>
                    </div>
                    {idx < 3 && (
                      <div
                        className={`flex-1 h-0.5 ${
                          isComplete ? 'bg-purple-500/50' : 'bg-slate-700'
                        }`}
                      />
                    )}
                  </React.Fragment>
                )
              })}
            </div>
          </div>

          {/* Content Area */}
          <div className="p-6">
            {/* Step 1: Select Type */}
            {currentStep === 'select-type' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-white">Choose Content Type</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    {
                      type: 'text' as ContentType,
                      icon: '✍️',
                      title: 'Post Text',
                      description: 'Generate engaging social media posts'
                    },
                    {
                      type: 'image' as ContentType,
                      icon: '🎨',
                      title: 'Image',
                      description: 'Create images with nano banana AI'
                    },
                    {
                      type: 'video' as ContentType,
                      icon: '🎬',
                      title: 'Video',
                      description: 'Generate videos with VEO3'
                    }
                  ].map(({ type, icon, title, description }) => (
                    <button
                      key={type}
                      onClick={() => handleTypeSelect(type)}
                      className="group relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-sm border border-purple-500/20 p-6 text-left transition-all hover:bg-white/10 hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-500/20"
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-fuchsia-500/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative">
                        <div className="text-4xl mb-3">{icon}</div>
                        <h4 className="text-lg font-semibold text-white mb-2">{title}</h4>
                        <p className="text-sm text-slate-400">{description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Configure */}
            {currentStep === 'configure' && selectedType === 'text' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-white">Configure Text Generation</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      What would you like to post about?
                    </label>
                    <Textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="E.g., Announce our upcoming AI workshop on neural networks..."
                      rows={4}
                      className="w-full bg-white/5 border-purple-500/20 text-white placeholder:text-slate-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Tone</label>
                      <select
                        value={tone}
                        onChange={(e) => setTone(e.target.value as any)}
                        className="w-full h-10 rounded-md bg-white/5 border border-purple-500/20 text-white px-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                      >
                        <option value="professional">Professional</option>
                        <option value="casual">Casual</option>
                        <option value="enthusiastic">Enthusiastic</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Target Platform</label>
                      <select
                        value={platform}
                        onChange={(e) => setPlatform(e.target.value as any)}
                        className="w-full h-10 rounded-md bg-white/5 border border-purple-500/20 text-white px-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                      >
                        <option value="linkedin">LinkedIn</option>
                        <option value="instagram">Instagram</option>
                        <option value="twitter">Twitter</option>
                        <option value="discord">Discord</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="default"
                    onClick={handleBack}
                    className="bg-white/5 border-purple-500/20 text-white hover:bg-white/10"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleGenerate}
                    disabled={!prompt.trim() || isGenerating}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white hover:from-purple-600 hover:to-fuchsia-600 shadow-lg shadow-purple-500/30 disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Generating...
                      </span>
                    ) : (
                      'Generate Content'
                    )}
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 'configure' && selectedType === 'image' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-white">Configure Image Generation</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Describe the image you want
                    </label>
                    <Textarea
                      value={imagePrompt}
                      onChange={(e) => setImagePrompt(e.target.value)}
                      placeholder="E.g., A futuristic AI laboratory with glowing neural networks..."
                      rows={4}
                      className="w-full bg-white/5 border-purple-500/20 text-white placeholder:text-slate-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Style</label>
                      <select
                        value={imageStyle}
                        onChange={(e) => setImageStyle(e.target.value as any)}
                        className="w-full h-10 rounded-md bg-white/5 border border-purple-500/20 text-white px-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                      >
                        <option value="realistic">Realistic</option>
                        <option value="artistic">Artistic</option>
                        <option value="abstract">Abstract</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Aspect Ratio</label>
                      <select
                        value={aspectRatio}
                        onChange={(e) => setAspectRatio(e.target.value as any)}
                        className="w-full h-10 rounded-md bg-white/5 border border-purple-500/20 text-white px-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                      >
                        <option value="1:1">Square (1:1)</option>
                        <option value="16:9">Landscape (16:9)</option>
                        <option value="9:16">Portrait (9:16)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="default"
                    onClick={handleBack}
                    className="bg-white/5 border-purple-500/20 text-white hover:bg-white/10"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleGenerate}
                    disabled={!imagePrompt.trim() || isGenerating}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white hover:from-purple-600 hover:to-fuchsia-600 shadow-lg shadow-purple-500/30 disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Generating with nano banana...
                      </span>
                    ) : (
                      'Generate Image'
                    )}
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 'configure' && selectedType === 'video' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-white">Configure Video Generation</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Describe the video you want
                    </label>
                    <Textarea
                      value={videoPrompt}
                      onChange={(e) => setVideoPrompt(e.target.value)}
                      placeholder="E.g., A time-lapse of neural networks learning and evolving..."
                      rows={4}
                      className="w-full bg-white/5 border-purple-500/20 text-white placeholder:text-slate-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Duration (seconds)</label>
                      <select
                        value={videoDuration}
                        onChange={(e) => setVideoDuration(Number(e.target.value) as any)}
                        className="w-full h-10 rounded-md bg-white/5 border border-purple-500/20 text-white px-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                      >
                        <option value={5}>5 seconds</option>
                        <option value={10}>10 seconds</option>
                        <option value={15}>15 seconds</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Quality</label>
                      <select
                        value={videoQuality}
                        onChange={(e) => setVideoQuality(e.target.value as any)}
                        className="w-full h-10 rounded-md bg-white/5 border border-purple-500/20 text-white px-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                      >
                        <option value="standard">Standard</option>
                        <option value="high">High Quality</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="default"
                    onClick={handleBack}
                    className="bg-white/5 border-purple-500/20 text-white hover:bg-white/10"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleGenerate}
                    disabled={!videoPrompt.trim() || isGenerating}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white hover:from-purple-600 hover:to-fuchsia-600 shadow-lg shadow-purple-500/30 disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Generating with VEO3...
                      </span>
                    ) : (
                      'Generate Video'
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Review */}
            {currentStep === 'review' && generatedContent && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-white">Review Generated Content</h3>

                <div className="rounded-xl bg-white/5 backdrop-blur-sm border border-purple-500/20 p-6">
                  {generatedContent.type === 'text' && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <span className="px-2 py-1 rounded-md bg-purple-500/20 text-purple-400">Text Post</span>
                        <span>•</span>
                        <span>{new Date(generatedContent.timestamp).toLocaleString()}</span>
                      </div>
                      <Textarea
                        value={generatedContent.content}
                        onChange={(e) => setGeneratedContent({ ...generatedContent, content: e.target.value })}
                        rows={8}
                        className="w-full bg-white/5 border-purple-500/20 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                      />
                      <p className="text-sm text-slate-400">
                        You can edit the generated text before using it in your post.
                      </p>
                    </div>
                  )}

                  {generatedContent.type === 'image' && generatedContent.imageUrl && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <span className="px-2 py-1 rounded-md bg-purple-500/20 text-purple-400">Generated Image</span>
                        <span>•</span>
                        <span>{new Date(generatedContent.timestamp).toLocaleString()}</span>
                      </div>
                      <img
                        src={generatedContent.imageUrl}
                        alt="Generated content"
                        className="w-full rounded-lg border border-purple-500/20"
                      />
                      <p className="text-sm text-slate-300">{generatedContent.content}</p>
                    </div>
                  )}

                  {generatedContent.type === 'video' && generatedContent.videoUrl && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <span className="px-2 py-1 rounded-md bg-purple-500/20 text-purple-400">Generated Video</span>
                        <span>•</span>
                        <span>{new Date(generatedContent.timestamp).toLocaleString()}</span>
                      </div>
                      <video
                        src={generatedContent.videoUrl}
                        controls
                        className="w-full rounded-lg border border-purple-500/20"
                      />
                      <p className="text-sm text-slate-300">{generatedContent.content}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="default"
                    onClick={handleBack}
                    className="bg-white/5 border-purple-500/20 text-white hover:bg-white/10"
                  >
                    Regenerate
                  </Button>
                  <Button
                    onClick={handleUseContent}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white hover:from-purple-600 hover:to-fuchsia-600 shadow-lg shadow-purple-500/30"
                  >
                    Use This Content
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Complete */}
            {currentStep === 'complete' && (
              <div className="py-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-500 mb-4 shadow-lg shadow-purple-500/50">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Content Added!</h3>
                <p className="text-slate-400">Your generated content has been added to your post.</p>
              </div>
            )}
          </div>

          {/* Generation History Sidebar (collapsed by default) */}
          {history.length > 0 && currentStep !== 'complete' && (
            <div className="border-t border-purple-500/20 p-6">
              <h4 className="text-sm font-semibold text-slate-300 mb-3">Recent Generations</h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {history.slice(0, 3).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setGeneratedContent(item)
                      setCurrentStep('review')
                    }}
                    className="w-full text-left p-3 rounded-lg bg-white/5 border border-purple-500/10 hover:bg-white/10 hover:border-purple-500/20 transition-all"
                  >
                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                      <span className="capitalize">{item.type}</span>
                      <span>•</span>
                      <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-sm text-white line-clamp-1">{item.content}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

// Real AI generation functions using API endpoints

async function generateTextContent(prompt: string, tone: string, platform: string): Promise<string> {
  try {
    const response = await fetch('/api/ai/generate-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userPrompt: prompt,
        platform,
        tone,
        optimize: true,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to generate text content')
    }

    const data = await response.json()
    return data.generatedPrompt || data.prompt || prompt
  } catch (error) {
    console.error('Text generation error:', error)
    return `Error generating content: ${error instanceof Error ? error.message : 'Unknown error'}`
  }
}

async function generateImageContent(prompt: string, style: string, aspectRatio: string): Promise<string> {
  try {
    const response = await fetch('/api/ai/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        model: 'gemini-2.5-flash-image',
        aspectRatio,
        numberOfImages: 1,
        stylePreset: style,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to generate image')
    }

    const data = await response.json()
    return data.images?.[0]?.url || data.images?.[0]?.base64 || ''
  } catch (error) {
    console.error('Image generation error:', error)
    return ''
  }
}

async function generateVideoContent(prompt: string, duration: number, quality: string): Promise<string> {
  try {
    const response = await fetch('/api/ai/generate-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        resolution: quality === 'high' ? '1080p' : '720p',
        duration,
        aspectRatio: '16:9',
        style: 'cinematic',
        withAudio: false,
        fps: 30,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to generate video')
    }

    const data = await response.json()
    return data.video?.url || ''
  } catch (error) {
    console.error('Video generation error:', error)
    return ''
  }
}
