'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface EventRegistrationButtonProps {
  eventId: string
  eventSlug: string
  isRegistered: boolean
  isLoggedIn: boolean
  isFull: boolean
}

export function EventRegistrationButton({
  eventId,
  eventSlug,
  isRegistered,
  isLoggedIn,
  isFull
}: EventRegistrationButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [registered, setRegistered] = useState(isRegistered)

  const handleRegister = async () => {
    if (!isLoggedIn) {
      router.push(`/login?redirect=/events/${eventSlug}`)
      return
    }

    setLoading(true)
    const supabase = createClient()

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push(`/login?redirect=/events/${eventSlug}`)
        return
      }

      // Register for event
      const { error } = await supabase
        .from('event_registrations')
        .insert({
          event_id: eventId,
          user_id: user.id,
          status: 'registered'
        })

      if (error) {
        console.error('Registration error:', error)
        alert('Failed to register. Please try again.')
      } else {
        setRegistered(true)
        router.refresh()
      }
    } catch (error) {
      console.error('Registration error:', error)
      alert('Failed to register. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelRegistration = async () => {
    if (!confirm('Are you sure you want to cancel your registration?')) {
      return
    }

    setLoading(true)
    const supabase = createClient()

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      // Cancel registration
      const { error } = await supabase
        .from('event_registrations')
        .update({ status: 'cancelled' })
        .eq('event_id', eventId)
        .eq('user_id', user.id)

      if (error) {
        console.error('Cancellation error:', error)
        alert('Failed to cancel. Please try again.')
      } else {
        setRegistered(false)
        router.refresh()
      }
    } catch (error) {
      console.error('Cancellation error:', error)
      alert('Failed to cancel. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (registered) {
    return (
      <button
        onClick={handleCancelRegistration}
        disabled={loading}
        className="w-full bg-white/10 backdrop-blur-sm text-white px-6 py-4 rounded-xl font-bold border-2 border-white/20 hover:bg-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Processing...' : 'Cancel Registration'}
      </button>
    )
  }

  if (isFull) {
    return (
      <button
        disabled
        className="w-full bg-slate-600/50 text-slate-400 px-6 py-4 rounded-xl font-bold cursor-not-allowed"
      >
        Event Full
      </button>
    )
  }

  return (
    <button
      onClick={handleRegister}
      disabled={loading}
      className="w-full bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white px-6 py-4 rounded-xl font-bold hover:scale-105 transition-all shadow-lg shadow-fuchsia-500/30 hover:shadow-fuchsia-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
    >
      {loading ? 'Processing...' : isLoggedIn ? 'Register for Event' : 'Sign In to Register'}
    </button>
  )
}
