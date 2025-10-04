'use client'

import React, { useState, useMemo } from 'react'
import { PublicCalendar } from '@/components/calendar/public-calendar'
import {
  filterEventsByLocation,
  searchEvents,
  getUpcomingEvents,
  type CalendarEvent
} from '@/lib/calendar/utils'
import Link from 'next/link'

interface PublicCalendarClientProps {
  events: CalendarEvent[]
}

export function PublicCalendarClient({ events }: PublicCalendarClientProps) {
  const [locationFilter, setLocationFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredEvents = useMemo(() => {
    let filtered = events

    // Apply location filter
    if (locationFilter !== 'all') {
      filtered = filterEventsByLocation(filtered, locationFilter)
    }

    // Apply search
    if (searchQuery.trim()) {
      filtered = searchEvents(filtered, searchQuery)
    }

    return filtered
  }, [events, locationFilter, searchQuery])

  const upcomingEvents = useMemo(
    () => getUpcomingEvents(filteredEvents, 6),
    [filteredEvents]
  )

  const locations = useMemo(() => {
    const locationSet = new Set<string>()
    events.forEach((event) => {
      if (event.location) {
        locationSet.add(event.location)
      }
    })
    return Array.from(locationSet).sort()
  }, [events])

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#201033] via-[#15092b] to-[#0a0513]">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-[float_20s_ease-in-out_infinite]"></div>
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-fuchsia-500/20 rounded-full blur-3xl animate-[float_25s_ease-in-out_infinite_reverse]"></div>
      </div>

      <div className="relative space-y-8 p-8 max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="text-center space-y-4 py-12">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-white via-fuchsia-200 to-purple-200 bg-clip-text text-transparent">
            DeepStation Events
          </h1>
          <p className="text-slate-300 text-xl max-w-2xl mx-auto">
            Join us for AI education events featuring expert speakers from around the world
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-slate-400 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-fuchsia-500" />
              <span>70+ Events Hosted</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-500" />
              <span>100+ Expert Speakers</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-500" />
              <span>3,000+ Community Members</span>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search events, speakers, topics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 pl-12 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                />
                <svg
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            {/* Location Filter */}
            <div className="flex gap-2">
              <button
                onClick={() => setLocationFilter('all')}
                className={`px-4 py-3 rounded-lg font-medium transition-all ${
                  locationFilter === 'all'
                    ? 'bg-gradient-to-r from-purple-500 to-fuchsia-600 text-white'
                    : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                All Locations
              </button>
              {locations.map((location) => (
                <button
                  key={location}
                  onClick={() => setLocationFilter(location)}
                  className={`px-4 py-3 rounded-lg font-medium transition-all ${
                    locationFilter === location
                      ? 'bg-gradient-to-r from-purple-500 to-fuchsia-600 text-white'
                      : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {location}
                </button>
              ))}
            </div>
          </div>

          {/* Results count */}
          <div className="mt-4 pt-4 border-t border-white/10 text-slate-400 text-sm">
            Showing {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Calendar */}
        <PublicCalendar events={filteredEvents} />

        {/* Upcoming Events List */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">Upcoming Events</h2>
            <p className="text-slate-400">Join us at these upcoming sessions</p>
          </div>

          {upcomingEvents.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-white/5 rounded-2xl flex items-center justify-center">
                <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-slate-400">No upcoming events found</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  className="group bg-white/5 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6 transition-all hover:bg-white/10 hover:border-purple-500/50"
                >
                  {/* Date Badge */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-shrink-0 bg-gradient-to-br from-purple-500 to-fuchsia-600 rounded-lg p-3 text-center">
                      <div className="text-xs text-white/80 uppercase tracking-wider">
                        {new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}
                      </div>
                      <div className="text-2xl font-bold text-white">
                        {new Date(event.date).getDate()}
                      </div>
                    </div>

                    {event.location && (
                      <span className="px-3 py-1 rounded-lg text-xs font-medium bg-white/10 text-slate-300 border border-white/20 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {event.location}
                      </span>
                    )}
                  </div>

                  {/* Event Details */}
                  <h3 className="font-bold text-white mb-2 line-clamp-2 group-hover:text-fuchsia-300 transition-colors">
                    {event.title}
                  </h3>

                  {event.speakerName && (
                    <p className="text-sm text-slate-400 mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {event.speakerName}
                    </p>
                  )}

                  {event.description && (
                    <p className="text-sm text-slate-400 line-clamp-3 mb-4">
                      {event.description}
                    </p>
                  )}

                  {event.time && (
                    <div className="text-xs text-slate-500 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {new Date(event.time).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-purple-500/20 to-fuchsia-500/20 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Want to Speak at DeepStation?
          </h2>
          <p className="text-slate-300 mb-6 max-w-2xl mx-auto">
            Share your AI expertise with our global community of 3,000+ members. We're always looking for passionate speakers to join our events.
          </p>
          <Link href="/dashboard/speakers/new">
            <button className="bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-fuchsia-500/50 hover:scale-105">
              Apply to Speak
            </button>
          </Link>
        </div>

        {/* Footer Info */}
        <div className="text-center text-slate-400 text-sm space-y-2">
          <p>DeepStation - Official OpenAI Academy Launch Partner</p>
          <div className="flex items-center justify-center gap-4">
            <span>Miami 🌴</span>
            <span>•</span>
            <span>Brazil 🇧🇷</span>
            <span>•</span>
            <span>Expanding Worldwide 🌍</span>
          </div>
        </div>
      </div>
    </div>
  )
}
