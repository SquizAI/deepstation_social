'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'

interface Template {
  id: string
  name: string
  description: string | null
  thumbnail_url: string | null
  category: string
  is_default: boolean
  html_content: string
}

interface TemplateGalleryProps {
  onSelectTemplate: (templateId: string) => void
}

export function TemplateGallery({ onSelectTemplate }: TemplateGalleryProps) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null)

  const supabase = createClient()

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('email_templates')
      .select('*')
      .order('is_default', { ascending: false })
      .order('name')

    if (data) {
      setTemplates(data)
    }
    setLoading(false)
  }

  const categories = [
    { id: 'all', name: 'All Templates', icon: '📧' },
    { id: 'newsletter', name: 'Newsletter', icon: '📰' },
    { id: 'announcement', name: 'Announcement', icon: '📢' },
    { id: 'event', name: 'Event', icon: '🎉' },
    { id: 'product', name: 'Product', icon: '🚀' },
    { id: 'promotional', name: 'Promotional', icon: '🔥' },
    { id: 'custom', name: 'Custom', icon: '✨' },
  ]

  const filteredTemplates = templates.filter((template) => {
    if (selectedCategory === 'all') return true
    return template.category === selectedCategory
  })

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      newsletter: 'from-blue-500 to-cyan-600',
      announcement: 'from-purple-500 to-pink-600',
      event: 'from-fuchsia-500 to-purple-600',
      product: 'from-indigo-500 to-purple-600',
      promotional: 'from-orange-500 to-red-600',
      custom: 'from-gray-500 to-gray-700',
    }
    return colors[category] || 'from-gray-500 to-gray-700'
  }

  const getTemplateThumbnail = (category: string) => {
    // Generate SVG thumbnails for templates
    const thumbnails: Record<string, string> = {
      newsletter: `
        <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
          <rect width="400" height="300" fill="#f8f9fa"/>
          <rect width="400" height="80" fill="url(#grad1)"/>
          <text x="200" y="50" font-size="24" fill="white" text-anchor="middle" font-weight="bold">Newsletter</text>
          <rect x="30" y="110" width="340" height="8" rx="4" fill="#e0e0e0"/>
          <rect x="30" y="130" width="280" height="8" rx="4" fill="#e0e0e0"/>
          <rect x="30" y="150" width="320" height="8" rx="4" fill="#e0e0e0"/>
          <rect x="30" y="170" width="260" height="8" rx="4" fill="#e0e0e0"/>
          <rect width="400" height="50" y="250" fill="#f0f0f0"/>
          <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#d946ef;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#9333ea;stop-opacity:1" />
            </linearGradient>
          </defs>
        </svg>
      `,
      announcement: `
        <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
          <rect width="400" height="300" fill="#f8f9fa"/>
          <rect width="400" height="100" fill="url(#grad2)"/>
          <text x="200" y="50" font-size="32" text-anchor="middle">📢</text>
          <text x="200" y="85" font-size="18" fill="white" text-anchor="middle" font-weight="bold">Announcement</text>
          <rect x="50" y="140" width="300" height="12" rx="6" fill="#333"/>
          <rect x="60" y="170" width="280" height="8" rx="4" fill="#e0e0e0"/>
          <rect x="60" y="190" width="260" height="8" rx="4" fill="#e0e0e0"/>
          <rect x="60" y="210" width="240" height="8" rx="4" fill="#e0e0e0"/>
          <defs>
            <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#9333ea;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#7e22ce;stop-opacity:1" />
            </linearGradient>
          </defs>
        </svg>
      `,
      event: `
        <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
          <rect width="400" height="300" fill="#f8f9fa"/>
          <rect width="400" height="90" fill="url(#grad3)"/>
          <text x="200" y="50" font-size="40" text-anchor="middle">🎉</text>
          <rect x="80" y="120" width="240" height="14" rx="7" fill="#333"/>
          <rect x="100" y="150" width="200" height="8" rx="4" fill="#e0e0e0"/>
          <rect x="100" y="170" width="200" height="8" rx="4" fill="#e0e0e0"/>
          <rect x="150" y="200" width="100" height="35" rx="8" fill="url(#grad3)"/>
          <defs>
            <linearGradient id="grad3" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#d946ef;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#9333ea;stop-opacity:1" />
            </linearGradient>
          </defs>
        </svg>
      `,
      product: `
        <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
          <rect width="400" height="300" fill="#1a1a2e"/>
          <rect width="400" height="70" fill="#1a1a2e"/>
          <text x="200" y="35" font-size="28" fill="white" text-anchor="middle" font-weight="bold">🚀 New Product</text>
          <text x="200" y="60" font-size="14" fill="#d946ef" text-anchor="middle" font-weight="bold">Launch</text>
          <rect x="40" y="100" width="320" height="10" rx="5" fill="#333"/>
          <rect x="50" y="125" width="300" height="6" rx="3" fill="#444"/>
          <rect x="50" y="140" width="280" height="6" rx="3" fill="#444"/>
          <rect x="150" y="170" width="100" height="30" rx="6" fill="url(#grad4)"/>
          <defs>
            <linearGradient id="grad4" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#d946ef;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#9333ea;stop-opacity:1" />
            </linearGradient>
          </defs>
        </svg>
      `,
      promotional: `
        <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
          <rect width="400" height="300" fill="#f8f9fa"/>
          <rect width="400" height="80" fill="url(#grad5)"/>
          <text x="200" y="45" font-size="36" text-anchor="middle">🔥</text>
          <text x="200" y="70" font-size="16" fill="white" text-anchor="middle" font-weight="bold">Special Offer!</text>
          <rect x="80" y="110" width="240" height="16" rx="8" fill="#333"/>
          <rect x="90" y="140" width="220" height="8" rx="4" fill="#e0e0e0"/>
          <rect x="90" y="160" width="220" height="8" rx="4" fill="#e0e0e0"/>
          <rect x="130" y="190" width="140" height="40" rx="8" fill="url(#grad5)"/>
          <text x="200" y="215" font-size="14" fill="white" text-anchor="middle" font-weight="bold">CLAIM OFFER</text>
          <defs>
            <linearGradient id="grad5" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#f97316;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#dc2626;stop-opacity:1" />
            </linearGradient>
          </defs>
        </svg>
      `,
    }

    return thumbnails[category] || thumbnails.newsletter
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fuchsia-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              selectedCategory === category.id
                ? 'bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white shadow-lg shadow-fuchsia-500/30'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/10'
            }`}
          >
            <span className="mr-2">{category.icon}</span>
            {category.name}
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <Card
            key={template.id}
            className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all cursor-pointer group"
            onClick={() => setPreviewTemplate(template)}
          >
            <CardHeader className="p-0">
              <div className="relative overflow-hidden rounded-t-lg aspect-[4/3] bg-gradient-to-br from-gray-800 to-gray-900">
                <div
                  className="w-full h-full"
                  dangerouslySetInnerHTML={{ __html: getTemplateThumbnail(template.category) }}
                />
                {template.is_default && (
                  <div className="absolute top-3 right-3 px-2 py-1 bg-fuchsia-600 text-white text-xs font-bold rounded">
                    DEFAULT
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelectTemplate(template.id)
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white rounded-lg font-medium shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform"
                  >
                    Use Template
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <CardTitle className="text-white text-lg">{template.name}</CardTitle>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium text-white bg-gradient-to-r ${getCategoryColor(
                    template.category
                  )}`}
                >
                  {template.category}
                </span>
              </div>
              {template.description && (
                <CardDescription className="text-gray-400 text-sm line-clamp-2">
                  {template.description}
                </CardDescription>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardContent className="py-12 text-center">
            <p className="text-gray-400 text-lg">No templates found in this category</p>
          </CardContent>
        </Card>
      )}

      {/* Template Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="bg-[#1a1a2e] border-white/10 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <CardHeader className="border-b border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white text-2xl">{previewTemplate.name}</CardTitle>
                  {previewTemplate.description && (
                    <CardDescription className="text-gray-400 mt-2">
                      {previewTemplate.description}
                    </CardDescription>
                  )}
                </div>
                <button
                  onClick={() => setPreviewTemplate(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto p-6">
              <iframe
                srcDoc={previewTemplate.html_content
                  .replace(/{{subject}}/g, 'Sample Subject Line')
                  .replace(/{{preview_text}}/g, 'This is a preview of your email content')
                  .replace(/{{content}}/g, 'This is where your main email content will appear. You can customize this with your own text, images, and formatting.')
                  .replace(/{{firstName}}/g, 'John')
                  .replace(/{{lastName}}/g, 'Doe')
                  .replace(/{{unsubscribe_url}}/g, '#')
                  .replace(/{{event_url}}/g, '#')
                  .replace(/{{product_url}}/g, '#')
                  .replace(/{{offer_url}}/g, '#')}
                className="w-full border-0 bg-white rounded-lg"
                style={{ minHeight: '500px' }}
                title="Template Preview"
                sandbox="allow-same-origin"
              />
            </CardContent>
            <div className="border-t border-white/10 p-4 flex gap-3">
              <button
                onClick={() => {
                  onSelectTemplate(previewTemplate.id)
                  setPreviewTemplate(null)
                }}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-600 hover:to-purple-700 text-white rounded-lg font-medium shadow-lg transition-all"
              >
                Use This Template
              </button>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg font-medium border border-white/10 transition-all"
              >
                Close
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
