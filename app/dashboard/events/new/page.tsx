'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { EventForm } from '@/components/events/event-form'
import { InteractiveVoiceModal } from '@/components/ai-agent/interactive-voice-modal'
import { createClient } from '@/lib/supabase/client'
import type { Event } from '@/lib/types/event'

export default function NewEventPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<Partial<Event>>({})
  const [showAIModal, setShowAIModal] = useState(false)
  const formRef = useRef<any>(null)

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

        {/* AI Assistant Button */}
        <button
          onClick={() => setShowAIModal(true)}
          className="fixed bottom-8 right-8 z-40 group"
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-600 opacity-75 blur-xl group-hover:opacity-100 transition-opacity"></div>
          <div className="relative w-16 h-16 rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-fuchsia-500/50 group-hover:scale-110 transition-all">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </div>
        </button>

        {/* AI Modal */}
        <InteractiveVoiceModal
          isOpen={showAIModal}
          onClose={() => setShowAIModal(false)}
          formType="event"
          currentFormData={formData}
          onFormUpdate={(data) => {
            setFormData((prev) => ({ ...prev, ...data }))
          }}
        />
      </div>
    </div>
  )
}
