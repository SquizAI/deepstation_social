'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import type { Event, TicketType, RegistrationQuestion, RecurrencePattern } from '@/lib/types/event'

interface EventFormProps {
  initialData?: Partial<Event>
  onSubmit: (data: Partial<Event>) => Promise<void>
  isLoading?: boolean
}

export function EventForm({ initialData, onSubmit, isLoading = false }: EventFormProps) {
  const [formData, setFormData] = useState<Partial<Event>>({
    title: initialData?.title || '',
    slug: initialData?.slug || '',
    description: initialData?.description || '',
    short_description: initialData?.short_description || '',
    event_date: initialData?.event_date || '',
    start_time: initialData?.start_time || '09:00',
    end_time: initialData?.end_time || '17:00',
    timezone: initialData?.timezone || 'America/New_York',
    location_type: initialData?.location_type || 'online',
    location_name: initialData?.location_name || '',
    location_address: initialData?.location_address || '',
    location_city: initialData?.location_city || '',
    location_state: initialData?.location_state || '',
    location_country: initialData?.location_country || '',
    meeting_url: initialData?.meeting_url || '',
    max_capacity: initialData?.max_capacity,
    is_free: initialData?.is_free ?? true,
    is_recurring: initialData?.is_recurring || false,
    allow_waitlist: initialData?.allow_waitlist || false,
    status: initialData?.status || 'draft',
    tags: initialData?.tags || [],
    meta_description: initialData?.meta_description || '',
  })

  const [ticketTypes, setTicketTypes] = useState<TicketType[]>(initialData?.ticket_types || [])
  const [customQuestions, setCustomQuestions] = useState<RegistrationQuestion[]>(
    initialData?.registration_questions || []
  )
  const [hosts, setHosts] = useState(initialData?.hosts || [])
  const [currentTag, setCurrentTag] = useState('')
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null)
  const [ogImageFile, setOgImageFile] = useState<File | null>(null)

  // Sync form data when AI updates initialData
  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        ...Object.fromEntries(
          Object.entries(initialData).filter(([_, v]) => v !== null && v !== undefined)
        )
      }))
    }
  }, [initialData])

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    // Auto-generate slug from title
    if (field === 'title' && !initialData?.slug) {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
      setFormData((prev) => ({ ...prev, slug }))
    }
  }

  const addTicketType = () => {
    setTicketTypes([
      ...ticketTypes,
      {
        id: crypto.randomUUID(),
        name: 'General Admission',
        price: 0,
        currency: 'USD',
        quantity_sold: 0,
        is_active: true,
      },
    ])
  }

  const updateTicketType = (index: number, updates: Partial<TicketType>) => {
    const updated = [...ticketTypes]
    updated[index] = { ...updated[index], ...updates }
    setTicketTypes(updated)
  }

  const removeTicketType = (index: number) => {
    setTicketTypes(ticketTypes.filter((_, i) => i !== index))
  }

  const addCustomQuestion = () => {
    setCustomQuestions([
      ...customQuestions,
      {
        id: crypto.randomUUID(),
        question: '',
        type: 'text',
        required: false,
        order: customQuestions.length,
      },
    ])
  }

  const updateCustomQuestion = (index: number, updates: Partial<RegistrationQuestion>) => {
    const updated = [...customQuestions]
    updated[index] = { ...updated[index], ...updates }
    setCustomQuestions(updated)
  }

  const removeCustomQuestion = (index: number) => {
    setCustomQuestions(customQuestions.filter((_, i) => i !== index))
  }

  const addTag = () => {
    if (currentTag && !formData.tags?.includes(currentTag)) {
      setFormData((prev) => ({
        ...prev,
        tags: [...(prev.tags || []), currentTag],
      }))
      setCurrentTag('')
    }
  }

  const removeTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags?.filter((t) => t !== tag) || [],
    }))
  }

  const handleSubmit = async (e: React.FormEvent, status: 'draft' | 'published') => {
    e.preventDefault()
    await onSubmit({
      ...formData,
      status,
      ticket_types: ticketTypes,
      registration_questions: customQuestions,
      hosts,
    })
  }

  return (
    <form className="space-y-8">
      {/* Basic Info */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Basic Information</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Event Title</label>
            <Input
              name="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Amazing Tech Conference 2025"
              className="bg-white/5 border-white/10 text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              URL Slug
              <span className="text-xs text-slate-500 ml-2">
                deepstation.ai/events/{formData.slug || 'your-event'}
              </span>
            </label>
            <Input
              name="slug"
              value={formData.slug}
              onChange={(e) => handleInputChange('slug', e.target.value)}
              placeholder="amazing-tech-conference-2025"
              className="bg-white/5 border-white/10 text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Short Description
            </label>
            <Textarea
              name="short_description"
              value={formData.short_description}
              onChange={(e) => handleInputChange('short_description', e.target.value)}
              placeholder="A one-line summary of your event (max 160 characters)"
              maxLength={160}
              rows={2}
              className="bg-white/5 border-white/10 text-white"
            />
            <div className="text-xs text-slate-500 mt-1">
              {formData.short_description?.length || 0} / 160
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Full Description
            </label>
            <Textarea
              name="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Detailed description of your event, schedule, what attendees can expect..."
              rows={6}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Cover Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setCoverImageFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-fuchsia-500/20 file:text-fuchsia-300 hover:file:bg-fuchsia-500/30"
            />
            <p className="text-xs text-slate-500 mt-1">Recommended: 1200x630px, under 2MB</p>
          </div>
        </div>
      </div>

      {/* Date & Time */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Date & Time</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Event Date</label>
            <Input
              name="event_date"
              type="date"
              value={formData.event_date}
              onChange={(e) => handleInputChange('event_date', e.target.value)}
              className="bg-white/5 border-white/10 text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Timezone</label>
            <select
              name="timezone"
              value={formData.timezone}
              onChange={(e) => handleInputChange('timezone', e.target.value)}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
            >
              <option value="America/New_York">Eastern Time (ET)</option>
              <option value="America/Chicago">Central Time (CT)</option>
              <option value="America/Denver">Mountain Time (MT)</option>
              <option value="America/Los_Angeles">Pacific Time (PT)</option>
              <option value="Europe/London">London (GMT)</option>
              <option value="Europe/Paris">Paris (CET)</option>
              <option value="Asia/Tokyo">Tokyo (JST)</option>
              <option value="Australia/Sydney">Sydney (AEDT)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Start Time</label>
            <Input
              name="start_time"
              type="time"
              value={formData.start_time}
              onChange={(e) => handleInputChange('start_time', e.target.value)}
              className="bg-white/5 border-white/10 text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">End Time</label>
            <Input
              name="end_time"
              type="time"
              value={formData.end_time}
              onChange={(e) => handleInputChange('end_time', e.target.value)}
              className="bg-white/5 border-white/10 text-white"
              required
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={formData.is_recurring}
              onChange={(e) => handleInputChange('is_recurring', e.target.checked)}
              className="rounded bg-white/5 border-white/10"
            />
            This is a recurring event
          </label>
        </div>
      </div>

      {/* Location */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Location</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Location Type</label>
            <div className="flex gap-3">
              {['online', 'in-person', 'hybrid'].map((type) => (
                <label
                  key={type}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 cursor-pointer transition-all ${
                    formData.location_type === type
                      ? 'border-fuchsia-500 bg-fuchsia-500/20 text-white'
                      : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20'
                  }`}
                >
                  <input
                    type="radio"
                    name="location_type"
                    value={type}
                    checked={formData.location_type === type}
                    onChange={(e) => handleInputChange('location_type', e.target.value)}
                    className="sr-only"
                  />
                  <span className="capitalize">{type}</span>
                </label>
              ))}
            </div>
          </div>

          {(formData.location_type === 'online' || formData.location_type === 'hybrid') && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Meeting URL
              </label>
              <Input
                name="meeting_url"
                type="url"
                value={formData.meeting_url}
                onChange={(e) => handleInputChange('meeting_url', e.target.value)}
                placeholder="https://zoom.us/j/123456789"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
          )}

          {(formData.location_type === 'in-person' || formData.location_type === 'hybrid') && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Venue Name
                </label>
                <Input
                  name="location_name"
                  value={formData.location_name}
                  onChange={(e) => handleInputChange('location_name', e.target.value)}
                  placeholder="San Francisco Convention Center"
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Street Address
                </label>
                <Input
                  name="location_address"
                  value={formData.location_address}
                  onChange={(e) => handleInputChange('location_address', e.target.value)}
                  placeholder="123 Main Street"
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">City</label>
                  <Input
                    name="location_city"
                    value={formData.location_city}
                    onChange={(e) => handleInputChange('location_city', e.target.value)}
                    placeholder="San Francisco"
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    State/Province
                  </label>
                  <Input
                    name="location_state"
                    value={formData.location_state}
                    onChange={(e) => handleInputChange('location_state', e.target.value)}
                    placeholder="CA"
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Country</label>
                  <Input
                    name="location_country"
                    value={formData.location_country}
                    onChange={(e) => handleInputChange('location_country', e.target.value)}
                    placeholder="USA"
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Capacity & Tickets */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Capacity & Tickets</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Maximum Capacity
            </label>
            <Input
              name="max_capacity"
              type="number"
              value={formData.max_capacity || ''}
              onChange={(e) => handleInputChange('max_capacity', parseInt(e.target.value) || null)}
              placeholder="Leave empty for unlimited"
              className="bg-white/5 border-white/10 text-white"
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={formData.is_free}
                onChange={(e) => handleInputChange('is_free', e.target.checked)}
                className="rounded bg-white/5 border-white/10"
              />
              Free Event
            </label>

            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={formData.allow_waitlist}
                onChange={(e) => handleInputChange('allow_waitlist', e.target.checked)}
                className="rounded bg-white/5 border-white/10"
              />
              Allow Waitlist
            </label>
          </div>

          {!formData.is_free && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-white">Ticket Types</h3>
                <button
                  type="button"
                  onClick={addTicketType}
                  className="text-sm text-fuchsia-400 hover:text-fuchsia-300"
                >
                  + Add Ticket Type
                </button>
              </div>

              {ticketTypes.map((ticket, index) => (
                <div
                  key={ticket.id}
                  className="p-4 bg-white/5 rounded-lg border border-white/10 space-y-3"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <Input
                        value={ticket.name}
                        onChange={(e) => updateTicketType(index, { name: e.target.value })}
                        placeholder="Ticket name"
                        className="bg-white/5 border-white/10 text-white"
                      />
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          value={ticket.price}
                          onChange={(e) =>
                            updateTicketType(index, { price: parseFloat(e.target.value) || 0 })
                          }
                          placeholder="Price"
                          className="bg-white/5 border-white/10 text-white"
                        />
                        <select
                          value={ticket.currency}
                          onChange={(e) => updateTicketType(index, { currency: e.target.value })}
                          className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                        >
                          <option value="USD">USD</option>
                          <option value="EUR">EUR</option>
                          <option value="GBP">GBP</option>
                        </select>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeTicketType(index)}
                      className="p-2 text-red-400 hover:text-red-300"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>

                  <Textarea
                    value={ticket.description}
                    onChange={(e) => updateTicketType(index, { description: e.target.value })}
                    placeholder="Ticket description (optional)"
                    rows={2}
                    className="bg-white/5 border-white/10 text-white text-sm"
                  />

                  <div className="grid grid-cols-3 gap-3">
                    <Input
                      type="number"
                      value={ticket.quantity_available || ''}
                      onChange={(e) =>
                        updateTicketType(index, {
                          quantity_available: parseInt(e.target.value) || undefined,
                        })
                      }
                      placeholder="Quantity (optional)"
                      className="bg-white/5 border-white/10 text-white text-sm"
                    />
                    <Input
                      type="number"
                      value={ticket.early_bird_price || ''}
                      onChange={(e) =>
                        updateTicketType(index, {
                          early_bird_price: parseFloat(e.target.value) || undefined,
                        })
                      }
                      placeholder="Early bird price"
                      className="bg-white/5 border-white/10 text-white text-sm"
                    />
                    <Input
                      type="date"
                      value={ticket.early_bird_deadline || ''}
                      onChange={(e) =>
                        updateTicketType(index, { early_bird_deadline: e.target.value })
                      }
                      placeholder="Early bird deadline"
                      className="bg-white/5 border-white/10 text-white text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Custom Registration Questions */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Registration Questions</h2>
          <button
            type="button"
            onClick={addCustomQuestion}
            className="text-sm text-fuchsia-400 hover:text-fuchsia-300"
          >
            + Add Question
          </button>
        </div>

        {customQuestions.length === 0 ? (
          <p className="text-sm text-slate-400">
            Add custom questions to collect additional information from attendees.
          </p>
        ) : (
          <div className="space-y-3">
            {customQuestions.map((question, index) => (
              <div
                key={question.id}
                className="p-4 bg-white/5 rounded-lg border border-white/10 space-y-3"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 space-y-3">
                    <Input
                      value={question.question}
                      onChange={(e) => updateCustomQuestion(index, { question: e.target.value })}
                      placeholder="Question text"
                      className="bg-white/5 border-white/10 text-white"
                    />
                    <div className="flex gap-3">
                      <select
                        value={question.type}
                        onChange={(e) =>
                          updateCustomQuestion(index, {
                            type: e.target.value as RegistrationQuestion['type'],
                          })
                        }
                        className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                      >
                        <option value="text">Text</option>
                        <option value="email">Email</option>
                        <option value="phone">Phone</option>
                        <option value="select">Select</option>
                        <option value="checkbox">Checkbox</option>
                        <option value="textarea">Long Text</option>
                      </select>
                      <label className="flex items-center gap-2 text-sm text-slate-300">
                        <input
                          type="checkbox"
                          checked={question.required}
                          onChange={(e) =>
                            updateCustomQuestion(index, { required: e.target.checked })
                          }
                          className="rounded bg-white/5 border-white/10"
                        />
                        Required
                      </label>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeCustomQuestion(index)}
                    className="p-2 text-red-400 hover:text-red-300"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SEO & Social */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
        <h2 className="text-xl font-semibold text-white mb-4">SEO & Social Sharing</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Meta Description
            </label>
            <Textarea
              name="meta_description"
              value={formData.meta_description}
              onChange={(e) => handleInputChange('meta_description', e.target.value)}
              placeholder="Description for search engines and social media previews"
              maxLength={160}
              rows={3}
              className="bg-white/5 border-white/10 text-white"
            />
            <div className="text-xs text-slate-500 mt-1">
              {formData.meta_description?.length || 0} / 160
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Social Share Image (OG Image)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setOgImageFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-fuchsia-500/20 file:text-fuchsia-300 hover:file:bg-fuchsia-500/30"
            />
            <p className="text-xs text-slate-500 mt-1">
              Recommended: 1200x630px. Used when sharing on social media.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Tags</label>
            <div className="flex gap-2 mb-2">
              <Input
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="Add tags (e.g., tech, conference, AI)"
                className="bg-white/5 border-white/10 text-white"
              />
              <button
                type="button"
                onClick={addTag}
                className="px-4 py-2 bg-fuchsia-500/20 text-fuchsia-300 rounded-lg hover:bg-fuchsia-500/30"
              >
                Add
              </button>
            </div>
            {formData.tags && formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-fuchsia-500/20 text-fuchsia-300 rounded-full text-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-fuchsia-400 hover:text-fuchsia-200"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Submit Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-end">
        <button
          type="button"
          onClick={(e) => handleSubmit(e, 'draft')}
          disabled={isLoading}
          className="px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all disabled:opacity-50"
        >
          Save as Draft
        </button>
        <button
          type="button"
          onClick={(e) => handleSubmit(e, 'published')}
          disabled={isLoading}
          className="px-6 py-3 bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white rounded-lg hover:shadow-lg hover:shadow-fuchsia-500/50 transition-all disabled:opacity-50"
        >
          {isLoading ? 'Publishing...' : 'Publish Event'}
        </button>
      </div>
    </form>
  )
}
