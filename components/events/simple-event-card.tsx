'use client'

import Link from 'next/link'
import { format } from 'date-fns'

interface SimpleEventCardProps {
  event: {
    id: string
    title: string
    description: string
    slug: string
    event_date: string
    event_time?: string
    image_url?: string
    location?: string
    max_attendees?: number
    attendee_count?: number
  }
  showRegisterButton?: boolean
}

export function SimpleEventCard({ event, showRegisterButton = true }: SimpleEventCardProps) {
  const eventDate = new Date(event.event_date)
  const dateStr = format(eventDate, 'MMM dd, yyyy')
  const dayOfMonth = format(eventDate, 'd')
  const month = format(eventDate, 'MMM')

  return (
    <div className="group relative">
      <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500/10 to-purple-500/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl overflow-hidden hover:border-fuchsia-500/30 transition-all group-hover:transform group-hover:scale-105">
        {/* Event Image */}
        <div className="relative h-48 overflow-hidden">
          {event.image_url ? (
            <img
              src={event.image_url}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-fuchsia-500/20 to-purple-600/20 flex items-center justify-center">
              <svg className="w-16 h-16 text-fuchsia-400/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
          )}

          {/* Date Badge */}
          <div className="absolute top-4 left-4 bg-gradient-to-br from-fuchsia-500 to-purple-600 rounded-2xl p-3 text-center shadow-lg shadow-fuchsia-500/50">
            <div className="text-2xl font-bold text-white">{dayOfMonth}</div>
            <div className="text-xs font-medium text-white/90 uppercase">{month}</div>
          </div>

          {/* Attendee Count Badge */}
          {event.max_attendees && (
            <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-2">
              <svg className="w-4 h-4 text-fuchsia-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
              <span className="text-xs font-medium text-white">
                {event.attendee_count || 0}/{event.max_attendees}
              </span>
            </div>
          )}
        </div>

        {/* Event Details */}
        <div className="p-6 space-y-4">
          <div>
            <h3 className="text-xl font-bold text-white mb-2 line-clamp-2 group-hover:text-fuchsia-400 transition-colors">
              {event.title}
            </h3>
            <p className="text-slate-400 text-sm line-clamp-3 leading-relaxed">
              {event.description}
            </p>
          </div>

          {/* Meta Info */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-slate-300">
              <svg className="w-4 h-4 text-fuchsia-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{dateStr}</span>
              {event.event_time && <span className="text-slate-400">at {event.event_time}</span>}
            </div>

            {event.location && (
              <div className="flex items-center gap-2 text-slate-300">
                <svg className="w-4 h-4 text-fuchsia-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="line-clamp-1">{event.location}</span>
              </div>
            )}
          </div>

          {/* Action Button */}
          {showRegisterButton && (
            <Link
              href={`/events/${event.slug}`}
              className="block w-full text-center bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-all shadow-lg shadow-fuchsia-500/30 hover:shadow-fuchsia-500/50"
            >
              Register Now
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
