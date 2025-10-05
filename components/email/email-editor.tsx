'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmailPreview } from './email-preview'
import { createClient } from '@/lib/supabase/client'

interface Campaign {
  id: string
  subject: string
  preview_text: string | null
  content: string
  template_id: string | null
  status: string
  scheduled_for: string | null
}

interface EmailEditorProps {
  campaign: Campaign | null
  onSave: (data: Partial<Campaign>) => void
  onCancel: () => void
}

interface Template {
  id: string
  name: string
  html_content: string
  category: string
}

export function EmailEditor({ campaign, onSave, onCancel }: EmailEditorProps) {
  const [subject, setSubject] = useState(campaign?.subject || '')
  const [previewText, setPreviewText] = useState(campaign?.preview_text || '')
  const [content, setContent] = useState(campaign?.content || '')
  const [selectedTemplateId, setSelectedTemplateId] = useState(campaign?.template_id || null)
  const [templates, setTemplates] = useState<Template[]>([])
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop')
  const [recipientType, setRecipientType] = useState<'all' | 'segment'>('all')
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduleTime, setScheduleTime] = useState('')
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    const { data } = await supabase
      .from('email_templates')
      .select('*')
      .order('name')

    if (data) {
      setTemplates(data)
    }
  }

  const handleSaveDraft = async () => {
    setLoading(true)
    await onSave({
      subject,
      preview_text: previewText,
      content,
      template_id: selectedTemplateId,
      status: 'draft',
    })
    setLoading(false)
  }

  const handleSchedule = async () => {
    if (!scheduleDate || !scheduleTime) {
      alert('Please select a date and time to schedule')
      return
    }

    const scheduledFor = new Date(`${scheduleDate}T${scheduleTime}`)

    setLoading(true)
    await onSave({
      subject,
      preview_text: previewText,
      content,
      template_id: selectedTemplateId,
      status: 'scheduled',
      scheduled_for: scheduledFor.toISOString(),
    })
    setLoading(false)
  }

  const handleSendNow = async () => {
    if (!confirm('Are you sure you want to send this campaign now?')) {
      return
    }

    setLoading(true)
    await onSave({
      subject,
      preview_text: previewText,
      content,
      template_id: selectedTemplateId,
      status: 'sending',
    })
    setLoading(false)
  }

  const handleSendTest = async () => {
    const email = prompt('Enter email address to send test:')
    if (!email) return

    try {
      const response = await fetch('/api/email/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          subject,
          content,
          template_id: selectedTemplateId,
        }),
      })

      if (response.ok) {
        alert('Test email sent successfully!')
      } else {
        throw new Error('Failed to send test email')
      }
    } catch (error) {
      console.error('Error sending test:', error)
      alert('Failed to send test email')
    }
  }

  const insertToken = (token: string) => {
    setContent(content + ` {{${token}}}`)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Editor Panel */}
      <div className="space-y-6">
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <span>Campaign Editor</span>
              <Button
                variant="ghost"
                onClick={onCancel}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Template Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Template
              </label>
              <select
                value={selectedTemplateId || ''}
                onChange={(e) => setSelectedTemplateId(e.target.value || null)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
              >
                <option value="">Blank Template</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject Line */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-300">
                  Subject Line
                </label>
                <span className="text-xs text-gray-500">{subject.length} characters</span>
              </div>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter email subject..."
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
              />
            </div>

            {/* Preview Text */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-300">
                  Preview Text
                </label>
                <span className="text-xs text-gray-500">{previewText.length} characters</span>
              </div>
              <Input
                value={previewText}
                onChange={(e) => setPreviewText(e.target.value)}
                placeholder="This appears in inbox preview..."
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
              />
            </div>

            {/* Personalization Tokens */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Personalization Tokens
              </label>
              <div className="flex flex-wrap gap-2">
                {['firstName', 'lastName', 'email', 'company'].map((token) => (
                  <button
                    key={token}
                    onClick={() => insertToken(token)}
                    className="px-3 py-1 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded text-sm text-purple-300 transition-colors"
                  >
                    {`{{${token}}}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Email Content */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-300">
                  Email Content
                </label>
                <span className="text-xs text-gray-500">{content.length} characters</span>
              </div>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter your email content here..."
                rows={12}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 font-mono text-sm"
              />
            </div>

            {/* Recipient Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Send To
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setRecipientType('all')}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                    recipientType === 'all'
                      ? 'bg-fuchsia-600 text-white'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  All Subscribers
                </button>
                <button
                  onClick={() => setRecipientType('segment')}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                    recipientType === 'segment'
                      ? 'bg-fuchsia-600 text-white'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  Specific Segment
                </button>
              </div>
            </div>

            {/* Schedule Options */}
            <div className="border-t border-white/10 pt-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Schedule (Optional)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                />
                <Input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 pt-4 border-t border-white/10">
              <Button
                onClick={handleSendTest}
                variant="outline"
                className="w-full border-white/20 text-white hover:bg-white/10"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Send Test Email
              </Button>

              <Button
                onClick={handleSaveDraft}
                variant="outline"
                disabled={loading}
                className="w-full border-white/20 text-white hover:bg-white/10"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Save as Draft
              </Button>

              {scheduleDate && scheduleTime && (
                <Button
                  onClick={handleSchedule}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Schedule Campaign
                </Button>
              )}

              <Button
                onClick={handleSendNow}
                disabled={loading || !subject || !content}
                className="w-full bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-600 hover:to-purple-700 shadow-lg shadow-fuchsia-500/30"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Send Now
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview Panel */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Preview</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setPreviewMode('desktop')}
              className={`p-2 rounded-lg transition-colors ${
                previewMode === 'desktop'
                  ? 'bg-fuchsia-600 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
              title="Desktop Preview"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </button>
            <button
              onClick={() => setPreviewMode('mobile')}
              className={`p-2 rounded-lg transition-colors ${
                previewMode === 'mobile'
                  ? 'bg-fuchsia-600 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
              title="Mobile Preview"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </div>

        <EmailPreview
          subject={subject}
          previewText={previewText}
          content={content}
          templateId={selectedTemplateId}
          mode={previewMode}
        />
      </div>
    </div>
  )
}
