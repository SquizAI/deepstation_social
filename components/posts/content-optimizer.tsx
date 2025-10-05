'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { PostContent } from './post-editor'

interface OptimizationSuggestion {
  type: 'hashtag' | 'emoji' | 'structure' | 'cta' | 'readability' | 'length'
  severity: 'error' | 'warning' | 'info'
  message: string
  suggestion: string
  autoFix?: () => void
}

interface PlatformOptimization {
  platform: keyof PostContent
  score: number
  suggestions: OptimizationSuggestion[]
  optimizedContent?: string
}

interface ContentOptimizerProps {
  isOpen: boolean
  onClose: () => void
  content: PostContent
  onApplyOptimization: (platform: keyof PostContent, optimizedContent: string) => void
}

export function ContentOptimizer({
  isOpen,
  onClose,
  content,
  onApplyOptimization
}: ContentOptimizerProps) {
  const [isAnalyzing, setIsAnalyzing] = React.useState(false)
  const [optimizations, setOptimizations] = React.useState<PlatformOptimization[]>([])
  const [selectedPlatform, setSelectedPlatform] = React.useState<keyof PostContent>('linkedin')
  const [isOptimizing, setIsOptimizing] = React.useState(false)

  React.useEffect(() => {
    if (isOpen) {
      analyzeContent()
    }
  }, [isOpen, content])

  const analyzeContent = async () => {
    setIsAnalyzing(true)
    try {
      const platforms: (keyof PostContent)[] = ['linkedin', 'instagram', 'twitter', 'discord']
      const analyses: PlatformOptimization[] = []

      for (const platform of platforms) {
        const text = content[platform]
        if (!text || text.trim().length === 0) continue

        const suggestions: OptimizationSuggestion[] = []

        // Readability analysis
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
        const words = text.split(/\s+/).filter(w => w.trim().length > 0)
        const avgWordsPerSentence = words.length / Math.max(sentences.length, 1)

        if (avgWordsPerSentence > 25) {
          suggestions.push({
            type: 'readability',
            severity: 'warning',
            message: 'Long sentences detected',
            suggestion: 'Break up long sentences for better readability. Aim for 15-20 words per sentence.'
          })
        }

        // Hashtag analysis
        const hashtags = text.match(/#\w+/g) || []
        const hashtagRules = {
          linkedin: { min: 3, max: 5, ideal: 3 },
          instagram: { min: 10, max: 30, ideal: 20 },
          twitter: { min: 1, max: 3, ideal: 2 },
          discord: { min: 0, max: 2, ideal: 1 }
        }

        const rules = hashtagRules[platform]
        if (hashtags.length < rules.min) {
          suggestions.push({
            type: 'hashtag',
            severity: 'warning',
            message: `Only ${hashtags.length} hashtags found`,
            suggestion: `Add ${rules.ideal - hashtags.length} more relevant hashtags for better discoverability.`
          })
        } else if (hashtags.length > rules.max) {
          suggestions.push({
            type: 'hashtag',
            severity: 'error',
            message: `Too many hashtags (${hashtags.length})`,
            suggestion: `Remove ${hashtags.length - rules.ideal} hashtags. Quality over quantity!`
          })
        }

        // Emoji analysis
        const emojis = text.match(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu) || []

        const emojiRules = {
          linkedin: { ideal: 2, max: 5 },
          instagram: { ideal: 5, max: 15 },
          twitter: { ideal: 2, max: 5 },
          discord: { ideal: 3, max: 10 }
        }

        const emojiRule = emojiRules[platform]
        if (emojis.length === 0 && platform !== 'linkedin') {
          suggestions.push({
            type: 'emoji',
            severity: 'info',
            message: 'No emojis found',
            suggestion: 'Add a few relevant emojis to make your post more engaging and visually appealing.'
          })
        } else if (emojis.length > emojiRule.max) {
          suggestions.push({
            type: 'emoji',
            severity: 'warning',
            message: `Too many emojis (${emojis.length})`,
            suggestion: `Consider reducing to ${emojiRule.ideal} emojis for a more professional look.`
          })
        }

        // Call-to-action analysis
        const ctaPatterns = /\b(click|visit|learn more|sign up|register|join|subscribe|follow|comment|share|dm|message|check out|download|get|buy|shop|watch|read|listen)\b/gi
        const hasCTA = ctaPatterns.test(text)

        if (!hasCTA) {
          suggestions.push({
            type: 'cta',
            severity: 'warning',
            message: 'No clear call-to-action',
            suggestion: 'Add a call-to-action to encourage engagement (e.g., "What do you think? Share in comments!")'
          })
        }

        // Length analysis
        const charLimits = {
          linkedin: { min: 100, ideal: 1500, max: 3000 },
          instagram: { min: 50, ideal: 1000, max: 2200 },
          twitter: { min: 50, ideal: 200, max: 280 },
          discord: { min: 50, ideal: 500, max: 4000 }
        }

        const limits = charLimits[platform]
        if (text.length < limits.min) {
          suggestions.push({
            type: 'length',
            severity: 'warning',
            message: 'Content is too short',
            suggestion: `Consider expanding to at least ${limits.min} characters for better engagement.`
          })
        } else if (text.length > limits.max) {
          suggestions.push({
            type: 'length',
            severity: 'error',
            message: 'Content exceeds platform limit',
            suggestion: `Reduce content to under ${limits.max} characters.`
          })
        }

        // Structure analysis for LinkedIn and Discord
        if (platform === 'linkedin' || platform === 'discord') {
          const hasLineBreaks = text.includes('\n\n')
          if (!hasLineBreaks && text.length > 200) {
            suggestions.push({
              type: 'structure',
              severity: 'info',
              message: 'Consider adding paragraph breaks',
              suggestion: 'Break up long blocks of text with double line breaks for better readability.'
            })
          }
        }

        // Calculate score (0-100)
        const errorCount = suggestions.filter(s => s.severity === 'error').length
        const warningCount = suggestions.filter(s => s.severity === 'warning').length
        const score = Math.max(0, 100 - (errorCount * 20) - (warningCount * 10))

        analyses.push({
          platform,
          score,
          suggestions
        })
      }

      setOptimizations(analyses)
    } catch (error) {
      console.error('Error analyzing content:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const optimizeForPlatform = async (platform: keyof PostContent) => {
    setIsOptimizing(true)
    setSelectedPlatform(platform)

    try {
      const originalContent = content[platform]

      // Get platform-specific optimization rules
      const platformGuidelines = {
        linkedin: 'Professional tone, thought leadership, 3-5 hashtags, focus on business value and insights',
        instagram: 'Visual storytelling, 15-20 hashtags, emojis for personality, engaging hook in first line',
        twitter: 'Concise and punchy, 1-2 hashtags, trending topics, conversational tone',
        discord: 'Community-focused, casual tone, markdown formatting, clear call-to-action'
      }

      const response = await fetch('/api/ai/generate-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userPrompt: `Optimize this social media post for ${platform}.

Original Post:
${originalContent}

Platform Guidelines:
${platformGuidelines[platform]}

Requirements:
1. Maintain the core message and intent
2. Optimize structure and formatting for ${platform}
3. Add appropriate hashtags (if missing)
4. Improve readability and flow
5. Add engaging elements (emojis where appropriate)
6. Include a clear call-to-action
7. Stay within character limit

Return ONLY the optimized post text, ready to publish.`,
          platform,
          optimize: true,
        })
      })

      if (!response.ok) throw new Error('Failed to optimize content')

      const data = await response.json()
      const optimizedContent = data.generatedPrompt || data.prompt || originalContent

      // Update optimizations with the optimized content
      setOptimizations(prev =>
        prev.map(opt =>
          opt.platform === platform
            ? { ...opt, optimizedContent }
            : opt
        )
      )
    } catch (error) {
      console.error('Error optimizing content:', error)
    } finally {
      setIsOptimizing(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    if (score >= 40) return 'Fair'
    return 'Needs Work'
  }

  if (!isOpen) return null

  const currentOptimization = optimizations.find(opt => opt.platform === selectedPlatform)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        <Card className="bg-slate-900/95 backdrop-blur-md border border-purple-500/20 shadow-2xl">
          {/* Header */}
          <div className="p-6 border-b border-purple-500/20">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Content Optimizer</h2>
                <p className="text-slate-400 text-sm mt-1">
                  AI-powered suggestions to improve engagement and reach
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
          </div>

          {/* Content */}
          <div className="p-6">
            {isAnalyzing ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <svg className="animate-spin h-12 w-12 text-purple-500 mx-auto mb-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <p className="text-white font-medium">Analyzing your content...</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Platform Scores */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-white mb-3">Platform Scores</h3>
                  {optimizations.map(opt => (
                    <button
                      key={opt.platform}
                      onClick={() => setSelectedPlatform(opt.platform)}
                      className={`w-full p-4 rounded-lg border transition-all ${
                        selectedPlatform === opt.platform
                          ? 'bg-purple-500/20 border-purple-500/50'
                          : 'bg-white/5 border-purple-500/10 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-medium capitalize">{opt.platform}</span>
                        <span className={`text-2xl font-bold ${getScoreColor(opt.score)}`}>
                          {opt.score}
                        </span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2 mb-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            opt.score >= 80 ? 'bg-green-500' :
                            opt.score >= 60 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${opt.score}%` }}
                        />
                      </div>
                      <p className={`text-xs ${getScoreColor(opt.score)}`}>
                        {getScoreLabel(opt.score)} - {opt.suggestions.length} suggestions
                      </p>
                    </button>
                  ))}
                </div>

                {/* Suggestions and Optimization */}
                <div className="lg:col-span-2 space-y-4">
                  {currentOptimization ? (
                    <>
                      {/* Suggestions */}
                      <div className="bg-white/5 border border-purple-500/20 rounded-lg p-4">
                        <h3 className="text-sm font-semibold text-white mb-3">
                          Suggestions for {currentOptimization.platform}
                        </h3>
                        <div className="space-y-2">
                          {currentOptimization.suggestions.length === 0 ? (
                            <p className="text-sm text-green-400">
                              Perfect! No suggestions needed.
                            </p>
                          ) : (
                            currentOptimization.suggestions.map((suggestion, idx) => (
                              <div
                                key={idx}
                                className={`p-3 rounded-lg border ${
                                  suggestion.severity === 'error'
                                    ? 'bg-red-500/10 border-red-500/30'
                                    : suggestion.severity === 'warning'
                                    ? 'bg-yellow-500/10 border-yellow-500/30'
                                    : 'bg-blue-500/10 border-blue-500/30'
                                }`}
                              >
                                <div className="flex items-start gap-2">
                                  <span className="text-lg">
                                    {suggestion.type === 'hashtag' && '🏷️'}
                                    {suggestion.type === 'emoji' && '😊'}
                                    {suggestion.type === 'structure' && '📝'}
                                    {suggestion.type === 'cta' && '📣'}
                                    {suggestion.type === 'readability' && '📖'}
                                    {suggestion.type === 'length' && '📏'}
                                  </span>
                                  <div className="flex-1">
                                    <p className={`text-sm font-medium ${
                                      suggestion.severity === 'error' ? 'text-red-300' :
                                      suggestion.severity === 'warning' ? 'text-yellow-300' :
                                      'text-blue-300'
                                    }`}>
                                      {suggestion.message}
                                    </p>
                                    <p className="text-xs text-slate-400 mt-1">
                                      {suggestion.suggestion}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* AI Optimization */}
                      <div className="bg-white/5 border border-purple-500/20 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-semibold text-white">
                            AI Optimization
                          </h3>
                          <Button
                            onClick={() => optimizeForPlatform(currentOptimization.platform)}
                            disabled={isOptimizing}
                            size="sm"
                            className="bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white hover:from-purple-600 hover:to-fuchsia-600"
                          >
                            {isOptimizing ? 'Optimizing...' : 'Optimize with AI'}
                          </Button>
                        </div>

                        {currentOptimization.optimizedContent ? (
                          <div className="space-y-3">
                            <div className="bg-slate-800/50 rounded-lg p-4 border border-purple-500/10">
                              <p className="text-white text-sm whitespace-pre-wrap">
                                {currentOptimization.optimizedContent}
                              </p>
                            </div>
                            <Button
                              onClick={() => {
                                onApplyOptimization(
                                  currentOptimization.platform,
                                  currentOptimization.optimizedContent!
                                )
                                onClose()
                              }}
                              className="w-full bg-green-600 hover:bg-green-700 text-white"
                            >
                              Apply Optimized Content
                            </Button>
                          </div>
                        ) : (
                          <p className="text-sm text-slate-400">
                            Click "Optimize with AI" to get an improved version of your post tailored for {currentOptimization.platform}.
                          </p>
                        )}
                      </div>

                      {/* Engagement Prediction */}
                      <div className="bg-gradient-to-r from-purple-500/10 to-fuchsia-500/10 border border-purple-500/30 rounded-lg p-4">
                        <h3 className="text-sm font-semibold text-white mb-2">
                          Engagement Prediction
                        </h3>
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-2xl">
                                {currentOptimization.score >= 80 ? '🚀' :
                                 currentOptimization.score >= 60 ? '📈' : '📊'}
                              </span>
                              <span className={`text-lg font-bold ${getScoreColor(currentOptimization.score)}`}>
                                {currentOptimization.score >= 80 ? 'High' :
                                 currentOptimization.score >= 60 ? 'Medium' : 'Low'} Engagement Expected
                              </span>
                            </div>
                            <p className="text-xs text-slate-400">
                              Based on content analysis and platform best practices
                            </p>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center py-12">
                      <p className="text-slate-400">Select a platform to view suggestions</p>
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
