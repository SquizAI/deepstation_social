'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface EmailPreviewProps {
  subject: string
  previewText: string
  content: string
  templateId: string | null
  mode: 'desktop' | 'mobile'
}

export function EmailPreview({ subject, previewText, content, templateId, mode }: EmailPreviewProps) {
  const [htmlContent, setHtmlContent] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadTemplate()
  }, [templateId, content, subject, previewText])

  const loadTemplate = async () => {
    if (!templateId) {
      // Simple preview without template
      setHtmlContent(generateSimpleHTML())
      return
    }

    setLoading(true)
    const { data } = await supabase
      .from('email_templates')
      .select('html_content')
      .eq('id', templateId)
      .single()

    if (data) {
      const rendered = renderTemplate(data.html_content)
      setHtmlContent(rendered)
    }
    setLoading(false)
  }

  const renderTemplate = (template: string) => {
    // Replace template variables
    return template
      .replace(/{{subject}}/g, subject || 'Your Subject Here')
      .replace(/{{preview_text}}/g, previewText || 'Preview text')
      .replace(/{{content}}/g, formatContent(content || 'Your content here...'))
      .replace(/{{firstName}}/g, 'John')
      .replace(/{{lastName}}/g, 'Doe')
      .replace(/{{email}}/g, 'john@example.com')
      .replace(/{{company}}/g, 'Example Co.')
      .replace(/{{unsubscribe_url}}/g, '#unsubscribe')
      .replace(/{{event_url}}/g, '#event')
      .replace(/{{product_url}}/g, '#product')
      .replace(/{{offer_url}}/g, '#offer')
  }

  const generateSimpleHTML = () => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <tr>
              <td style="padding: 40px 30px; text-align: center; background: linear-gradient(135deg, #d946ef 0%, #9333ea 100%);">
                <h1 style="margin: 0; color: #ffffff; font-size: 28px;">${subject || 'Your Subject Here'}</h1>
                ${previewText ? `<p style="margin: 10px 0 0 0; color: #e0e0e0; font-size: 14px;">${previewText}</p>` : ''}
              </td>
            </tr>
            <tr>
              <td style="padding: 40px 30px;">
                <div style="color: #333; font-size: 16px; line-height: 1.6; white-space: pre-wrap;">
                  ${formatContent(content || 'Your content here...')}
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding: 20px 30px; text-align: center; background-color: #f8f9fa; border-top: 1px solid #e0e0e0;">
                <p style="margin: 0; color: #666; font-size: 14px;">
                  You received this email because you subscribed to DeepStation updates.
                </p>
                <p style="margin: 10px 0 0 0;">
                  <a href="#" style="color: #9333ea; text-decoration: none;">Unsubscribe</a>
                </p>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `
  }

  const formatContent = (text: string) => {
    // Convert markdown-style formatting to HTML
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>')
  }

  const containerClass = mode === 'mobile' ? 'max-w-sm mx-auto' : 'max-w-2xl mx-auto'

  return (
    <div className={`${containerClass} bg-white rounded-lg shadow-xl overflow-hidden`}>
      {/* Email Client Header Mockup */}
      <div className="bg-gray-100 border-b border-gray-300 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <span className="text-sm text-gray-600 font-medium">Email Preview</span>
        </div>
        <div className="space-y-2">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-600 flex items-center justify-center text-white font-bold">
              DS
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">DeepStation</p>
                  <p className="text-sm text-gray-600">to you</p>
                </div>
                <span className="text-xs text-gray-500">Just now</span>
              </div>
              <p className="text-base font-semibold text-gray-900 mt-2">
                {subject || 'Your Subject Here'}
              </p>
              {previewText && (
                <p className="text-sm text-gray-600 mt-1">{previewText}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Email Content Preview */}
      <div className="bg-white overflow-auto" style={{ maxHeight: '600px' }}>
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-fuchsia-500"></div>
          </div>
        ) : (
          <iframe
            srcDoc={htmlContent || generateSimpleHTML()}
            className="w-full border-0"
            style={{ minHeight: '500px' }}
            title="Email Preview"
            sandbox="allow-same-origin"
          />
        )}
      </div>
    </div>
  )
}
