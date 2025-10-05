'use client'

import { useState, useEffect } from 'react'
import type { Event } from '@/lib/types/event'

interface HeroSectionProps {
  event: Event
  onRegisterClick: () => void
}

export function HeroSection({ event, onRegisterClick }: HeroSectionProps) {
  const [timeRemaining, setTimeRemaining] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })

  useEffect(() => {
    const eventDateTime = new Date(`${event.event_date}T${event.start_time}`)

    const updateCountdown = () => {
      const now = new Date()
      const diff = eventDateTime.getTime() - now.getTime()

      if (diff > 0) {
        setTimeRemaining({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((diff % (1000 * 60)) / 1000),
        })
      }
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)
    return () => clearInterval(interval)
  }, [event.event_date, event.start_time])

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  return (
    <div className="relative overflow-hidden">
      {/* Hero Background */}
      {event.cover_image_url ? (
        <div className="absolute inset-0">
          <img
            src={event.cover_image_url}
            alt={event.title}
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0513]/60 via-[#0a0513]/80 to-[#0a0513]" />
        </div>
      ) : null}

      <div className="relative max-w-7xl mx-auto px-6 py-20 md:py-32">
        {/* Event Category/Type Badge */}
        <div className="flex items-center gap-3 mb-6">
          <span className="px-4 py-2 bg-gradient-to-r from-fuchsia-500/20 to-purple-500/20 border border-fuchsia-500/30 rounded-full text-sm font-semibold text-fuchsia-300 backdrop-blur-sm">
            {event.location_type === 'online' ? '🌐 Virtual Event' : '📍 In-Person Event'}
          </span>
          {event.is_free && (
            <span className="px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-full text-sm font-semibold text-green-300 backdrop-blur-sm">
              🎉 Free
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-white via-fuchsia-100 to-purple-100 bg-clip-text text-transparent mb-6 max-w-4xl leading-tight">
          {event.title}
        </h1>

        {/* Short Description */}
        {event.short_description && (
          <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mb-12 leading-relaxed">
            {event.short_description}
          </p>
        )}

        {/* Countdown Timer */}
        <div className="bg-purple-950/30 backdrop-blur-md border border-purple-900/50 rounded-2xl p-8 mb-8 max-w-3xl">
          <p className="text-sm text-slate-400 uppercase tracking-wider mb-4">Event Starts In</p>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Days', value: timeRemaining.days },
              { label: 'Hours', value: timeRemaining.hours },
              { label: 'Minutes', value: timeRemaining.minutes },
              { label: 'Seconds', value: timeRemaining.seconds },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-br from-fuchsia-400 to-purple-400 bg-clip-text text-transparent mb-2">
                  {String(item.value).padStart(2, '0')}
                </div>
                <div className="text-xs text-slate-400 uppercase tracking-wide">{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl">
          <div className="bg-purple-950/20 backdrop-blur-sm border border-purple-900/30 rounded-xl p-4">
            <div className="text-2xl font-bold text-white mb-1">{event.current_attendees}</div>
            <div className="text-xs text-slate-400 uppercase tracking-wide">Registered</div>
          </div>
          <div className="bg-purple-950/20 backdrop-blur-sm border border-purple-900/30 rounded-xl p-4">
            <div className="text-2xl font-bold text-white mb-1">
              {formatTime(event.start_time).split(' ')[0]}
            </div>
            <div className="text-xs text-slate-400 uppercase tracking-wide">Start Time</div>
          </div>
          <div className="bg-purple-950/20 backdrop-blur-sm border border-purple-900/30 rounded-xl p-4">
            <div className="text-2xl font-bold text-white mb-1 capitalize">{event.location_type}</div>
            <div className="text-xs text-slate-400 uppercase tracking-wide">Format</div>
          </div>
          <div className="bg-purple-950/20 backdrop-blur-sm border border-purple-900/30 rounded-xl p-4">
            <div className="text-2xl font-bold text-white mb-1">{event.is_free ? 'Free' : 'Paid'}</div>
            <div className="text-xs text-slate-400 uppercase tracking-wide">Admission</div>
          </div>
        </div>
      </div>
    </div>
  )
}
