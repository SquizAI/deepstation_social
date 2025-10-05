'use client'

import type { Event } from '@/lib/types/event'

interface RegistrationCardProps {
  event: Event
  onRegisterClick: () => void
}

export function RegistrationCard({ event, onRegisterClick }: RegistrationCardProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const addToCalendar = (type: 'google' | 'apple' | 'outlook') => {
    const startDate = new Date(`${event.event_date}T${event.start_time}`)
    const endDate = new Date(`${event.event_date}T${event.end_time}`)

    const title = encodeURIComponent(event.title)
    const description = encodeURIComponent(event.description || '')
    const location = encodeURIComponent(
      event.location_type === 'online'
        ? event.meeting_url || 'Online'
        : event.location_name || ''
    )

    if (type === 'google') {
      const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDate
        .toISOString()
        .replace(/[-:]/g, '')
        .replace(/\.\d{3}/, '')}/${endDate
        .toISOString()
        .replace(/[-:]/g, '')
        .replace(/\.\d{3}/, '')}&details=${description}&location=${location}`
      window.open(url, '_blank')
    } else if (type === 'apple' || type === 'outlook') {
      const ics = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:${event.title}
DESCRIPTION:${event.description || ''}
LOCATION:${event.location_type === 'online' ? event.meeting_url || 'Online' : event.location_name || ''}
DTSTART:${startDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}
DTEND:${endDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}
END:VEVENT
END:VCALENDAR`

      const blob = new Blob([ics], { type: 'text/calendar' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${event.slug}.ics`
      link.click()
    }
  }

  const shareEvent = (platform: 'twitter' | 'linkedin' | 'facebook') => {
    const url = encodeURIComponent(window.location.href)
    const text = encodeURIComponent(event.title)

    const urls = {
      twitter: `https://twitter.com/intent/tweet?url=${url}&text=${text}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    }

    window.open(urls[platform], '_blank', 'width=600,height=400')
  }

  const isSoldOut = !!(event.max_capacity && event.current_attendees >= event.max_capacity)
  const spotsLeft = event.max_capacity ? event.max_capacity - event.current_attendees : null

  return (
    <div className="sticky top-6 space-y-6">
      {/* Registration Card */}
      <div className="group relative bg-purple-950/30 backdrop-blur-md border border-purple-900/50 rounded-2xl p-6 overflow-hidden">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />

        <div className="relative space-y-6">
          {/* Date & Time */}
          <div>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-fuchsia-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-slate-400 uppercase tracking-wide mb-1">Date & Time</p>
                <p className="font-semibold text-white">{formatDate(event.event_date)}</p>
                <p className="text-sm text-slate-300 mt-1">
                  {formatTime(event.start_time)} - {formatTime(event.end_time)} {event.timezone}
                </p>
              </div>
            </div>

            {/* Add to Calendar */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => addToCalendar('google')}
                className="px-3 py-2 bg-purple-950/30 border border-purple-900/30 rounded-lg text-xs text-slate-300 hover:bg-purple-950/50 hover:border-fuchsia-500/30 transition-all font-medium"
              >
                Google
              </button>
              <button
                onClick={() => addToCalendar('apple')}
                className="px-3 py-2 bg-purple-950/30 border border-purple-900/30 rounded-lg text-xs text-slate-300 hover:bg-purple-950/50 hover:border-fuchsia-500/30 transition-all font-medium"
              >
                Apple
              </button>
              <button
                onClick={() => addToCalendar('outlook')}
                className="px-3 py-2 bg-purple-950/30 border border-purple-900/30 rounded-lg text-xs text-slate-300 hover:bg-purple-950/50 hover:border-fuchsia-500/30 transition-all font-medium"
              >
                Outlook
              </button>
            </div>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-purple-700/50 to-transparent" />

          {/* Location */}
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-fuchsia-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-slate-400 uppercase tracking-wide mb-1">Location</p>
              <p className="font-semibold text-white capitalize">{event.location_type}</p>
              {event.location_type === 'online' && (
                <p className="text-sm text-slate-300 mt-1">Link sent after registration</p>
              )}
              {event.location_name && (
                <p className="text-sm text-slate-300 mt-1">{event.location_name}</p>
              )}
              {event.location_city && (
                <p className="text-sm text-slate-300">
                  {event.location_city}
                  {event.location_state && `, ${event.location_state}`}
                </p>
              )}
            </div>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-purple-700/50 to-transparent" />

          {/* Price */}
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-fuchsia-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-slate-400 uppercase tracking-wide mb-1">Admission</p>
              <p className="font-semibold text-white text-lg">
                {event.is_free ? 'Free Event' : 'Paid Event'}
              </p>
              {!event.is_free && event.ticket_types && event.ticket_types.length > 0 && (
                <p className="text-sm text-slate-300 mt-1">
                  Starting at {event.ticket_types[0].currency}{' '}
                  {Math.min(...event.ticket_types.map((t) => t.price))}
                </p>
              )}
            </div>
          </div>

          {/* Capacity */}
          {event.max_capacity && (
            <>
              <div className="h-px bg-gradient-to-r from-transparent via-purple-700/50 to-transparent" />
              <div>
                <div className="flex items-center justify-between text-sm mb-3">
                  <span className="text-slate-400 font-medium">
                    {event.current_attendees} of {event.max_capacity} spots filled
                  </span>
                  {spotsLeft !== null && spotsLeft > 0 && spotsLeft <= 10 && (
                    <span className="text-yellow-400 font-semibold animate-pulse">
                      Only {spotsLeft} left!
                    </span>
                  )}
                </div>
                <div className="w-full bg-purple-950/40 rounded-full h-3 overflow-hidden border border-purple-900/30">
                  <div
                    className="h-full bg-gradient-to-r from-fuchsia-500 to-purple-600 shadow-lg shadow-fuchsia-500/50 transition-all duration-500"
                    style={{
                      width: `${Math.min((event.current_attendees / event.max_capacity) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
            </>
          )}

          {/* Register Button */}
          <button
            onClick={onRegisterClick}
            disabled={isSoldOut}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all transform ${
              isSoldOut
                ? 'bg-slate-700/50 text-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white shadow-xl shadow-fuchsia-500/30 hover:shadow-fuchsia-500/50 hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            {isSoldOut
              ? event.allow_waitlist
                ? '🎫 Join Waitlist'
                : '❌ Sold Out'
              : event.is_free
                ? '🎉 Register for Free'
                : '🎟️ Get Your Ticket'}
          </button>

          {/* Social Proof */}
          {event.current_attendees > 0 && (
            <div className="text-center text-sm text-slate-400">
              <span className="inline-flex items-center gap-1">
                <svg className="w-4 h-4 text-fuchsia-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
                <span className="font-medium text-white">{event.current_attendees}</span> people already registered
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Share Card */}
      <div className="bg-purple-950/20 backdrop-blur-sm border border-purple-900/30 rounded-2xl p-6">
        <p className="text-sm text-slate-400 uppercase tracking-wide mb-4">Share This Event</p>
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => shareEvent('twitter')}
            className="group relative p-4 bg-purple-950/30 border border-purple-900/30 rounded-xl hover:border-fuchsia-500/50 hover:bg-purple-950/50 transition-all"
          >
            <svg className="w-6 h-6 text-slate-300 group-hover:text-fuchsia-400 mx-auto transition-colors" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            <p className="text-xs text-slate-400 mt-2">X</p>
          </button>
          <button
            onClick={() => shareEvent('linkedin')}
            className="group relative p-4 bg-purple-950/30 border border-purple-900/30 rounded-xl hover:border-fuchsia-500/50 hover:bg-purple-950/50 transition-all"
          >
            <svg className="w-6 h-6 text-slate-300 group-hover:text-fuchsia-400 mx-auto transition-colors" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
            <p className="text-xs text-slate-400 mt-2">LinkedIn</p>
          </button>
          <button
            onClick={() => shareEvent('facebook')}
            className="group relative p-4 bg-purple-950/30 border border-purple-900/30 rounded-xl hover:border-fuchsia-500/50 hover:bg-purple-950/50 transition-all"
          >
            <svg className="w-6 h-6 text-slate-300 group-hover:text-fuchsia-400 mx-auto transition-colors" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            <p className="text-xs text-slate-400 mt-2">Facebook</p>
          </button>
        </div>
      </div>
    </div>
  )
}
