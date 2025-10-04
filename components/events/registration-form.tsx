'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import type { Event } from '@/lib/types/event'

interface RegistrationFormProps {
  event: Event
  onSuccess: () => void
}

export function RegistrationForm({ event, onSuccess }: RegistrationFormProps) {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    ticket_type_id: event.ticket_types?.[0]?.id || null,
    answers: {} as Record<string, string>,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // Get current user (optional - can register without login)
      const {
        data: { user },
      } = await supabase.auth.getUser()

      // Check capacity
      if (event.max_capacity && event.current_attendees >= event.max_capacity) {
        throw new Error('This event is sold out')
      }

      // Insert registration
      const { error: insertError } = await supabase.from('event_registrations').insert({
        event_id: event.id,
        user_id: user?.id,
        email: formData.email,
        full_name: formData.full_name,
        ticket_type_id: formData.ticket_type_id,
        answers: formData.answers,
        payment_status: event.is_free ? 'completed' : 'pending',
        check_in_status: 'pending',
      })

      if (insertError) throw insertError

      // Update event attendee count
      await supabase
        .from('events')
        .update({ current_attendees: event.current_attendees + 1 })
        .eq('id', event.id)

      // If paid event, redirect to payment (implement Stripe integration)
      if (!event.is_free) {
        // TODO: Implement Stripe payment flow
        // For now, just show success
      }

      onSuccess()
    } catch (err: any) {
      console.error('Registration error:', err)
      setError(err.message || 'Failed to register. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const selectedTicket = event.ticket_types?.find((t) => t.id === formData.ticket_type_id)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Basic Info */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Full Name *</label>
          <Input
            type="text"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            placeholder="John Doe"
            className="bg-white/5 border-white/10 text-white"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Email *</label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="john@example.com"
            className="bg-white/5 border-white/10 text-white"
            required
          />
        </div>
      </div>

      {/* Ticket Selection (for paid events) */}
      {!event.is_free && event.ticket_types && event.ticket_types.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-3">Select Ticket *</label>
          <div className="space-y-2">
            {event.ticket_types
              .filter((t) => t.is_active)
              .map((ticket) => {
                const isEarlyBird =
                  ticket.early_bird_price &&
                  ticket.early_bird_deadline &&
                  new Date(ticket.early_bird_deadline) > new Date()

                const price = isEarlyBird ? ticket.early_bird_price : ticket.price
                const isSoldOut = Boolean(
                  ticket.quantity_available &&
                  ticket.quantity_sold >= ticket.quantity_available
                )

                return (
                  <label
                    key={ticket.id}
                    className={`block p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      formData.ticket_type_id === ticket.id
                        ? 'border-fuchsia-500 bg-fuchsia-500/10'
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    } ${isSoldOut ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <input
                      type="radio"
                      name="ticket_type"
                      value={ticket.id}
                      checked={formData.ticket_type_id === ticket.id}
                      onChange={(e) =>
                        setFormData({ ...formData, ticket_type_id: e.target.value })
                      }
                      disabled={isSoldOut}
                      className="sr-only"
                    />
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-white">{ticket.name}</p>
                          {isEarlyBird && (
                            <span className="px-2 py-0.5 bg-green-500/20 text-green-300 text-xs rounded-full border border-green-500/30">
                              Early Bird
                            </span>
                          )}
                          {isSoldOut && (
                            <span className="px-2 py-0.5 bg-red-500/20 text-red-300 text-xs rounded-full border border-red-500/30">
                              Sold Out
                            </span>
                          )}
                        </div>
                        {ticket.description && (
                          <p className="text-sm text-slate-400 mt-1">{ticket.description}</p>
                        )}
                        {ticket.quantity_available && (
                          <p className="text-xs text-slate-500 mt-1">
                            {ticket.quantity_available - ticket.quantity_sold} remaining
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-white">
                          {ticket.currency} {price}
                        </p>
                        {isEarlyBird && ticket.price !== price && (
                          <p className="text-xs text-slate-500 line-through">
                            {ticket.currency} {ticket.price}
                          </p>
                        )}
                      </div>
                    </div>
                  </label>
                )
              })}
          </div>
        </div>
      )}

      {/* Custom Questions */}
      {event.registration_questions && event.registration_questions.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Additional Information</h3>
          {event.registration_questions
            .sort((a, b) => a.order - b.order)
            .map((question) => (
              <div key={question.id}>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {question.question}
                  {question.required && <span className="text-red-400 ml-1">*</span>}
                </label>

                {question.type === 'text' && (
                  <Input
                    type="text"
                    value={formData.answers[question.id] || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        answers: { ...formData.answers, [question.id]: e.target.value },
                      })
                    }
                    className="bg-white/5 border-white/10 text-white"
                    required={question.required}
                  />
                )}

                {question.type === 'email' && (
                  <Input
                    type="email"
                    value={formData.answers[question.id] || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        answers: { ...formData.answers, [question.id]: e.target.value },
                      })
                    }
                    className="bg-white/5 border-white/10 text-white"
                    required={question.required}
                  />
                )}

                {question.type === 'phone' && (
                  <Input
                    type="tel"
                    value={formData.answers[question.id] || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        answers: { ...formData.answers, [question.id]: e.target.value },
                      })
                    }
                    className="bg-white/5 border-white/10 text-white"
                    required={question.required}
                  />
                )}

                {question.type === 'textarea' && (
                  <Textarea
                    value={formData.answers[question.id] || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        answers: { ...formData.answers, [question.id]: e.target.value },
                      })
                    }
                    rows={4}
                    className="bg-white/5 border-white/10 text-white"
                    required={question.required}
                  />
                )}

                {question.type === 'select' && question.options && (
                  <select
                    value={formData.answers[question.id] || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        answers: { ...formData.answers, [question.id]: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                    required={question.required}
                  >
                    <option value="">Select an option</option>
                    {question.options.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                )}

                {question.type === 'checkbox' && (
                  <label className="flex items-center gap-2 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={formData.answers[question.id] === 'true'}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          answers: {
                            ...formData.answers,
                            [question.id]: e.target.checked ? 'true' : 'false',
                          },
                        })
                      }
                      className="rounded bg-white/5 border-white/10"
                      required={question.required}
                    />
                    I agree
                  </label>
                )}
              </div>
            ))}
        </div>
      )}

      {/* Total (for paid events) */}
      {!event.is_free && selectedTicket && (
        <div className="p-4 bg-fuchsia-500/10 rounded-lg border border-fuchsia-500/30">
          <div className="flex items-center justify-between">
            <span className="text-white font-medium">Total</span>
            <span className="text-2xl font-bold text-white">
              {selectedTicket.currency}{' '}
              {selectedTicket.early_bird_price &&
              selectedTicket.early_bird_deadline &&
              new Date(selectedTicket.early_bird_deadline) > new Date()
                ? selectedTicket.early_bird_price
                : selectedTicket.price}
            </span>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white rounded-lg font-semibold shadow-lg shadow-fuchsia-500/25 hover:shadow-fuchsia-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading
          ? 'Processing...'
          : event.is_free
            ? 'Complete Registration'
            : 'Proceed to Payment'}
      </button>

      <p className="text-xs text-slate-500 text-center">
        By registering, you agree to receive event updates via email.
      </p>
    </form>
  )
}
