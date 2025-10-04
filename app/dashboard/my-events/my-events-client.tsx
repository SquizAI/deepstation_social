'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { EventRegistration, Event } from '@/lib/types/event'

interface RegistrationWithEvent extends EventRegistration {
  event: Event
}

interface MyEventsClientProps {
  registrations: RegistrationWithEvent[]
}

export function MyEventsClient({ registrations: initialRegistrations }: MyEventsClientProps) {
  const [filter, setFilter] = useState<'upcoming' | 'past'>('upcoming')

  const filteredRegistrations = initialRegistrations.filter((reg) => {
    const eventDate = new Date(reg.event.event_date)
    const now = new Date()

    if (filter === 'upcoming') {
      return eventDate >= now
    } else {
      return eventDate < now
    }
  })

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const addToCalendar = (event: Event) => {
    const startDate = new Date(`${event.event_date}T${event.start_time}`)
    const endDate = new Date(`${event.event_date}T${event.end_time}`)

    const title = encodeURIComponent(event.title)
    const description = encodeURIComponent(event.description || '')
    const location = encodeURIComponent(
      event.location_type === 'online' ? event.meeting_url || 'Online' : event.location_name || ''
    )

    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDate
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}/, '')}/${endDate
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}/, '')}&details=${description}&location=${location}`

    window.open(url, '_blank')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#201033] via-[#15092b] to-[#0a0513] p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">My Events</h1>
          <p className="text-slate-400">Events you've registered for</p>
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter('upcoming')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              filter === 'upcoming'
                ? 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30'
                : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setFilter('past')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              filter === 'past'
                ? 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30'
                : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            Past
          </button>
        </div>

        {/* Events List */}
        {filteredRegistrations.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-12 text-center">
            <svg
              className="w-16 h-16 text-slate-400 mx-auto mb-4"
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
            <h3 className="text-xl font-semibold text-white mb-2">No {filter} events</h3>
            <p className="text-slate-400">
              {filter === 'upcoming'
                ? "You haven't registered for any upcoming events yet"
                : "You haven't attended any past events yet"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRegistrations.map((registration) => {
              const event = registration.event
              return (
                <div
                  key={registration.id}
                  className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden hover:bg-white/10 hover:border-fuchsia-500/30 transition-all"
                >
                  <div className="flex flex-col md:flex-row">
                    {/* Event Image */}
                    {event.cover_image_url ? (
                      <div className="md:w-64 h-48 md:h-auto bg-gradient-to-br from-purple-900/20 to-fuchsia-900/20">
                        <img
                          src={event.cover_image_url}
                          alt={event.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="md:w-64 h-48 md:h-auto bg-gradient-to-br from-purple-900/20 to-fuchsia-900/20 flex items-center justify-center">
                        <svg
                          className="w-12 h-12 text-white/20"
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
                      </div>
                    )}

                    {/* Event Details */}
                    <div className="flex-1 p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <Link
                            href={`/events/${event.slug}`}
                            className="text-xl font-bold text-white hover:text-fuchsia-400 transition-colors"
                          >
                            {event.title}
                          </Link>
                          {event.short_description && (
                            <p className="text-sm text-slate-400 mt-1">
                              {event.short_description}
                            </p>
                          )}
                        </div>
                        {registration.check_in_status === 'checked_in' && (
                          <span className="px-3 py-1 bg-green-500/20 text-green-300 text-xs rounded-full border border-green-500/30">
                            Attended
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-sm text-slate-300">
                          <svg
                            className="w-4 h-4 text-fuchsia-400"
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
                          <span>{formatDate(event.event_date)}</span>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-slate-300">
                          <svg
                            className="w-4 h-4 text-fuchsia-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span>
                            {formatTime(event.start_time)} - {formatTime(event.end_time)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-slate-300">
                          <svg
                            className="w-4 h-4 text-fuchsia-400"
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
                          <span className="capitalize">{event.location_type}</span>
                        </div>

                        {event.location_city && (
                          <div className="flex items-center gap-2 text-sm text-slate-300">
                            <svg
                              className="w-4 h-4 text-fuchsia-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                              />
                            </svg>
                            <span>
                              {event.location_city}
                              {event.location_state && `, ${event.location_state}`}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-3">
                        <Link
                          href={`/events/${event.slug}`}
                          className="px-4 py-2 bg-fuchsia-500/20 text-fuchsia-300 rounded-lg hover:bg-fuchsia-500/30 transition-all text-sm font-medium"
                        >
                          View Details
                        </Link>
                        <button
                          onClick={() => addToCalendar(event)}
                          className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all text-sm font-medium"
                        >
                          Add to Calendar
                        </button>
                        {event.location_type === 'online' && event.meeting_url && (
                          <a
                            href={event.meeting_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-green-500/20 text-green-300 rounded-lg hover:bg-green-500/30 transition-all text-sm font-medium"
                          >
                            Join Meeting
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
