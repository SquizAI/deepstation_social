'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'

interface PostIdea {
  id: string
  title: string
  description: string
  content: string
  hashtags: string[]
  targetPlatforms: string[]
  reasoning: string
  engagementPrediction: 'high' | 'medium' | 'low'
}

interface AIPostSuggestionsProps {
  isOpen: boolean
  onClose: () => void
  onUseIdea: (content: string, hashtags: string[]) => void
  userIndustry?: string
  selectedPlatforms?: string[]
}

export function AIPostSuggestions({
  isOpen,
  onClose,
  onUseIdea,
  userIndustry = 'Technology',
  selectedPlatforms = []
}: AIPostSuggestionsProps) {
  const [isGenerating, setIsGenerating] = React.useState(false)
  const [ideas, setIdeas] = React.useState<PostIdea[]>([])
  const [selectedIdea, setSelectedIdea] = React.useState<PostIdea | null>(null)
  const [refinementPrompt, setRefinementPrompt] = React.useState('')
  const [isRefining, setIsRefining] = React.useState(false)
  const supabase = createClient()

  React.useEffect(() => {
    if (isOpen && ideas.length === 0) {
      generateIdeas()
    }
  }, [isOpen])

  const generateIdeas = async () => {
    setIsGenerating(true)
    try {
      // Fetch user's recent successful posts for context
      const { data: { user } } = await supabase.auth.getUser()

      let recentPosts = []
      if (user) {
        const { data } = await supabase
          .from('scheduled_posts')
          .select('content, platforms, created_at')
          .eq('user_id', user.id)
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .limit(5)

        recentPosts = data || []
      }

      // Get current trends (simplified - in production, integrate with trending APIs)
      const currentDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })

      // Generate post ideas using AI
      const response = await fetch('/api/ai/generate-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userPrompt: `Generate 3 unique, engaging social media post ideas for ${userIndustry} industry.

Context:
- Today's date: ${currentDate}
- Target platforms: ${selectedPlatforms.join(', ') || 'LinkedIn, Instagram, Twitter, Discord'}
- Recent successful posts: ${JSON.stringify(recentPosts.slice(0, 2))}

For each idea, provide:
1. A catchy title
2. Brief description (1-2 sentences)
3. Full post content (adaptable to multiple platforms)
4. 5-10 relevant hashtags
5. Best target platforms
6. Why this idea will perform well
7. Engagement prediction (high/medium/low)

Format as JSON array with objects containing: title, description, content, hashtags, targetPlatforms, reasoning, engagementPrediction`,
          optimize: true,
        })
      })

      if (!response.ok) throw new Error('Failed to generate ideas')

      const data = await response.json()
      const generatedText = data.generatedPrompt || data.prompt || ''

      // Parse AI response (expecting JSON)
      try {
        // Try to extract JSON from response
        const jsonMatch = generatedText.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          const parsedIdeas = JSON.parse(jsonMatch[0])
          setIdeas(parsedIdeas.map((idea: any, index: number) => ({
            ...idea,
            id: `idea-${Date.now()}-${index}`
          })))
        } else {
          // Fallback: create structured ideas from text
          setIdeas(createFallbackIdeas(generatedText))
        }
      } catch (parseError) {
        console.error('Parse error:', parseError)
        setIdeas(createFallbackIdeas(generatedText))
      }
    } catch (error) {
      console.error('Error generating ideas:', error)
      setIdeas(createFallbackIdeas(''))
    } finally {
      setIsGenerating(false)
    }
  }

  const createFallbackIdeas = (text: string): PostIdea[] => {
    return [
      {
        id: 'fallback-1',
        title: 'Share Industry Insights',
        description: 'Share valuable insights about recent developments in your industry',
        content: text || 'Share your expertise and thought leadership on emerging trends in your field.',
        hashtags: ['#Industry', '#Insights', '#ThoughtLeadership'],
        targetPlatforms: selectedPlatforms.length > 0 ? selectedPlatforms : ['linkedin'],
        reasoning: 'Thought leadership posts typically perform well and establish credibility',
        engagementPrediction: 'high' as const
      },
      {
        id: 'fallback-2',
        title: 'Behind the Scenes',
        description: 'Give your audience a peek behind the curtain',
        content: 'Take your audience on a journey behind the scenes of your work. Share your process, challenges, and wins.',
        hashtags: ['#BehindTheScenes', '#Transparency', '#Community'],
        targetPlatforms: selectedPlatforms.length > 0 ? selectedPlatforms : ['instagram'],
        reasoning: 'Authentic, personal content builds stronger connections with your audience',
        engagementPrediction: 'medium' as const
      },
      {
        id: 'fallback-3',
        title: 'Ask Your Audience',
        description: 'Start a conversation with an engaging question',
        content: 'What\'s the biggest challenge you\'re facing right now? Let\'s discuss in the comments!',
        hashtags: ['#Community', '#Discussion', '#LetsTalk'],
        targetPlatforms: selectedPlatforms.length > 0 ? selectedPlatforms : ['twitter'],
        reasoning: 'Questions drive engagement and comments, boosting algorithmic reach',
        engagementPrediction: 'high' as const
      }
    ]
  }

  const refineIdea = async () => {
    if (!selectedIdea || !refinementPrompt.trim()) return

    setIsRefining(true)
    try {
      const response = await fetch('/api/ai/generate-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userPrompt: `Refine this post idea based on user feedback:

Original Idea: ${selectedIdea.content}
User Refinement Request: ${refinementPrompt}

Provide the refined version as JSON with: title, description, content, hashtags, targetPlatforms, reasoning, engagementPrediction`,
          optimize: true,
        })
      })

      if (!response.ok) throw new Error('Failed to refine idea')

      const data = await response.json()
      const refinedText = data.generatedPrompt || data.prompt || ''

      // Try to parse refined idea
      try {
        const jsonMatch = refinedText.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const refined = JSON.parse(jsonMatch[0])
          const refinedIdea = {
            ...refined,
            id: `refined-${Date.now()}`
          }
          setSelectedIdea(refinedIdea)
          setIdeas(prev => [refinedIdea, ...prev])
          setRefinementPrompt('')
        } else {
          // Update content only
          setSelectedIdea({
            ...selectedIdea,
            content: refinedText
          })
        }
      } catch (parseError) {
        console.error('Parse error:', parseError)
        setSelectedIdea({
          ...selectedIdea,
          content: refinedText
        })
      }
    } catch (error) {
      console.error('Error refining idea:', error)
    } finally {
      setIsRefining(false)
    }
  }

  const handleUseIdea = (idea: PostIdea) => {
    onUseIdea(idea.content, idea.hashtags)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <Card className="bg-slate-900/95 backdrop-blur-md border border-purple-500/20 shadow-2xl">
          {/* Header */}
          <div className="p-6 border-b border-purple-500/20">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">AI Post Ideas</h2>
                <p className="text-slate-400 text-sm mt-1">
                  Get AI-powered suggestions based on trends and your audience
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

            {/* Action Bar */}
            <div className="flex gap-3 mt-4">
              <Button
                onClick={generateIdeas}
                disabled={isGenerating}
                className="bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white hover:from-purple-600 hover:to-fuchsia-600"
              >
                {isGenerating ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Generating Ideas...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh Ideas
                  </span>
                )}
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {ideas.length === 0 && !isGenerating ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">💡</div>
                <p className="text-slate-400">Click "Refresh Ideas" to generate new post suggestions</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Ideas List */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Suggested Ideas</h3>

                  {isGenerating ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="animate-pulse bg-white/5 rounded-lg p-4 border border-purple-500/10">
                          <div className="h-4 bg-white/10 rounded w-3/4 mb-3"></div>
                          <div className="h-3 bg-white/10 rounded w-full mb-2"></div>
                          <div className="h-3 bg-white/10 rounded w-5/6"></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    ideas.map(idea => (
                      <button
                        key={idea.id}
                        onClick={() => setSelectedIdea(idea)}
                        className={`w-full text-left p-4 rounded-lg border transition-all ${
                          selectedIdea?.id === idea.id
                            ? 'bg-purple-500/20 border-purple-500/50'
                            : 'bg-white/5 border-purple-500/10 hover:bg-white/10 hover:border-purple-500/30'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-white">{idea.title}</h4>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            idea.engagementPrediction === 'high'
                              ? 'bg-green-500/20 text-green-400'
                              : idea.engagementPrediction === 'medium'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-slate-500/20 text-slate-400'
                          }`}>
                            {idea.engagementPrediction}
                          </span>
                        </div>
                        <p className="text-sm text-slate-400 mb-3">{idea.description}</p>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {idea.targetPlatforms.slice(0, 3).map(platform => (
                            <span key={platform} className="px-2 py-0.5 bg-purple-500/10 text-purple-400 text-xs rounded">
                              {platform}
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-slate-500 italic">{idea.reasoning}</p>
                      </button>
                    ))
                  )}
                </div>

                {/* Selected Idea Details */}
                <div className="lg:sticky lg:top-6 space-y-4">
                  {selectedIdea ? (
                    <>
                      <div className="bg-white/5 border border-purple-500/20 rounded-lg p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-white mb-1">
                              {selectedIdea.title}
                            </h3>
                            <p className="text-sm text-slate-400">{selectedIdea.description}</p>
                          </div>
                        </div>

                        {/* Content Preview */}
                        <div className="mb-4">
                          <label className="text-sm font-medium text-slate-300 mb-2 block">
                            Post Content
                          </label>
                          <Textarea
                            value={selectedIdea.content}
                            readOnly
                            rows={8}
                            className="w-full bg-white/5 border-purple-500/20 text-white resize-none"
                          />
                        </div>

                        {/* Hashtags */}
                        <div className="mb-4">
                          <label className="text-sm font-medium text-slate-300 mb-2 block">
                            Suggested Hashtags
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {selectedIdea.hashtags.map((tag, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-fuchsia-500/20 text-fuchsia-400 text-sm rounded border border-fuchsia-500/30"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Platforms */}
                        <div className="mb-4">
                          <label className="text-sm font-medium text-slate-300 mb-2 block">
                            Best For
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {selectedIdea.targetPlatforms.map(platform => (
                              <span
                                key={platform}
                                className="px-3 py-1 bg-purple-500/20 text-purple-300 text-sm rounded-full border border-purple-500/30 capitalize"
                              >
                                {platform}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-4 border-t border-purple-500/20">
                          <Button
                            onClick={() => handleUseIdea(selectedIdea)}
                            className="flex-1 bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white hover:from-purple-600 hover:to-fuchsia-600"
                          >
                            Use This Idea
                          </Button>
                        </div>
                      </div>

                      {/* Refinement Section */}
                      <div className="bg-white/5 border border-purple-500/20 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-white mb-3">Refine This Idea</h4>
                        <Textarea
                          value={refinementPrompt}
                          onChange={(e) => setRefinementPrompt(e.target.value)}
                          placeholder="E.g., Make it more casual, add statistics, focus on benefits..."
                          rows={3}
                          className="w-full bg-white/5 border-purple-500/20 text-white mb-3"
                        />
                        <Button
                          onClick={refineIdea}
                          disabled={!refinementPrompt.trim() || isRefining}
                          className="w-full bg-white/10 border border-purple-500/30 text-white hover:bg-white/20"
                        >
                          {isRefining ? 'Refining...' : 'Refine Idea'}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="bg-white/5 border border-purple-500/20 rounded-lg p-12 text-center">
                      <div className="text-4xl mb-3">👈</div>
                      <p className="text-slate-400">Select an idea to view details</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
