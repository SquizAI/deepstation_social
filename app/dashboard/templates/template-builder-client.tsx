'use client'

import { useState } from 'react'
import { TemplateRegistry } from '@/lib/templates/registry'
import type { EventTemplateConfig, TemplateSectionConfig } from '@/lib/templates/types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Loader2, Check, ChevronRight, Sparkles } from 'lucide-react'

type WizardStep = 'select' | 'configure' | 'generate' | 'preview'

export function TemplateBuilderClient() {
  const [currentStep, setCurrentStep] = useState<WizardStep>('select')
  const [selectedTemplate, setSelectedTemplate] = useState<EventTemplateConfig | null>(null)
  const [customizedTemplate, setCustomizedTemplate] = useState<EventTemplateConfig | null>(null)
  const [generatedContent, setGeneratedContent] = useState<any>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  // Form state for AI generation
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [targetAudience, setTargetAudience] = useState('')
  const [duration, setDuration] = useState(60)
  const [isFree, setIsFree] = useState(true)
  const [locationType, setLocationType] = useState<'online' | 'in-person' | 'hybrid'>('online')
  const [tone, setTone] = useState<'professional' | 'casual' | 'enthusiastic' | 'formal'>('professional')

  const publicTemplates = TemplateRegistry.getPublicTemplates()

  const steps: Array<{ id: WizardStep; label: string; description: string }> = [
    { id: 'select', label: 'Select Template', description: 'Choose a starting point' },
    { id: 'configure', label: 'Configure', description: 'Customize sections & theme' },
    { id: 'generate', label: 'Generate Content', description: 'AI-powered content creation' },
    { id: 'preview', label: 'Preview & Publish', description: 'Review and deploy' },
  ]

  const stepIndex = steps.findIndex((s) => s.id === currentStep)

  const handleSelectTemplate = (template: EventTemplateConfig) => {
    setSelectedTemplate(template)
    setCustomizedTemplate({ ...template })
    setCurrentStep('configure')
  }

  const handleToggleSection = (sectionIndex: number) => {
    if (!customizedTemplate) return

    const updatedSections = [...customizedTemplate.sections]
    updatedSections[sectionIndex] = {
      ...updatedSections[sectionIndex],
      enabled: !updatedSections[sectionIndex].enabled,
    }

    setCustomizedTemplate({
      ...customizedTemplate,
      sections: updatedSections,
    })
  }

  const handleUpdateTheme = (key: keyof EventTemplateConfig['theme'], value: string) => {
    if (!customizedTemplate) return

    setCustomizedTemplate({
      ...customizedTemplate,
      theme: {
        ...customizedTemplate.theme,
        [key]: value,
      },
    })
  }

  const handleGenerateContent = async () => {
    if (!customizedTemplate || !title) return

    setIsGenerating(true)

    try {
      const response = await fetch('/api/templates/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: customizedTemplate.type,
          title,
          description,
          target_audience: targetAudience,
          duration_minutes: duration,
          is_free: isFree,
          location_type: locationType,
          tone,
          generate_sections: ['benefits', 'faq'],
          include_social_copy: true,
        }),
      })

      if (!response.ok) throw new Error('Generation failed')

      const data = await response.json()
      setGeneratedContent(data.generated_content)
      setCurrentStep('preview')
    } catch (error) {
      console.error('Generation error:', error)
      alert('Failed to generate content. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-fuchsia-500 to-purple-600 bg-clip-text text-transparent">
                Template Builder
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Create stunning event templates with AI-powered content generation
              </p>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center gap-4">
            {steps.map((step, index) => {
              const isActive = index === stepIndex
              const isCompleted = index < stepIndex
              const isDisabled = index > stepIndex && !customizedTemplate

              return (
                <div key={step.id} className="flex items-center gap-4 flex-1">
                  <div
                    className={`flex items-center gap-3 flex-1 p-3 rounded-lg border transition-all ${
                      isActive
                        ? 'border-fuchsia-500 bg-fuchsia-500/10'
                        : isCompleted
                        ? 'border-green-500 bg-green-500/10'
                        : 'border-border bg-card/50'
                    } ${isDisabled ? 'opacity-50' : 'cursor-pointer'}`}
                    onClick={() => !isDisabled && setCurrentStep(step.id)}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        isActive
                          ? 'bg-fuchsia-500 text-white'
                          : isCompleted
                          ? 'bg-green-500 text-white'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {isCompleted ? <Check className="w-4 h-4" /> : index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm">{step.label}</div>
                      <div className="text-xs text-muted-foreground">{step.description}</div>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Step 1: Select Template */}
        {currentStep === 'select' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Choose Your Starting Template</h2>
              <p className="text-muted-foreground">
                Select a pre-built template to customize, or start from scratch
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {publicTemplates.map((template) => (
                <Card
                  key={template.id}
                  className="p-6 cursor-pointer hover:border-fuchsia-500 transition-all group"
                  onClick={() => handleSelectTemplate(template)}
                >
                  <div className="mb-4">
                    <div className="w-full h-32 rounded-lg bg-gradient-to-br from-fuchsia-500/20 to-purple-600/20 mb-4 flex items-center justify-center">
                      <Sparkles className="w-12 h-12 text-fuchsia-500" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 group-hover:text-fuchsia-500 transition-colors">
                      {template.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {template.description}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{template.type}</Badge>
                      <Badge variant="secondary">
                        {template.sections.length} sections
                      </Badge>
                    </div>
                    {template.ai_config?.auto_generate_benefits && (
                      <Badge variant="default" className="bg-gradient-to-r from-fuchsia-500 to-purple-600">
                        <Sparkles className="w-3 h-3 mr-1" />
                        AI-Powered
                      </Badge>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Configure */}
        {currentStep === 'configure' && customizedTemplate && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-2">Configure Your Template</h2>
              <p className="text-muted-foreground">
                Customize sections, theme colors, and layout
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Sections Configuration */}
              <Card className="p-6">
                <h3 className="text-lg font-bold mb-4">Template Sections</h3>
                <div className="space-y-3">
                  {customizedTemplate.sections.map((section, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">
                          {section.type === 'hero' && '🎯'}
                          {section.type === 'about' && '📝'}
                          {section.type === 'speakers' && '🎤'}
                          {section.type === 'benefits' && '✨'}
                          {section.type === 'agenda' && '📅'}
                          {section.type === 'faq' && '❓'}
                          {section.type === 'pricing' && '💰'}
                          {section.type === 'registration' && '🎫'}
                          {section.type === 'sponsors' && '🏢'}
                        </div>
                        <div>
                          <div className="font-semibold capitalize">
                            {section.type}
                          </div>
                          {section.ai_generated && (
                            <div className="text-xs text-fuchsia-500 flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              AI Generated
                            </div>
                          )}
                        </div>
                      </div>
                      <Switch
                        checked={section.enabled}
                        onCheckedChange={() => handleToggleSection(index)}
                      />
                    </div>
                  ))}
                </div>
              </Card>

              {/* Theme Configuration */}
              <Card className="p-6">
                <h3 className="text-lg font-bold mb-4">Theme Customization</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="primaryColor">Primary Color</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        id="primaryColor"
                        type="color"
                        value={customizedTemplate.theme.primaryColor}
                        onChange={(e) => handleUpdateTheme('primaryColor', e.target.value)}
                        className="w-20 h-10"
                      />
                      <Input
                        value={customizedTemplate.theme.primaryColor}
                        onChange={(e) => handleUpdateTheme('primaryColor', e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="secondaryColor">Secondary Color</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        id="secondaryColor"
                        type="color"
                        value={customizedTemplate.theme.secondaryColor}
                        onChange={(e) => handleUpdateTheme('secondaryColor', e.target.value)}
                        className="w-20 h-10"
                      />
                      <Input
                        value={customizedTemplate.theme.secondaryColor}
                        onChange={(e) => handleUpdateTheme('secondaryColor', e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="backgroundColor">Background Color</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        id="backgroundColor"
                        type="color"
                        value={customizedTemplate.theme.backgroundColor}
                        onChange={(e) => handleUpdateTheme('backgroundColor', e.target.value)}
                        className="w-20 h-10"
                      />
                      <Input
                        value={customizedTemplate.theme.backgroundColor}
                        onChange={(e) => handleUpdateTheme('backgroundColor', e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="fontFamily">Font Family</Label>
                    <Select
                      value={customizedTemplate.theme.fontFamily}
                      onValueChange={(value) => handleUpdateTheme('fontFamily', value)}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">
                          System Default
                        </SelectItem>
                        <SelectItem value="'Inter', sans-serif">Inter</SelectItem>
                        <SelectItem value="'Poppins', sans-serif">Poppins</SelectItem>
                        <SelectItem value="'Playfair Display', serif">Playfair Display</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </Card>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={() => setCurrentStep('generate')}
                className="bg-gradient-to-r from-fuchsia-500 to-purple-600"
              >
                Next: Generate Content
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Generate Content */}
        {currentStep === 'generate' && customizedTemplate && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-2">Generate AI-Powered Content</h2>
              <p className="text-muted-foreground">
                Let AI create compelling content for your event
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="p-6 space-y-4">
                <h3 className="text-lg font-bold">Event Details</h3>

                <div>
                  <Label htmlFor="title">Event Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., AI Workflow Automation Workshop"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of your event..."
                    className="mt-2"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="targetAudience">Target Audience</Label>
                  <Input
                    id="targetAudience"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    placeholder="e.g., developers and product managers"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="mt-2"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="isFree">Free Event</Label>
                  <Switch
                    id="isFree"
                    checked={isFree}
                    onCheckedChange={setIsFree}
                  />
                </div>

                <div>
                  <Label htmlFor="locationType">Location Type</Label>
                  <Select
                    value={locationType}
                    onValueChange={(value: any) => setLocationType(value)}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="in-person">In-Person</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="tone">Content Tone</Label>
                  <Select
                    value={tone}
                    onValueChange={(value: any) => setTone(value)}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                      <SelectItem value="formal">Formal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-bold mb-4">What Will Be Generated</h3>
                <div className="space-y-3">
                  {customizedTemplate.ai_config?.auto_generate_benefits && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-fuchsia-500/10 border border-fuchsia-500/20">
                      <Sparkles className="w-5 h-5 text-fuchsia-500 mt-0.5" />
                      <div>
                        <div className="font-semibold">Event Benefits</div>
                        <div className="text-sm text-muted-foreground">
                          4 key benefits highlighting what attendees will gain
                        </div>
                      </div>
                    </div>
                  )}

                  {customizedTemplate.ai_config?.auto_generate_faq && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-fuchsia-500/10 border border-fuchsia-500/20">
                      <Sparkles className="w-5 h-5 text-fuchsia-500 mt-0.5" />
                      <div>
                        <div className="font-semibold">FAQ Section</div>
                        <div className="text-sm text-muted-foreground">
                          Common questions and answers tailored to your event
                        </div>
                      </div>
                    </div>
                  )}

                  {customizedTemplate.ai_config?.auto_generate_social_posts && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-fuchsia-500/10 border border-fuchsia-500/20">
                      <Sparkles className="w-5 h-5 text-fuchsia-500 mt-0.5" />
                      <div>
                        <div className="font-semibold">Social Media Posts</div>
                        <div className="text-sm text-muted-foreground">
                          Platform-optimized posts for LinkedIn, Twitter, and Instagram
                        </div>
                      </div>
                    </div>
                  )}

                  {customizedTemplate.ai_config?.auto_generate_description && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-fuchsia-500/10 border border-fuchsia-500/20">
                      <Sparkles className="w-5 h-5 text-fuchsia-500 mt-0.5" />
                      <div>
                        <div className="font-semibold">Hero Content</div>
                        <div className="text-sm text-muted-foreground">
                          Compelling title, subtitle, and description
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleGenerateContent}
                  disabled={!title || isGenerating}
                  className="w-full mt-6 bg-gradient-to-r from-fuchsia-500 to-purple-600"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating Content...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Content
                    </>
                  )}
                </Button>
              </Card>
            </div>
          </div>
        )}

        {/* Step 4: Preview & Publish */}
        {currentStep === 'preview' && generatedContent && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-2">Preview & Publish</h2>
              <p className="text-muted-foreground">
                Review your generated content and publish your template
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {generatedContent.benefits && (
                <Card className="p-6">
                  <h3 className="text-lg font-bold mb-4">Generated Benefits</h3>
                  <div className="space-y-4">
                    {generatedContent.benefits.map((benefit: any, index: number) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="text-2xl">{benefit.icon}</div>
                        <div>
                          <div className="font-semibold">{benefit.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {benefit.description}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {generatedContent.faqs && (
                <Card className="p-6">
                  <h3 className="text-lg font-bold mb-4">Generated FAQs</h3>
                  <div className="space-y-4">
                    {generatedContent.faqs.map((faq: any, index: number) => (
                      <div key={index}>
                        <div className="font-semibold mb-1">{faq.question}</div>
                        <div className="text-sm text-muted-foreground">{faq.answer}</div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {generatedContent.hero_content && (
                <Card className="p-6 lg:col-span-2">
                  <h3 className="text-lg font-bold mb-4">Hero Content</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Title</div>
                      <div className="text-2xl font-bold">
                        {generatedContent.hero_content.title}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Subtitle</div>
                      <div className="text-lg">
                        {generatedContent.hero_content.subtitle}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Description</div>
                      <div className="text-muted-foreground">
                        {generatedContent.hero_content.description}
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {generatedContent.social_posts && (
                <Card className="p-6 lg:col-span-2">
                  <h3 className="text-lg font-bold mb-4">Social Media Posts</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {generatedContent.social_posts.linkedin && (
                      <div>
                        <div className="text-sm font-semibold mb-2 flex items-center gap-2">
                          <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white text-xs">
                            in
                          </div>
                          LinkedIn
                        </div>
                        <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {generatedContent.social_posts.linkedin}
                        </div>
                      </div>
                    )}
                    {generatedContent.social_posts.twitter && (
                      <div>
                        <div className="text-sm font-semibold mb-2 flex items-center gap-2">
                          <div className="w-8 h-8 rounded bg-black flex items-center justify-center text-white text-xs">
                            𝕏
                          </div>
                          Twitter/X
                        </div>
                        <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {generatedContent.social_posts.twitter}
                        </div>
                      </div>
                    )}
                    {generatedContent.social_posts.instagram && (
                      <div>
                        <div className="text-sm font-semibold mb-2 flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 flex items-center justify-center text-white text-xs">
                            IG
                          </div>
                          Instagram
                        </div>
                        <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {generatedContent.social_posts.instagram}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </div>

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentStep('generate')}
              >
                Regenerate Content
              </Button>
              <Button className="bg-gradient-to-r from-fuchsia-500 to-purple-600">
                <Check className="w-4 h-4 mr-2" />
                Publish Template
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
