'use client'

import { useState } from 'react'
import type { Event } from '@/lib/types/event'
import { RegistrationForm } from '@/components/events/registration-form'

interface EventLandingClientProps {
  event: Event
}

export function EventLandingClient({ event }: EventLandingClientProps) {
  const [showRegistration, setShowRegistration] = useState(false)

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

  const isSoldOut = !!(event.max_capacity && event.current_attendees >= event.max_capacity)
  const spotsLeft = event.max_capacity ? event.max_capacity - event.current_attendees : null

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
      // Generate ICS file
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#201033] via-[#15092b] to-[#0a0513]">
      {/* Hero Section */}
      {event.cover_image_url ? (
        <div className="relative h-[400px] md:h-[500px]">
          <img
            src={event.cover_image_url}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#201033] via-[#201033]/80 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <div className="max-w-5xl mx-auto">
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">{event.title}</h1>
              {event.short_description && (
                <p className="text-xl text-slate-300 max-w-3xl">{event.short_description}</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-purple-900/20 to-fuchsia-900/20 py-20 px-8">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">{event.title}</h1>
            {event.short_description && (
              <p className="text-xl text-slate-300 max-w-3xl">{event.short_description}</p>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Event Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* About */}
            {event.description && (
              <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
                <h2 className="text-2xl font-bold text-white mb-4">About This Event</h2>
                <div className="prose prose-invert max-w-none">
                  <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {event.description}
                  </p>
                </div>
              </div>
            )}

            {/* Hosts */}
            {event.hosts && event.hosts.length > 0 && (
              <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
                <h2 className="text-2xl font-bold text-white mb-4">
                  {event.hosts.length === 1 ? 'Host' : 'Hosts'}
                </h2>
                <div className="space-y-4">
                  {event.hosts.map((host) => (
                    <div key={host.id} className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                        {host.avatar_url ? (
                          <img
                            src={host.avatar_url}
                            alt={host.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          host.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white">{host.name}</h3>
                        {host.title && <p className="text-sm text-slate-400">{host.title}</p>}
                        {host.bio && (
                          <p className="text-sm text-slate-300 mt-2">{host.bio}</p>
                        )}
                        {host.social_links && (
                          <div className="flex gap-3 mt-2">
                            {host.social_links.linkedin && (
                              <a
                                href={host.social_links.linkedin}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-slate-400 hover:text-fuchsia-400"
                              >
                                LinkedIn
                              </a>
                            )}
                            {host.social_links.twitter && (
                              <a
                                href={host.social_links.twitter}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-slate-400 hover:text-fuchsia-400"
                              >
                                X
                              </a>
                            )}
                            {host.social_links.website && (
                              <a
                                href={host.social_links.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-slate-400 hover:text-fuchsia-400"
                              >
                                Website
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Registration Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 space-y-6">
              {/* Date & Time */}
              <div>
                <div className="flex items-center gap-3 text-slate-300 mb-3">
                  <svg
                    className="w-5 h-5 text-fuchsia-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <div>
                    <p className="font-medium text-white">{formatDate(event.event_date)}</p>
                    <p className="text-sm text-slate-400">
                      {formatTime(event.start_time)} - {formatTime(event.end_time)} {event.timezone}
                    </p>
                  </div>
                </div>

                {/* Add to Calendar */}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => addToCalendar('google')}
                    className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-slate-300 hover:bg-white/10 transition-all"
                  >
                    Google
                  </button>
                  <button
                    onClick={() => addToCalendar('apple')}
                    className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-slate-300 hover:bg-white/10 transition-all"
                  >
                    Apple
                  </button>
                  <button
                    onClick={() => addToCalendar('outlook')}
                    className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-slate-300 hover:bg-white/10 transition-all"
                  >
                    Outlook
                  </button>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-start gap-3 text-slate-300">
                <svg
                  className="w-5 h-5 text-fuchsia-400 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                </svg>
                <div>
                  <p className="font-medium text-white capitalize">{event.location_type}</p>
                  {event.location_type === 'online' && event.meeting_url && (
                    <p className="text-sm text-slate-400">Meeting link will be sent after registration</p>
                  )}
                  {event.location_name && (
                    <p className="text-sm text-slate-400">{event.location_name}</p>
                  )}
                  {event.location_city && (
                    <p className="text-sm text-slate-400">
                      {event.location_city}
                      {event.location_state && `, ${event.location_state}`}
                    </p>
                  )}
                </div>
              </div>

              {/* Price */}
              <div className="flex items-center gap-3 text-slate-300">
                <svg
                  className="w-5 h-5 text-fuchsia-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                  />
                </svg>
                <div>
                  <p className="font-medium text-white">
                    {event.is_free ? 'Free' : 'Paid Event'}
                  </p>
                  {!event.is_free && event.ticket_types && event.ticket_types.length > 0 && (
                    <p className="text-sm text-slate-400">
                      Starting at {event.ticket_types[0].currency}{' '}
                      {Math.min(...event.ticket_types.map((t) => t.price))}
                    </p>
                  )}
                </div>
              </div>

              {/* Capacity */}
              {event.max_capacity && (
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-slate-400">
                      {event.current_attendees} / {event.max_capacity} registered
                    </span>
                    {spotsLeft !== null && spotsLeft > 0 && spotsLeft <= 10 && (
                      <span className="text-yellow-400">{spotsLeft} spots left</span>
                    )}
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-fuchsia-500 to-purple-600"
                      style={{
                        width: `${Math.min((event.current_attendees / event.max_capacity) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Register Button */}
              <button
                onClick={() => setShowRegistration(true)}
                disabled={isSoldOut}
                className={`w-full py-3 rounded-lg font-semibold transition-all ${
                  isSoldOut
                    ? 'bg-gray-500/20 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white shadow-lg shadow-fuchsia-500/25 hover:shadow-fuchsia-500/40 hover:scale-[1.02] active:scale-[0.98]'
                }`}
              >
                {isSoldOut
                  ? event.allow_waitlist
                    ? 'Join Waitlist'
                    : 'Sold Out'
                  : event.is_free
                    ? 'Register for Free'
                    : 'Get Tickets'}
              </button>

              {/* Share Buttons */}
              <div className="pt-6 border-t border-white/10">
                <p className="text-sm text-slate-400 mb-3">Share this event:</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => shareEvent('twitter')}
                    className="flex-1 p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all"
                  >
                    <svg className="w-5 h-5 text-slate-300 mx-auto" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => shareEvent('linkedin')}
                    className="flex-1 p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all"
                  >
                    <svg className="w-5 h-5 text-slate-300 mx-auto" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => shareEvent('facebook')}
                    className="flex-1 p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all"
                  >
                    <svg className="w-5 h-5 text-slate-300 mx-auto" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tags */}
        {event.tags && event.tags.length > 0 && (
          <div className="mt-12">
            <div className="flex flex-wrap gap-2">
              {event.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-4 py-2 bg-fuchsia-500/10 text-fuchsia-300 rounded-full text-sm border border-fuchsia-500/30"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Registration Modal */}
      {showRegistration && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm">
          <div className="min-h-screen px-4 py-8 flex items-center justify-center">
            <div className="relative bg-gradient-to-br from-[#201033] via-[#15092b] to-[#0a0513] rounded-2xl border border-white/10 max-w-2xl w-full p-8">
              <button
                onClick={() => setShowRegistration(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>

              <h2 className="text-2xl font-bold text-white mb-6">Register for {event.title}</h2>
              <RegistrationForm
                event={event}
                onSuccess={() => {
                  setShowRegistration(false)
                  // Show success message or redirect
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
