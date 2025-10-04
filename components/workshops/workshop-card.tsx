'use client'

import type { Workshop } from './workshop-detail'

interface WorkshopCardProps {
  workshop: Workshop
  onClick?: () => void
}

export function WorkshopCard({ workshop, onClick }: WorkshopCardProps) {
  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const month = date.toLocaleDateString('en-US', { month: 'short' })
    const day = date.getDate()
    return { month, day }
  }

  // Format time
  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const { month, day } = formatDate(workshop.event_date)

  // Get location type badge color
  const getLocationBadgeColor = () => {
    switch (workshop.location_type) {
      case 'online':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
      case 'in-person':
        return 'bg-green-500/20 text-green-300 border-green-500/30'
      case 'hybrid':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30'
    }
  }

  return (
    <div
      onClick={onClick}
      className="group relative bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden hover:bg-white/10 hover:border-fuchsia-500/30 transition-all cursor-pointer"
    >
      {/* Date Badge */}
      <div className="absolute top-4 left-4 z-10 bg-gradient-to-br from-fuchsia-500 to-purple-600 rounded-lg px-3 py-2 text-center shadow-lg">
        <div className="text-xs font-semibold text-white uppercase">{month}</div>
        <div className="text-2xl font-bold text-white leading-none">{day}</div>
      </div>

      {/* Cover Image */}
      {workshop.cover_image_url || workshop.thumbnail_url ? (
        <div className="relative h-48 bg-gradient-to-br from-purple-900/20 to-fuchsia-900/20">
          <img
            src={workshop.cover_image_url || workshop.thumbnail_url}
            alt={workshop.title}
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
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
            />
          </svg>
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2 group-hover:text-fuchsia-400 transition-colors">
          {workshop.title}
        </h3>

        {/* Short Description */}
        {workshop.short_description && (
          <p className="text-sm text-slate-400 mb-3 line-clamp-2">
            {workshop.short_description}
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
              {formatTime(workshop.start_time)} - {formatTime(workshop.end_time)}
            </span>
          </div>

          {/* Location Type Badge */}
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border ${getLocationBadgeColor()}`}
            >
              {workshop.location_type === 'online' && (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                  />
                </svg>
              )}
              {workshop.location_type === 'in-person' && (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                </svg>
              )}
              {workshop.location_type === 'hybrid' && (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945"
                  />
                </svg>
              )}
              <span className="capitalize">{workshop.location_type}</span>
            </span>

            {workshop.location_city && (
              <span className="text-xs text-slate-400">
                {workshop.location_city}
                {workshop.location_state && `, ${workshop.location_state}`}
              </span>
            )}
          </div>

          {/* Attendees Progress */}
          {workshop.max_capacity && (
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
                    {workshop.current_attendees} / {workshop.max_capacity}
                  </span>
                  <span className="text-xs">
                    {Math.round((workshop.current_attendees / workshop.max_capacity) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-1 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-fuchsia-500 to-purple-600"
                    style={{
                      width: `${Math.min(
                        (workshop.current_attendees / workshop.max_capacity) * 100,
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
        {workshop.tags && workshop.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {workshop.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 text-xs bg-fuchsia-500/10 text-fuchsia-300 rounded"
              >
                {tag}
              </span>
            ))}
            {workshop.tags.length > 3 && (
              <span className="px-2 py-0.5 text-xs text-slate-400">
                +{workshop.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Hover Indicator */}
      <div className="absolute inset-0 border-2 border-transparent group-hover:border-fuchsia-500/50 rounded-xl pointer-events-none transition-all" />
    </div>
  )
}
