'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { EventForm } from '@/components/events/event-form'
import { ContinuousVoiceAssistant } from '@/components/ai-agent/continuous-voice-assistant'
import { createClient } from '@/lib/supabase/client'
import type { Event } from '@/lib/types/event'

export default function NewEventPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<Partial<Event>>({})
  const [aiActive, setAiActive] = useState(false)
  const [currentField, setCurrentField] = useState<string | null>(null)
  const formRef = useRef<any>(null)

  // Auto-scroll to current field and focus it
  useEffect(() => {
    if (currentField) {
      const fieldElement = document.querySelector(`[name="${currentField}"]`) as HTMLElement
      if (fieldElement) {
        fieldElement.scrollIntoView({ behavior: 'smooth', block: 'center' })

        // Focus the field
        setTimeout(() => {
          if (fieldElement instanceof HTMLInputElement ||
              fieldElement instanceof HTMLTextAreaElement ||
              fieldElement instanceof HTMLSelectElement) {
            fieldElement.focus()
          }
        }, 300)

        // Add highlight effect
        fieldElement.classList.add('ring-2', 'ring-fuchsia-500', 'ring-offset-2')
        setTimeout(() => {
          fieldElement.classList.remove('ring-2', 'ring-fuchsia-500', 'ring-offset-2')
        }, 2000)
      }
    }
  }, [currentField])

  const handleSubmit = async (data: Partial<Event>) => {
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('You must be logged in to create an event')
      }

      // Insert event
      const { data: event, error: insertError } = await supabase
        .from('events')
        .insert({
          ...data,
          user_id: user.id,
          current_attendees: 0,
        })
        .select()
        .single()

      if (insertError) throw insertError

      // Redirect to event management page
      router.push(`/dashboard/events/${event.id}`)
    } catch (err: any) {
      console.error('Error creating event:', err)
      setError(err.message || 'Failed to create event')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#201033] via-[#15092b] to-[#0a0513] p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </button>
          <h1 className="text-4xl font-bold text-white mb-2">Create New Event</h1>
          <p className="text-slate-400">
            Fill in the details below to create your event. You can save as draft and publish
            later.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Form with AI-filled data */}
        <EventForm
          onSubmit={handleSubmit}
          isLoading={isLoading}
          initialData={formData}
        />

        {/* Continuous Voice Assistant */}
        <ContinuousVoiceAssistant
          isActive={aiActive}
          onToggle={() => setAiActive(!aiActive)}
          formType="event"
          onFormUpdate={(data, field) => {
            console.log('[Page] Updating form data:', data)
            setFormData((prev) => {
              const updated = { ...prev, ...data }
              console.log('[Page] New form state:', updated)
              return updated
            })
            if (field) {
              console.log('[Page] Setting current field:', field)
              setCurrentField(field)
            }
          }}
        />
      </div>
    </div>
  )
}
