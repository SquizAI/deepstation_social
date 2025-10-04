'use client'

import type { Event } from '@/lib/types/event'
import Link from 'next/link'

interface EventCardProps {
  event: Event
  isManagement?: boolean
}

export function EventCard({ event, isManagement = false }: EventCardProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const month = date.toLocaleDateString('en-US', { month: 'short' })
    const day = date.getDate()
    return { month, day }
  }

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const { month, day } = formatDate(event.event_date)

  const getLocationBadgeColor = () => {
    switch (event.location_type) {
      case 'online':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
      case 'in-person':
        return 'bg-green-500/20 text-green-300 border-green-500/30'
      case 'hybrid':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30'
    }
  }

  const getStatusBadgeColor = () => {
    switch (event.status) {
      case 'published':
        return 'bg-green-500/20 text-green-300 border-green-500/30'
      case 'draft':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
      case 'cancelled':
        return 'bg-red-500/20 text-red-300 border-red-500/30'
      case 'completed':
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    }
  }

  const href = isManagement ? `/dashboard/events/${event.id}` : `/events/${event.slug}`

  return (
    <Link href={href}>
      <div className="group relative bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden hover:bg-white/10 hover:border-fuchsia-500/30 transition-all cursor-pointer">
        {/* Date Badge */}
        <div className="absolute top-4 left-4 z-10 bg-gradient-to-br from-fuchsia-500 to-purple-600 rounded-lg px-3 py-2 text-center shadow-lg">
          <div className="text-xs font-semibold text-white uppercase">{month}</div>
          <div className="text-2xl font-bold text-white leading-none">{day}</div>
        </div>

        {/* Status Badge (Management Only) */}
        {isManagement && (
          <div className="absolute top-4 right-4 z-10">
            <span
              className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full border ${getStatusBadgeColor()}`}
            >
              {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
            </span>
          </div>
        )}

        {/* Cover Image */}
        {event.cover_image_url ? (
          <div className="relative h-48 bg-gradient-to-br from-purple-900/20 to-fuchsia-900/20">
            <img
              src={event.cover_image_url}
              alt={event.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#201033] via-transparent to-transparent" />
          </div>
        ) : (
          <div className="h-48 bg-gradient-to-br from-purple-900/20 to-fuchsia-900/20 flex items-center justify-center">
            <svg
              className="w-16 h-16 text-white/20"
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

        {/* Content */}
        <div className="p-4">
          {/* Title */}
          <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2 group-hover:text-fuchsia-400 transition-colors">
            {event.title}
          </h3>

          {/* Short Description */}
          {event.short_description && (
            <p className="text-sm text-slate-400 mb-3 line-clamp-2">
              {event.short_description}
            </p>
          )}

          {/* Meta Info */}
          <div className="space-y-2">
            {/* Time */}
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

            {/* Location Type Badge */}
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border ${getLocationBadgeColor()}`}
              >
                {event.location_type === 'online' && (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                    />
                  </svg>
                )}
                {event.location_type === 'in-person' && (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                  </svg>
                )}
                {event.location_type === 'hybrid' && (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945"
                    />
                  </svg>
                )}
                <span className="capitalize">{event.location_type}</span>
              </span>

              {event.location_city && (
                <span className="text-xs text-slate-400">
                  {event.location_city}
                  {event.location_state && `, ${event.location_state}`}
                </span>
              )}
            </div>

            {/* Attendees Progress */}
            {event.max_capacity && (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span>
                      {event.current_attendees} / {event.max_capacity}
                    </span>
                    <span className="text-xs">
                      {Math.round((event.current_attendees / event.max_capacity) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-1 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-fuchsia-500 to-purple-600"
                      style={{
                        width: `${Math.min(
                          (event.current_attendees / event.max_capacity) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Tags */}
          {event.tags && event.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {event.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 text-xs bg-fuchsia-500/10 text-fuchsia-300 rounded"
                >
                  {tag}
                </span>
              ))}
              {event.tags.length > 3 && (
                <span className="px-2 py-0.5 text-xs text-slate-400">
                  +{event.tags.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Management Stats */}
          {isManagement && (
            <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
              <span>{event.current_attendees} registered</span>
              {!event.is_free && event.ticket_types && event.ticket_types.length > 0 && (
                <span>
                  {event.ticket_types[0].currency}{' '}
                  {event.ticket_types.reduce((sum, t) => sum + t.price * t.quantity_sold, 0)}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Hover Indicator */}
        <div className="absolute inset-0 border-2 border-transparent group-hover:border-fuchsia-500/50 rounded-xl pointer-events-none transition-all" />
      </div>
    </Link>
  )
}
