'use client'

import { useState } from 'react'

export interface Workshop {
  id: string
  title: string
  description?: string
  short_description?: string
  event_date: string
  start_time: string
  end_time: string
  timezone: string
  location_type: 'online' | 'in-person' | 'hybrid'
  location_name?: string
  location_address?: string
  location_city?: string
  location_state?: string
  location_country?: string
  registration_url?: string
  max_capacity?: number
  current_attendees: number
  cover_image_url?: string
  thumbnail_url?: string
  luma_url?: string
  organizers?: Array<{ name: string; email?: string }>
  tags?: string[]
  status: string
  is_free: boolean
  ticket_price?: number
  currency?: string
}

interface WorkshopDetailProps {
  workshop: Workshop
  onClose?: () => void
}

export function WorkshopDetail({ workshop, onClose }: WorkshopDetailProps) {
  const [showLumaEmbed, setShowLumaEmbed] = useState(false)

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  // Format time
  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  // Calculate capacity percentage
  const capacityPercentage = workshop.max_capacity
    ? (workshop.current_attendees / workshop.max_capacity) * 100
    : null

  // Get location icon
  const getLocationIcon = () => {
    switch (workshop.location_type) {
      case 'online':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
            />
          </svg>
        )
      case 'in-person':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        )
      case 'hybrid':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        )
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm">
      <div className="min-h-screen px-4 py-8">
        <div className="relative mx-auto max-w-5xl bg-gradient-to-br from-[#201033] via-[#15092b] to-[#0a0513] rounded-2xl shadow-2xl border border-white/10">
          {/* Close button */}
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
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
          )}

          {/* Cover Image */}
          {workshop.cover_image_url && (
            <div className="relative h-64 sm:h-80 rounded-t-2xl overflow-hidden">
              <img
                src={workshop.cover_image_url}
                alt={workshop.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#201033] to-transparent" />
            </div>
          )}

          {/* Content */}
          <div className="p-6 sm:p-8">
            {/* Title and Tags */}
            <div className="mb-6">
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
                {workshop.title}
              </h1>
              {workshop.tags && workshop.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {workshop.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 text-xs font-medium bg-fuchsia-500/20 text-fuchsia-300 rounded-full border border-fuchsia-500/30"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Key Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Date & Time */}
              <div className="p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                <div className="flex items-center gap-3 text-slate-300">
                  <svg className="w-5 h-5 text-fuchsia-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {formatDate(workshop.event_date)}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatTime(workshop.start_time)} - {formatTime(workshop.end_time)}{' '}
                      {workshop.timezone}
                    </p>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                <div className="flex items-center gap-3 text-slate-300">
                  <span className="text-fuchsia-400">{getLocationIcon()}</span>
                  <div>
                    <p className="text-sm font-medium text-white capitalize">
                      {workshop.location_type}
                    </p>
                    {workshop.location_name && (
                      <p className="text-xs text-slate-400">{workshop.location_name}</p>
                    )}
                    {workshop.location_city && (
                      <p className="text-xs text-slate-400">
                        {workshop.location_city}
                        {workshop.location_state && `, ${workshop.location_state}`}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Attendees */}
              {workshop.max_capacity && (
                <div className="p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                  <div className="flex items-center gap-3 text-slate-300">
                    <svg className="w-5 h-5 text-fuchsia-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">
                        {workshop.current_attendees} / {workshop.max_capacity} Attendees
                      </p>
                      {capacityPercentage !== null && (
                        <div className="mt-2 w-full bg-white/10 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-fuchsia-500 to-purple-600 transition-all"
                            style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Price */}
              <div className="p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                <div className="flex items-center gap-3 text-slate-300">
                  <svg className="w-5 h-5 text-fuchsia-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {workshop.is_free
                        ? 'Free'
                        : `${workshop.currency || 'USD'} ${workshop.ticket_price || 0}`}
                    </p>
                    <p className="text-xs text-slate-400">Registration</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            {workshop.description && (
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-white mb-3">About this Workshop</h3>
                <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {workshop.description}
                </p>
              </div>
            )}

            {/* Organizers */}
            {workshop.organizers && workshop.organizers.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-white mb-3">Organizers</h3>
                <div className="flex flex-wrap gap-3">
                  {workshop.organizers.map((organizer, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                        {organizer.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-white">{organizer.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Registration Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              {workshop.luma_url && (
                <a
                  href={workshop.luma_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-fuchsia-500 to-purple-600 rounded-xl font-semibold text-white shadow-lg shadow-fuchsia-500/25 hover:shadow-fuchsia-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                    />
                  </svg>
                  Register on Luma
                </a>
              )}

              {workshop.registration_url && workshop.registration_url !== workshop.luma_url && (
                <a
                  href={workshop.registration_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-sm rounded-xl font-semibold text-white border border-white/20 hover:bg-white/20 transition-all"
                >
                  Register Now
                </a>
              )}
            </div>

            {/* Luma Embed Toggle */}
            {workshop.luma_url && (
              <div className="mt-4">
                <button
                  onClick={() => setShowLumaEmbed(!showLumaEmbed)}
                  className="text-sm text-fuchsia-400 hover:text-fuchsia-300 underline"
                >
                  {showLumaEmbed ? 'Hide' : 'Show'} embedded registration
                </button>

                {showLumaEmbed && (
                  <div className="mt-4 rounded-xl overflow-hidden border border-white/10">
                    <iframe
                      src={`${workshop.luma_url}/embed`}
                      className="w-full h-[600px]"
                      frameBorder="0"
                      allowFullScreen
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
